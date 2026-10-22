/**
 * DEMO workspace API: same signatures as production, answered from the in-memory demo store.
 */
import type { Workspace, WorkspaceCreate, WorkspaceUpdate, WorkspaceListResponse, WorkspaceStats, ActivityListResponse, WorkspaceMemberListResponse } from "../types/workspace";
import { S, nextId, logActivity, workspaceView, MEMBERS, iso } from "../demo/store";

const find = (id: number) => S.workspaces.find((w) => w.id === id) ?? (() => { throw new Error("Workspace not found"); })();

export async function listWorkspaces(params?: {
  skip?: number; limit?: number; search?: string; sort?: string; order?: string; archived?: boolean; orgId?: number;
}): Promise<WorkspaceListResponse> {
  let list = S.workspaces.map(workspaceView);
  if (params?.archived !== undefined) list = list.filter((w) => w.is_archived === params.archived);
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter((w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
  }
  const sort = (params?.sort ?? "updated_at") as keyof Workspace;
  const dir = params?.order === "asc" ? 1 : -1;
  list.sort((a, b) => {
    const x = a[sort], y = b[sort];
    if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * dir;
    if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
    return 0;
  });
  const total = list.length;
  const skip = params?.skip ?? 0;
  return { workspaces: params?.limit ? list.slice(skip, skip + params.limit) : list.slice(skip), total };
}

export async function getWorkspace(id: number): Promise<Workspace> {
  return workspaceView(find(id));
}

export async function createWorkspace(data: WorkspaceCreate, _orgId = 1): Promise<Workspace> {
  const now = new Date().toISOString();
  const w = {
    id: nextId("ws"), name: data.name, description: data.description ?? "", icon: data.icon ?? "folder", color: data.color ?? "#6366f1",
    is_favorite: false, is_archived: false, created_at: now, updated_at: now, member_count: 1, role: "owner",
  };
  S.workspaces.push(w);
  logActivity(w.id, "created", "workspace", w.name);
  return workspaceView(w);
}

export async function updateWorkspace(id: number, data: WorkspaceUpdate): Promise<Workspace> {
  const w = find(id);
  Object.assign(w, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));
  logActivity(id, "updated", "workspace", w.name);
  return workspaceView(w);
}

export async function deleteWorkspace(id: number): Promise<void> {
  S.workspaces = S.workspaces.filter((w) => w.id !== id);
  S.docs = S.docs.filter((d) => d.workspace_id !== id);
  S.chunks = S.chunks.filter((c) => c.workspace_id !== id);
  S.memories = S.memories.filter((m) => m.workspace_id !== id);
  S.entities = S.entities.filter((e) => e.workspace_id !== id);
  S.rels = S.rels.filter((r) => r.workspace_id !== id);
  S.collections = S.collections.filter((c) => c.workspace_id !== id);
}

export async function toggleFavorite(id: number): Promise<Workspace> {
  const w = find(id);
  w.is_favorite = !w.is_favorite;
  logActivity(id, "favorite_toggled", "workspace", w.name);
  return workspaceView(w);
}

export async function toggleArchive(id: number): Promise<Workspace> {
  const w = find(id);
  w.is_archived = !w.is_archived;
  logActivity(id, "archive_toggled", "workspace", w.name);
  return workspaceView(w);
}

const fmt = (b: number) => {
  for (const u of ["B", "KB", "MB", "GB"]) { if (b < 1024) return `${b.toFixed(1)} ${u}`; b /= 1024; }
  return `${b.toFixed(1)} TB`;
};

export async function getWorkspaceStats(id: number): Promise<WorkspaceStats> {
  const w = workspaceView(find(id));
  return {
    workspace_id: id,
    document_count: w.document_count,
    memory_count: w.memory_count,
    entity_count: w.entity_count,
    relationship_count: S.rels.filter((r) => r.workspace_id === id).length,
    collection_count: S.collections.filter((c) => c.workspace_id === id).length,
    search_count: S.searches.filter((s) => s.workspace_id === id).length,
    storage_bytes: w.storage_bytes,
    storage_formatted: fmt(w.storage_bytes),
    member_count: w.member_count,
    recent_activity_count: S.activity.filter((a) => a.workspace_id === id && Date.now() - Date.parse(a.created_at) < 7 * 86_400_000).length,
  };
}

export async function getWorkspaceActivity(id: number, skip = 0, limit = 50): Promise<ActivityListResponse> {
  const all = S.activity.filter((a) => a.workspace_id === id);
  return { activities: all.slice(skip, skip + limit), total: all.length };
}

export async function getWorkspaceMembers(id: number): Promise<WorkspaceMemberListResponse> {
  const w = find(id);
  const members = MEMBERS.slice(0, Math.max(1, w.member_count)).map((m, i) => ({
    id: i + 1, workspace_id: id, user_id: m.user_id, user_display_name: m.user_display_name, user_email: m.user_email,
    role: i === 0 ? w.role : i === 1 ? "editor" : "viewer", joined_at: iso(30 - i * 4, 9),
  }));
  return { members, total: members.length };
}
