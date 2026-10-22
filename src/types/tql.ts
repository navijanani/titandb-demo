import type { SearchFilters } from "./search";

export type TQLRequest = {
  tql: string;
};

export type TQLResponse = {
  query: string;
  resource: string;
  items: Record<string, unknown>[];
  total: number;
  explanation: string;
};

export type RAGResponse = {
  query: string;
  answer: string;
  sources: { source: string; count: number; items: Record<string, unknown>[] }[];
  steps: { name: string; duration_ms: number; status: string; detail: string | null }[];
  total_duration_ms: number;
  llm_provider: string;
  llm_model: string;
  created_at: string;
};

export type RAGRequest = {
  query: string;
  retrieval_mode?: "semantic" | "hybrid";
  document_id?: number;
  filters?: SearchFilters;
  top_k_chunks?: number;
  top_k_memories?: number;
  top_k_entities?: number;
  top_k_documents?: number;
  include_graph_neighbors?: boolean;
  max_tokens?: number;
  system_prompt?: string;
  temperature?: number;
  top_p?: number;
};
