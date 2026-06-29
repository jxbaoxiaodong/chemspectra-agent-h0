import type {
  AnalyzeResponse,
  ConfirmRequest,
  ConfirmResultResponse,
  FollowUpRequest,
  FollowUpResponse,
  HistoryResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ftir.fun/h0";

export interface AnalyzeStartResponse {
  session_id: string;
  status: "processing";
}

export interface StatusResponse {
  status: "processing" | "done" | "error";
  events: Array<{ type: string; data: Record<string, unknown> }>;
  result?: AnalyzeResponse;
  error?: string;
}

/** POST /api/analyze — start analysis (returns immediately) */
export async function analyzeStart(data: {
  file?: File;
  peaks?: string;
  context?: string;
  analysis_type: string;
}): Promise<AnalyzeStartResponse> {
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

/** GET /api/status/{session_id} — poll for progress */
export async function getStatus(sessionId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** POST /api/followup */
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

/** POST /api/confirm */
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

/** GET /api/report/{session_id} */
export async function downloadReport(sessionId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/report/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.text();
}

/** GET /api/history */
export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Trigger browser download */
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
