export type GrowthPoint = {
  date: string;
  value: number;
};

export type LatencyPoint = {
  date: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  count: number;
};

export type AnalyticsGrowth = {
  documents: GrowthPoint[];
  memories: GrowthPoint[];
  entities: GrowthPoint[];
  search_volume: GrowthPoint[];
  query_latency: LatencyPoint[];
  days: number;
};
