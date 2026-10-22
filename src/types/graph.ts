export type KGEntity = {
  id: number;
  name: string;
  entity_type: string;
  properties: Record<string, unknown> | null;
  created_at: string;
};

export type KGRelationship = {
  id: number;
  source_entity_id: number;
  target_entity_id: number;
  source_name: string;
  target_name: string;
  relationship_type: string;
  properties: Record<string, unknown> | null;
  created_at: string;
};

export type GraphNode = {
  id: number;
  name: string;
  entity_type: string;
};

export type GraphLink = {
  source: number;
  target: number;
  type: string;
};

export type DocGraphResponse = {
  nodes: { id: number; filename: string }[];
  edges: { source: number; target: number; type: string }[];
};

export type KGPathRequest = {
  source_entity_id: number;
  target_entity_id: number;
  max_depth?: number;
};

export type KGPathResponse = {
  paths: {
    path: { entity_id: number; name: string; relationship_type: string }[];
    total_weight: number;
  }[];
};
