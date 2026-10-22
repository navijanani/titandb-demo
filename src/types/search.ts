export type SearchFilters = {
  filename?: string | null;
  file_type?: string | null;
  upload_date_from?: string | null;
  upload_date_to?: string | null;
};

export type SearchRequest = {
  query: string;
  top_k?: number | null;
  document_id?: number | null;
  filters?: SearchFilters | null;
};

export type SearchResultItem = {
  chunk_id: number;
  chunk_index: number;
  content: string;
  score: number;
  document_id: number;
  document_name: string;
};

export type SearchResponse = {
  query: string;
  total: number;
  results: SearchResultItem[];
};
