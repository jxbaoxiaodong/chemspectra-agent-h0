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

  return (
    <div className="space-y-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
      {/* 顶部匹配结果 */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{confirmation.top_match}</h3>
          {confirmation.cas_number && (
            <p className="mt-1 text-sm text-slate-400">
              CAS: <code className="text-cyan-300">{confirmation.cas_number}</code>
            </p>
          )}
          {confirmation.similarity_score > 0 && (
            <p className="mt-0.5 text-sm text-slate-400">
              相似度: <span className="text-white font-mono">{confirmation.similarity_score.toFixed(4)}</span>
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={confirmation.confidence} size="lg" />
      </div>

      {/* 工具使用 */}
      <ToolBadges tools={toolsCalled} />

      {/* Agent 综合分析 */}
      {confirmation.summary && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">综合分析</h4>
          <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {confirmation.summary}
          </div>
        </div>
      )}

      {/* 官能团列表 */}
      {confirmation.functional_groups && confirmation.functional_groups.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">鉴定的官能团</h4>
          <div className="flex flex-wrap gap-2">
            {confirmation.functional_groups.map((group, i) => (
              <span
                key={i}
                className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-sm text-teal-300"
              >
                {group}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 证据来源 */}
      {confirmation.evidence_sources && confirmation.evidence_sources.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">证据来源</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-400">
            {confirmation.evidence_sources.map((source, i) => (
              <li key={i}>{source}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent 指标 */}
      {agentMetrics && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Agent 指标</h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.iterations}</div>
              <div className="text-xs text-slate-500">ReAct 迭代</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.verification_rounds}</div>
              <div className="text-xs text-slate-500">验证轮次</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{agentMetrics.repairs}</div>
              <div className="text-xs text-slate-500">修复次数</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono">
                {agentMetrics.confidence_trace?.length
                  ? (agentMetrics.confidence_trace[agentMetrics.confidence_trace.length - 1] * 100).toFixed(0)
                  : "—"}
              </div>
              <div className="text-xs text-slate-500">最终置信度 %</div>
            </div>
          </div>
          {agentMetrics.confidence_trace && agentMetrics.confidence_trace.length > 1 && (
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-1">置信度变化轨迹</div>
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
