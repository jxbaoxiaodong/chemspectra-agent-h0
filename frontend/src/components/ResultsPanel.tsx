"use client";

import type { Confirmation, AgentMetrics } from "@/src/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";
import ToolBadges from "./ToolBadges";

interface ResultsPanelProps {
  confirmation?: Confirmation;
  toolsCalled: string[];
  agentMetrics?: AgentMetrics;
  sessionId: string;
}

export default function ResultsPanel({
  confirmation,
  toolsCalled,
  agentMetrics,
  sessionId,
}: ResultsPanelProps) {
  if (!confirmation) return null;

  const m = confirmation.best_match;

  return (
    <div className="space-y-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
      {/* Top match */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{m?.name || "Unknown"}</h3>
          {m?.cas && m.cas !== "-" && (
            <p className="mt-1 text-sm text-slate-400">
              CAS: <code className="text-cyan-300">{m.cas}</code>
            </p>
          )}
          {m?.score > 0 && (
            <p className="mt-0.5 text-sm text-slate-400">
              Library Match Score: <span className="text-white font-mono">{m.score.toFixed(4)}</span>
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={confirmation.confidence} size="lg" />
      </div>

      {/* Verdict + reasoning */}
      {confirmation.reasoning && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent Reasoning</h4>
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-300">
            {confirmation.reasoning}
          </div>
        </div>
      )}

      {/* Flags */}
      {confirmation.flags && confirmation.flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analysis Flags</h4>
          <ul className="space-y-1">
            {confirmation.flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-300">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tools used */}
      <ToolBadges tools={toolsCalled} />

      {/* Candidates */}
      {confirmation.candidates && confirmation.candidates.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Library Match Candidates</h4>
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">CAS</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody>
                {confirmation.candidates.slice(0, 5).map((c, i) => (
                  <tr key={i} className={`border-b border-slate-800 ${i === 0 ? "bg-cyan-500/5" : ""}`}>
                    <td className="px-3 py-2 text-slate-500">{c.rank}</td>
                    <td className="px-3 py-2 text-white font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{c.cas !== "-" ? c.cas : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-cyan-300">{c.score.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full synthesis */}
      {confirmation.synthesis && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Analysis Report</h4>
          <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {confirmation.synthesis}
          </div>
        </div>
      )}

      {/* Agent metrics */}
      {agentMetrics && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Agent Metrics</h4>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.react_iterations}</div>
              <div className="text-xs text-slate-500">ReAct Rounds</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.verification_rounds}</div>
              <div className="text-xs text-slate-500">Verifications</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.total_llm_calls}</div>
              <div className="text-xs text-slate-500">LLM Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.repair_count}</div>
              <div className="text-xs text-slate-500">Self-Repairs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono">
                {confirmation.confidence != null
                  ? `${(confirmation.confidence * 100).toFixed(0)}%`
                  : "—"}
              </div>
              <div className="text-xs text-slate-500">Final Confidence</div>
            </div>
          </div>
          {agentMetrics.confidence_trace && agentMetrics.confidence_trace.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-1">Confidence Trace</div>
              <div className="flex items-center gap-1">
                {agentMetrics.confidence_trace.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-400">
                    {i > 0 && <span className="text-slate-600">→</span>}
                    <span
                      className={`font-mono ${c >= 0.85 ? "text-emerald-400" : c >= 0.7 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {(c * 100).toFixed(0)}%
                    </span>
                  </span>
                ))}
                {confirmation.confidence != null && (
                  <>
                    <span className="text-slate-600">→</span>
                    <span className={`font-mono text-xs ${confirmation.confidence >= 0.85 ? "text-emerald-400" : confirmation.confidence >= 0.7 ? "text-amber-400" : "text-red-400"}`}>
                      {(confirmation.confidence * 100).toFixed(0)}% (final)
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session ID */}
      <p className="text-xs text-slate-600">
        Session: <code className="text-slate-500">{sessionId}</code>
      </p>
    </div>
  );
}
