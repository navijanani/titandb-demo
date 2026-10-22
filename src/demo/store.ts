/**
 * In-memory demo database. Built from seed.ts on page load; mutations (uploads,
 * new memories, graph edits...) live until the tab reloads. No network, no storage.
 */
import type { Document, Chunk } from "../types/document";
import type { Memory } from "../types/memory";
import type { KGEntity, KGRelationship } from "../types/graph";
import type { Workspace, ActivityItem } from "../types/workspace";
import {
  SEED_WORKSPACES, SEED_DOCS, SEED_MEMORIES, SEED_ENTITIES, SEED_RELS,
  SEED_COLLECTIONS, SEED_ACTIVITY, SEED_SEARCHES, SEED_MEMBERS, DEMO_USER,
} from "./seed";
import type { Passage } from "./engine";

const DAY = 86_400_000;
export const iso = (daysAgo: number, hour = 10, minute = 0): string => {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export type WsRec = Omit<Workspace, "document_count" | "memory_count" | "entity_count" | "storage_bytes">;
export type DocRec = Document & { workspace_id: number; seedKey: string | null; readyAt: number; announced: boolean; startedAt: number };
export type ChunkRec = Chunk & { workspace_id: number };
export type MemRec = Memory & { workspace_id: number };
export type EntRec = KGEntity & { workspace_id: number };
export type RelRec = KGRelationship & { workspace_id: number };
export type ColRec = { id: number; workspace_id: number; name: string; description: string | null; created_at: string; updated_at: string; docIds: number[] };
export type ActRec = ActivityItem;
export type SearchRec = { id: number; workspace_id: number; query: string; results_count: number; timestamp: string };

export type State = {
  user: typeof DEMO_USER & { created_at: string };
  workspaces: WsRec[];
  docs: DocRec[];
  chunks: ChunkRec[];
  memories: MemRec[];
  entities: EntRec[];
  rels: RelRec[];
  collections: ColRec[];
  activity: ActRec[];
  searches: SearchRec[];
  next: Record<string, number>;
};

function build(): State {
  const next: Record<string, number> = { ws: 1, doc: 1, chunk: 1, mem: 1, ent: 1, rel: 1, col: 1, act: 1, search: 1 };
  const id = (k: string) => next[k]++;

  const workspaces: WsRec[] = SEED_WORKSPACES.map((w) => {
    next.ws = Math.max(next.ws, w.id + 1);
    return {
      id: w.id, name: w.name, description: w.description, icon: w.icon, color: w.color,
      is_favorite: w.is_favorite, is_archived: w.is_archived,
      created_at: iso(w.daysAgo, 9), updated_at: iso(Math.max(0, w.daysAgo > 3 ? 1 : 0), 11),
      member_count: w.member_count, role: w.role,
    };
  });

  const docs: DocRec[] = [];
  const chunks: ChunkRec[] = [];
  const keyToId = new Map<string, number>();
  for (const d of SEED_DOCS) {
    const docId = id("doc");
    keyToId.set(d.key, docId);
    const created = iso(d.daysAgo, 10, 5);
    docs.push({
      id: docId, workspace_id: d.ws, filename: d.filename, file_type: d.type, file_size: d.kb * 1024,
      storage_path: `sample/${d.filename}`, status: "completed", error_message: null, created_at: created,
      seedKey: d.key, readyAt: 0, announced: true, startedAt: 0,
    });
    d.chunks.forEach((text, i) => chunks.push({
      id: id("chunk"), workspace_id: d.ws, document_id: docId, chunk_index: i, content: text,
      doc_metadata: { filename: d.filename, source: "sample" }, created_at: created,
    }));
  }

  const memories: MemRec[] = SEED_MEMORIES.map((m) => ({
    id: id("mem"), workspace_id: m.ws, fact: m.fact, source: m.source, importance_score: m.importance,
    access_count: m.access, last_accessed_at: iso(Math.max(0, m.daysAgo - 3), 15), created_at: iso(m.daysAgo, 11),
  }));

  const entities: EntRec[] = SEED_ENTITIES.map((e, i) => ({
    id: id("ent"), workspace_id: e.ws, name: e.name, entity_type: e.type, properties: e.props ?? null,
    created_at: iso(40 - ((i * 3) % 38), 12),
  }));
  const entId = (ws: number, name: string) => entities.find((e) => e.workspace_id === ws && e.name === name)!;
  const rels: RelRec[] = SEED_RELS.map((r, i) => {
    const s = entId(r.ws, r.from), t = entId(r.ws, r.to);
    return {
      id: id("rel"), workspace_id: r.ws, source_entity_id: s.id, target_entity_id: t.id,
      source_name: s.name, target_name: t.name, relationship_type: r.type, properties: null,
      created_at: iso(30 - (i % 25), 13),
    };
  });

  const collections: ColRec[] = SEED_COLLECTIONS.map((c) => ({
    id: id("col"), workspace_id: c.ws, name: c.name, description: c.description,
    created_at: iso(c.daysAgo, 9), updated_at: iso(Math.max(0, c.daysAgo - 2), 9),
    docIds: c.docs.map((k) => keyToId.get(k)!).filter(Boolean),
  }));

  const activity: ActRec[] = SEED_ACTIVITY.map((a) => ({
    id: id("act"), workspace_id: a.ws, user_id: 2, user_display_name: a.user, action: a.action,
    entity_type: a.entity_type, entity_id: null, metadata: a.name ? { name: a.name } : null,
    created_at: iso(a.daysAgo, a.hour),
  })).sort((x, y) => y.created_at.localeCompare(x.created_at));

  const searches: SearchRec[] = SEED_SEARCHES.map((s) => ({
    id: id("search"), workspace_id: 1, query: s.q, results_count: s.results,
    timestamp: new Date(Date.now() - s.minutesAgo * 60_000).toISOString(),
  }));

  searches.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { user: { ...DEMO_USER, created_at: iso(60, 9) }, workspaces, docs, chunks, memories, entities, rels, collections, activity, searches, next };
}

export const S: State = build();

export function resetDemoState() {
  Object.assign(S, build());
}

export const nextId = (k: string) => S.next[k]++;

export function currentWorkspaceId(): number {
  try {
    const raw = localStorage.getItem("active_workspace_id");
    const n = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isNaN(n) && S.workspaces.some((w) => w.id === n)) return n;
  } catch { /* storage blocked: fall through */ }
  return 1;
}

export const wsOf = (id?: number | null) => id ?? currentWorkspaceId();

export function logActivity(ws: number, action: string, entityType: string | null, name?: string) {
  S.activity.unshift({
    id: nextId("act"), workspace_id: ws, user_id: S.user.id, user_display_name: S.user.display_name,
    action, entity_type: entityType, entity_id: null, metadata: name ? { name } : null,
    created_at: new Date().toISOString(),
  });
  const w = S.workspaces.find((x) => x.id === ws);
  if (w) w.updated_at = new Date().toISOString();
}

/** Resolve upload "processing" simulation into a status. */
export function docStatus(d: DocRec): Document["status"] {
  if (!d.readyAt) return d.status;
  const now = Date.now();
  if (now < d.startedAt + 700) return "pending";
  if (now < d.readyAt) return "processing";
  if (!d.announced) {
    d.announced = true;
    d.status = "completed";
    logActivity(d.workspace_id, "completed", "ingestion", d.filename);
  }
  return "completed";
}

export const publicDoc = (d: DocRec): Document => ({
  id: d.id, filename: d.filename, file_type: d.file_type, file_size: d.file_size,
  storage_path: d.storage_path, status: docStatus(d), error_message: d.error_message, created_at: d.created_at,
});

export function passagesFor(ws: number, onlyDocIds?: number[]): Passage[] {
  const docs = new Map(S.docs.filter((d) => d.workspace_id === ws && docStatus(d) === "completed").map((d) => [d.id, d]));
  return S.chunks
    .filter((c) => c.workspace_id === ws && docs.has(c.document_id) && (!onlyDocIds || onlyDocIds.includes(c.document_id)))
    .map((c) => {
      const d = docs.get(c.document_id)!;
      return {
        chunk_id: c.id, chunk_index: c.chunk_index, content: c.content, document_id: d.id,
        document_name: d.filename, file_type: d.file_type, created_at: d.created_at,
        key: d.seedKey ? `${d.seedKey}:${c.chunk_index}` : null,
      };
    });
}

export function workspaceView(w: WsRec): Workspace {
  const docs = S.docs.filter((d) => d.workspace_id === w.id);
  return {
    ...w,
    document_count: docs.length,
    memory_count: S.memories.filter((m) => m.workspace_id === w.id).length,
    entity_count: S.entities.filter((e) => e.workspace_id === w.id).length,
    storage_bytes: docs.reduce((a, d) => a + d.file_size, 0),
  };
}

export const MEMBERS = SEED_MEMBERS;
