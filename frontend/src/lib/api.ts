import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ConfirmRequest,
  ConfirmResultResponse,
  FollowUpRequest,
  FollowUpResponse,
  HistoryResponse,
  ReportResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ftir.fun/h0";

/** POST /api/analyze — 提交光谱分析 */
export async function analyze(data: AnalyzeRequest): Promise<AnalyzeResponse> {
  const formData = new FormData();
  if (data.file) formData.append("file", data.file);
  if (data.peaks) formData.append("peaks", data.peaks);
  if (data.context) formData.append("context", data.context);
  formData.append("analysis_type", data.analysis_type);

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** POST /api/followup — 发送追问 */
export async function followUp(data: FollowUpRequest): Promise<FollowUpResponse> {
  const res = await fetch(`${API_URL}/api/followup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** POST /api/confirm — 确认/拒绝分析 */
export async function confirm(data: ConfirmRequest): Promise<ConfirmResultResponse> {
  const res = await fetch(`${API_URL}/api/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** GET /api/report/{session_id} — 下载 Markdown 报告 */
export async function downloadReport(sessionId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/report/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.text();
}

/** GET /api/history — 获取历史记录 */
export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** 触发浏览器下载字符串内容为文件 */
export function downloadAsFile(content: string, filename: string, mimeType = "text/markdown") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
