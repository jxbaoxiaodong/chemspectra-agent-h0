"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import FileUpload from "@/src/components/FileUpload";
import ResultsPanel from "@/src/components/ResultsPanel";
import FollowUpChat from "@/src/components/FollowUpChat";
import ReportDownload from "@/src/components/ReportDownload";
import HistorySidebar from "@/src/components/HistorySidebar";
import { analyzeStart, getStatus, confirm as confirmApi } from "@/src/lib/api";
import type { AnalyzeResponse } from "@/src/lib/types";

type Tab = "upload" | "peaks";

interface AgentEvent {
  type: string;
  data: Record<string, unknown>;
}

const ANALYSIS_TYPES = [
  { value: "identify", label: "Identify Material", desc: "Identify what an unknown sample is" },
  { value: "explain", label: "Explain Peaks", desc: "Assign chemical origin to each absorption peak" },
];

const TOOL_LABELS: Record<string, string> = {
  identify_material: "Material Identification",
  explain_peaks: "Peak Explanation",
  assign_functional_groups: "Functional Group Assignment",
  match_library_topk: "Library Matching",
  search_public_results: "Public Result Search",
};

interface ProcessedLine {
  text: string;
  kind: "phase" | "tool" | "result" | "verify" | "thinking";
}

function processEvents(events: AgentEvent[]): ProcessedLine[] {
  const lines: ProcessedLine[] = [];
  let thinkingBuf = "";

  for (const ev of events) {
    if (ev.type === "thinking" || ev.type === "synthesis_chunk") {
      thinkingBuf += (ev.data.text as string) || "";
      const sentences = thinkingBuf.split(/(?<=[.!?。])\s+/);
      if (sentences.length > 1) {
        for (let i = 0; i < sentences.length - 1; i++) {
          const s = sentences[i].trim();
          if (s.length > 10) lines.push({ text: s, kind: "thinking" });
        }
        thinkingBuf = sentences[sentences.length - 1];
      }
    } else {
      if (thinkingBuf.trim().length > 10) {
        lines.push({ text: thinkingBuf.trim(), kind: "thinking" });
        thinkingBuf = "";
      }
      if (ev.type === "phase") {
        lines.push({ text: `${ev.data.label || ev.data.phase}`, kind: "phase" });
      } else if (ev.type === "tool_call") {
        const name = TOOL_LABELS[ev.data.tool as string] || ev.data.tool;
        lines.push({ text: `Calling ${name}...`, kind: "tool" });
      } else if (ev.type === "tool_result") {
        const name = TOOL_LABELS[ev.data.tool as string] || ev.data.tool;
        const matches = ev.data.n_matches as number;
        const top = ev.data.top_match as string;
        let detail = `${name} → ${matches} matches`;
        if (top) detail += ` (top: ${top})`;
        lines.push({ text: detail, kind: "result" });
      } else if (ev.type === "verification_triggered") {
        const c = ev.data.confidence as number;
        lines.push({ text: `Low confidence (${(c * 100).toFixed(0)}%) — triggering self-verification round...`, kind: "verify" });
      } else if (ev.type === "verification_done") {
        const before = ev.data.confidence_before as number;
        const after = ev.data.confidence_after as number;
        lines.push({ text: `Verification: confidence ${(before * 100).toFixed(0)}% → ${(after * 100).toFixed(0)}%`, kind: "verify" });
      }
    }
  }
  if (thinkingBuf.trim().length > 10) {
    lines.push({ text: thinkingBuf.trim(), kind: "thinking" });
  }
  return lines;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [peaks, setPeaks] = useState("");
  const [context, setContext] = useState("");
  const [analysisType, setAnalysisType] = useState("identify");
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [agentLines, setAgentLines] = useState<ProcessedLine[]>([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLines]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file && !peaks.trim()) {
      setError("Please upload a spectrum file or enter peak positions.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setConfirmed(false);
    setAgentLines([]);

    try {
      const { session_id } = await analyzeStart({
        file: file || undefined,
        peaks: peaks.trim() || undefined,
        context: context.trim() || undefined,
        analysis_type: analysisType,
      });

      setAgentLines([{ text: "Analysis started. Agent is reasoning...", kind: "phase" }]);

      pollingRef.current = setInterval(async () => {
        try {
          const status = await getStatus(session_id);

          if (status.events && status.events.length > 0) {
            const newLines = processEvents(status.events);
            if (newLines.length > 0) {
              setAgentLines((prev) => [...prev, ...newLines]);
            }
          }

          if (status.status === "done") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setResult(status.result || null);
            setHistoryRefresh((n) => n + 1);
            setLoading(false);
          } else if (status.status === "error") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setError(status.error || "Analysis failed.");
            setLoading(false);
          }
        } catch {
          // polling fetch failed, keep retrying
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis.");
      setLoading(false);
    }
  }, [file, peaks, context, analysisType]);

  const handleConfirm = useCallback(async () => {
    if (!result?.session_id) return;
    try {
      await confirmApi({
        session_id: result.session_id,
        accept: true,
      });
      setConfirmed(true);
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed.");
    }
  }, [result]);

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar — analysis history */}
      <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/50 p-4 overflow-y-auto">
        <HistorySidebar
          onSelect={() => {}}
          refreshTrigger={historyRefresh}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ChemSpectra Agent
            </h1>
            <p className="text-slate-400">
              AI-powered FTIR spectral analysis — upload a spectrum or enter peaks, get material ID, functional groups, and a structured report.
            </p>
          </header>

          {/* Input section */}
          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
            {/* Tab toggle */}
            <div className="flex gap-1 rounded-lg bg-slate-900/50 p-1">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                File Upload
              </button>
              <button
                onClick={() => setActiveTab("peaks")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "peaks"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Enter Peaks
              </button>
            </div>

            {/* File upload */}
            {activeTab === "upload" && (
              <FileUpload onFileChange={setFile} disabled={loading} />
            )}

            {/* Peak input */}
            {activeTab === "peaks" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Peak Positions (cm⁻¹)</label>
                <textarea
                  value={peaks}
                  onChange={(e) => setPeaks(e.target.value)}
                  disabled={loading}
                  placeholder="Enter comma-separated peak positions, e.g.: 2920, 2850, 1460, 720"
                  rows={3}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 resize-none"
                />
              </div>
            )}

            {/* Sample description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sample Description (optional)</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={loading}
                placeholder="e.g.: polymer film sample from QC lab, unknown white powder..."
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>

            {/* Analysis type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Analysis Type</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ANALYSIS_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAnalysisType(t.value)}
                    disabled={loading}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      analysisType === t.value
                        ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                        : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="mt-0.5 text-xs opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || (!file && !peaks.trim())}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI is analyzing spectrum data...
                </span>
              ) : (
                "Run Analysis"
              )}
            </button>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Agent reasoning live log */}
          {loading && agentLines.length > 0 && (
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="h-4 w-4 animate-spin text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Agent Reasoning Log</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                {agentLines.map((line, i) => {
                  const colors: Record<string, string> = {
                    phase: "text-cyan-300 font-semibold font-mono",
                    tool: "text-indigo-300 font-mono",
                    result: "text-emerald-400 font-mono",
                    verify: "text-amber-400 font-mono",
                    thinking: "text-slate-400",
                  };
                  const prefix = line.kind === "thinking" ? "  " : "▶ ";
                  return (
                    <p key={i} className={colors[line.kind] || "text-slate-400"}>
                      {prefix}{line.text}
                    </p>
                  );
                })}
                <div ref={eventsEndRef} />
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <section className="space-y-6">
              <ResultsPanel
                confirmation={result.confirmation}
                toolsCalled={result.tools_called || []}
                agentMetrics={result.agent_metrics}
                sessionId={result.session_id}
              />

              {/* Confirm + download report */}
              {result.step === "awaiting_confirmation" && (
                <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex-1">
                    <p className="text-sm text-amber-200">
                      ⚠️ AI analysis complete. Please review results before confirming.
                    </p>
                  </div>
                  {!confirmed ? (
                    <button
                      onClick={handleConfirm}
                      className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-500 transition-colors shrink-0"
                    >
                      Confirm Analysis
                    </button>
                  ) : (
                    <ReportDownload sessionId={result.session_id} />
                  )}
                </div>
              )}

              {/* Confirmed state */}
              {confirmed && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Analysis confirmed. Report generated.</span>
                  </div>
                </div>
              )}

              {/* Follow-up chat */}
              <FollowUpChat sessionId={result.session_id} disabled={loading} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
