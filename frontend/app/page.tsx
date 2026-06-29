"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/src/components/FileUpload";
import ResultsPanel from "@/src/components/ResultsPanel";
import FollowUpChat from "@/src/components/FollowUpChat";
import ReportDownload from "@/src/components/ReportDownload";
import HistorySidebar from "@/src/components/HistorySidebar";
import { analyze, confirm as confirmApi } from "@/src/lib/api";
import type { AnalyzeResponse } from "@/src/lib/types";

type Tab = "upload" | "peaks";

const ANALYSIS_TYPES = [
  { value: "identify", label: "Identify Material", desc: "Identify what an unknown sample is" },
  { value: "explain", label: "Explain Peaks", desc: "Assign chemical origin to each absorption peak" },
];

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

  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleAnalyze = useCallback(async () => {
    if (!file && !peaks.trim()) {
      setError("Please upload a spectrum file or enter peak positions.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setConfirmed(false);

    try {
      const resp = await analyze({
        file: file || undefined,
        peaks: peaks.trim() || undefined,
        context: context.trim() || undefined,
        analysis_type: analysisType,
      } as Parameters<typeof analyze>[0]);
      setResult(resp);
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
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

      {/* 主内容区 */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* 头部 */}
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ChemSpectra Agent
            </h1>
            <p className="text-slate-400">
              AI-powered FTIR spectral analysis — upload a spectrum or enter peaks, get material ID, functional groups, and a structured report.
            </p>
          </header>

          {/* 输入区 */}
          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
            {/* Tab 切换 */}
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

            {/* 文件上传 */}
            {activeTab === "upload" && (
              <FileUpload onFileChange={setFile} disabled={loading} />
            )}

            {/* 峰位输入 */}
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

            {/* 样品描述 */}
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

            {/* 分析类型 */}
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

            {/* 提交按钮 */}
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

          {/* 错误提示 */}
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

          {/* 加载骨架屏 */}
          {loading && (
            <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
              <div className="animate-shimmer h-8 w-2/3 rounded-lg" />
              <div className="animate-shimmer h-5 w-1/3 rounded-lg" />
              <div className="space-y-2">
                <div className="animate-shimmer h-4 w-full rounded" />
                <div className="animate-shimmer h-4 w-5/6 rounded" />
                <div className="animate-shimmer h-4 w-4/6 rounded" />
              </div>
            </div>
          )}

          {/* 分析结果 */}
          {result && !loading && (
            <section className="space-y-6">
              <ResultsPanel
                confirmation={result.confirmation}
                toolsCalled={result.tools_called || []}
                agentMetrics={result.agent_metrics}
                sessionId={result.session_id}
              />

              {/* 确认 + 下载报告 */}
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

              {/* 已确认状态 */}
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

              {/* 追问聊天 */}
              <FollowUpChat sessionId={result.session_id} disabled={loading} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
