export type Workspace = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  document_count: number;
  memory_count: number;
  entity_count: number;
  storage_bytes: number;
  member_count: number;
  role: string;
};

export type WorkspaceCreate = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
};

export type WorkspaceUpdate = {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
};

export type WorkspaceListResponse = {
  workspaces: Workspace[];
  total: number;
};

export type WorkspaceStats = {
  workspace_id: number;
  document_count: number;
  memory_count: number;
  entity_count: number;
  relationship_count: number;
  collection_count: number;
  search_count: number;
  storage_bytes: number;
  storage_formatted: string;
  member_count: number;
  recent_activity_count: number;
};

export type ActivityItem = {
  id: number;
  workspace_id: number;
  user_id: number;
  user_display_name: string;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityListResponse = {
  activities: ActivityItem[];
  total: number;
};

export type WorkspaceMember = {
  id: number;
  workspace_id: number;
  user_id: number;
  user_display_name: string;
  user_email: string;
  role: string;
  joined_at: string;
};

export type WorkspaceMemberListResponse = {
  members: WorkspaceMember[];
  total: number;
};

export const WORKSPACE_ICONS = [
  "folder", "microscope", "chart-bar", "notes", "message-circle", "palette", "trending-up", "settings",
  "tool", "building", "flask", "clipboard", "target", "bulb", "rocket", "books",
  "home", "world", "robot", "brain",
];

export const WORKSPACE_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#64748b", "#78716c", "#1e293b",
];
