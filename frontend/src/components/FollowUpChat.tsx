"use client";

import { useState, useRef, useEffect } from "react";
import type { FollowUpResponse } from "@/src/lib/types";
import { followUp } from "@/src/lib/api";

interface Message {
  role: "user" | "agent";
  text: string;
}

interface FollowUpChatProps {
  sessionId: string;
  disabled?: boolean;
}

export default function FollowUpChat({ sessionId, disabled }: FollowUpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || disabled) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const resp: FollowUpResponse = await followUp({ session_id: sessionId, question });
      setMessages((prev) => [...prev, { role: "agent", text: resp.answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "发送失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">追问分析</h4>

      {/* 消息列表 */}
      {messages.length > 0 && (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-cyan-600/20 text-cyan-100"
                    : "bg-slate-700/50 text-slate-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-slate-700/50 px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" style={{ animationDelay: "0.2s" }} />
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="输入追问，如「这个置信度为什么很低？」"
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || loading || !input.trim()}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors"
        >
          {loading ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  );
}
