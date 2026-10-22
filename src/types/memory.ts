export type Memory = {
  id: number;
  fact: string;
  source: string | null;
  importance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  created_at: string;
};

export type MemoryCreate = {
  fact: string;
  source?: string | null;
  importance_score?: number;
};

export type MemoryUpdate = {
  fact?: string;
  source?: string | null;
  importance_score?: number;
};

export type MemorySearchRequest = {
  query: string;
  limit?: number;
  min_importance?: number;
};

export type MemorySearchResponse = {
  query: string;
  total: number;
  results: Memory[];
};

export type MemoryListResponse = {
  memories: Memory[];
  total: number;
  skip: number;
  limit: number;
};
