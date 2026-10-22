export type EngineConfig = {
  engine: string;
  enabled: boolean;
  priority: number;
  top_k: number;
  estimated_cost: number;
  params: Record<string, unknown>;
};

export type GraphConfig = {
  max_depth: number;
  max_neighbors: number;
  prune_unconnected: boolean;
  bidirectional: boolean;
  expand_neighbors: boolean;
};

export type VectorConfig = {
  top_k: number;
  ef_search: number;
  min_score_threshold: number;
  use_embedding_cache: boolean;
};

export type OptimizerPlan = {
  query: string;
  strategy: string;
  engines: EngineConfig[];
  graph: GraphConfig;
  vector: VectorConfig;
  total_estimated_cost: number;
  reasoning: string[];
};

export type ExecutorResult = {
  executor_name: string;
  success: boolean;
  error: string | null;
  data: Record<string, unknown>[];
  total: number;
};

export type ExecutionResponse = {
  query: string;
  plan_used: { use_vector_search: boolean; use_memory_search: boolean; use_graph_search: boolean; use_metadata_filter: boolean };
  results: ExecutorResult[];
  total_items: number;
};

export type OptimizerExecuteResponse = {
  plan: OptimizerPlan;
  execution: ExecutionResponse;
};

export type TQLExplainResponse = {
  tql: string;
  plan: string;
};
