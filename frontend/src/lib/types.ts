export interface AnalyzeRequest {
  file?: File;
  peaks?: string;
  context?: string;
  analysis_type: string;
}

export interface ConfirmRequest {
  session_id: string;
  accept: boolean;
}

export interface FollowUpRequest {
  session_id: string;
  question: string;
}

export interface AgentMetrics {
  react_iterations: number;
  verification_rounds: number;
  repair_count: number;
  evidence_conflicts: number;
  confidence_trace: number[];
  total_llm_calls: number;
}

export interface Candidate {
  rank: number;
  name: string;
  cas: string;
  score: number;
}

export interface Confirmation {
  best_match: { name: string; cas: string; score: number };
  verdict: string;
  reasoning: string;
  confidence: number;
  flags: string[];
  candidates: Candidate[];
  search_summary: string;
  tools_called: string[];
  synthesis: string;
}

export interface AnalyzeResponse {
  step: string;
  session_id: string;
  tools_called: string[];
  n_tools: number;
  search_summary?: string;
  n_matches?: number;
  confirmation?: Confirmation;
  agent_metrics?: AgentMetrics;
}

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

export interface HistoryResponse {
  n_sessions: number;
  storage: string;
  sessions: HistoryEntry[];
}

export interface ReportResponse {
  session_id: string;
  markdown: string;
  filename: string;
}

export interface FollowUpResponse {
  session_id: string;
  question: string;
  answer: string;
}

export interface ConfirmResultResponse {
  session_id: string;
  step: string;
  report_ready: boolean;
  message: string;
}
