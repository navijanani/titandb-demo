export type LatencyStats = {
  min_ms: number;
  max_ms: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  count: number;
};

export type SearchAccuracyMetrics = {
  total_searches: number;
  queries_with_results: number;
  zero_result_queries: number;
  zero_result_rate: number;
  avg_results_per_query: number;
};

export type MemoryRetrievalMetrics = {
  total_retrievals: number;
  avg_latency_ms: number;
  avg_results_count: number;
  total_memories_stored: number;
};

export type EmbeddingMetrics = {
  total_embeddings: number;
  avg_time_ms: number;
  total_chunks_embedded: number;
};

export type DashboardResponse = {
  query_latency: LatencyStats | null;
  embedding: EmbeddingMetrics | null;
  search_accuracy: SearchAccuracyMetrics | null;
  memory: MemoryRetrievalMetrics | null;
  recent_alerts: Record<string, unknown>[];
};

export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
  count: number;
};

export type TimeSeriesResponse = {
  metric_name: string;
  points: TimeSeriesPoint[];
  total: number;
  window_minutes: number;
};
