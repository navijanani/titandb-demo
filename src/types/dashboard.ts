export type RecentSearch = {
  id: number;
  query: string;
  results_count: number;
  timestamp: string;
};

export type DashboardStats = {
  total_documents: number;
  total_chunks: number;
  total_embeddings: number;
  total_memories: number;
  total_entities: number;
  recent_searches: RecentSearch[];
  storage_usage_bytes: number;
};
