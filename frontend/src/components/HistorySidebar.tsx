"use client";

import { useEffect, useState, useCallback } from "react";
import type { HistoryEntry } from "@/src/lib/types";
import { getHistory } from "@/src/lib/api";

interface HistorySidebarProps {
  onSelect: (sessionId: string) => void;
  selectedId?: string;
  refreshTrigger?: number;
}

export default function HistorySidebar({ onSelect, selectedId, refreshTrigger }: HistorySidebarProps) {
  const [sessions, setSessions] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const resp = await getHistory();
      setSessions(resp.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stepLabel: Record<string, string> = {
    completed: "Completed",
    verifying: "Verifying",
    awaiting_confirmation: "Awaiting Review",
  };

  const stepColor: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400",
    verifying: "bg-amber-500/15 text-amber-400",
    awaiting_confirmation: "bg-sky-500/15 text-sky-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analysis History</h4>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-slate-800/50 p-3">
              <div className="h-4 w-3/4 rounded bg-slate-700/50" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-700/30" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-600">No history yet.</p>
      )}

      {sessions.map((s) => (
        <button
          key={s.session_id}
          onClick={() => onSelect(s.session_id)}
          className={`w-full rounded-lg border p-3 text-left transition-all ${
            selectedId === s.session_id
              ? "border-cyan-500/50 bg-cyan-500/10"
              : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate max-w-[140px]">
              {s.top_match || "Unknown"}
            </span>
            {s.top_score > 0 && (
              <span className="text-xs font-mono text-cyan-400">{(s.top_score * 100).toFixed(0)}%</span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-slate-500 truncate max-w-[100px]">
              {s.filename || s.user_input?.slice(0, 20) || "—"}
            </span>
            <span className="text-xs text-slate-600">{formatDate(s.created_at)}</span>
          </div>
          <div className="mt-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stepColor[s.step] || "bg-slate-500/15 text-slate-400"}`}>
              {stepLabel[s.step] || s.step}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
