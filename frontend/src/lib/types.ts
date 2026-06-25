/** 分析请求 */
export interface AnalyzeRequest {
  file?: File;
  peaks?: string;
  context?: string;
  analysis_type: "identify" | "explain" | "functional_groups" | "deformulate" | "screening";
}

/** 确认请求 */
export interface ConfirmRequest {
  session_id: string;
  accept: boolean;
}

/** 追问请求 */
export interface FollowUpRequest {
  session_id: string;
  question: string;
}

/** Agent 指标 */
export interface AgentMetrics {
  iterations: number;
  verification_rounds: number;
  repairs: number;
  confidence_trace: number[];
}

/** 确认信息 */
export interface Confirmation {
  top_match: string;
  cas_number: string;
  similarity_score: number;
  confidence: number;
  functional_groups: string[];
  summary: string;
  evidence_sources: string[];
}

/** 分析响应 */
export interface AnalyzeResponse {
  step: "awaiting_confirmation" | "needs_clarification" | "completed";
  session_id: string;
  tools_called: string[];
  n_tools: number;
  search_summary?: string;
  n_matches?: number;
  confirmation?: Confirmation;
  agent_metrics?: AgentMetrics;
  question?: string;
}

/** 历史记录条目 */
export interface HistoryEntry {
  session_id: string;
  filename: string;
  top_match: string;
  top_score: number;
  n_matches: number;
  step: string;
  user_input: string;
  created_at: string;
}

/** 历史记录响应 */
export interface HistoryResponse {
  n_sessions: number;
  storage: string;
  sessions: HistoryEntry[];
}

/** 报告响应 */
export interface ReportResponse {
  session_id: string;
  markdown: string;
  filename: string;
}

/** 追问响应 */
export interface FollowUpResponse {
  session_id: string;
  question: string;
  answer: string;
  step: string;
}

/** 确认结果响应 */
export interface ConfirmResultResponse {
  session_id: string;
  step: string;
  report_ready: boolean;
  message: string;
}
