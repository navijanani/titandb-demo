/**
 * DEMO API CLIENT
 * ------------------------------------------------------------------
 * Same exports and signatures as the production client, but every call is
 * answered locally from src/demo/store.ts. There is no fetch(), no backend and
 * no network traffic. Search/RAG behaviour is labelled in the responses so it
 * is never presented as live AI processing (see src/demo/engine.ts).
 */
import type { Document, DocumentListResponse, DocumentStatusResponse, UploadResponse, DeleteResponse } from "../types/document";
import type { SearchRequest, SearchResponse, SearchResultItem } from "../types/search";
import type { Chunk } from "../types/document";
import type { KGEntity, KGRelationship, DocGraphResponse, KGPathRequest, KGPathResponse } from "../types/graph";
import type { Memory, MemoryCreate, MemoryUpdate, MemorySearchRequest, MemorySearchResponse, MemoryListResponse } from "../types/memory";
import type { DashboardResponse, TimeSeriesResponse, SearchAccuracyMetrics, MemoryRetrievalMetrics, EmbeddingMetrics } from "../types/metrics";
import type { TQLRequest, TQLResponse, RAGRequest, RAGResponse } from "../types/tql";
import type { DashboardStats } from "../types/dashboard";
import type { Collection, CollectionDetail, CollectionListResponse, CollectionCreate, CollectionUpdate, CollectionDocumentItem } from "../types/collection";
import type { AnalyticsGrowth, GrowthPoint, LatencyPoint } from "../types/analytics";
import type { OptimizerPlan, OptimizerExecuteResponse, TQLExplainResponse, ExecutorResult, ExecutionResponse } from "../types/optimizer";

import {
  S, nextId, wsOf, logActivity, publicDoc, passagesFor, docStatus,
  type ColRec, type DocRec, type ChunkRec,
} from "../demo/store";
import {
  applyFilters, buildExtractiveAnswer, buildPlan, parseTQL, runSearch, tokenize,
  type Passage, type Ranked, type SearchOutcome,
} from "../demo/engine";
import * as M from "../demo/metrics";

export type { Document, DocumentListResponse, KGEntity, KGRelationship, Memory, DashboardResponse, TQLResponse, RAGResponse, Chunk, SearchRequest, SearchResultItem, DocGraphResponse, MemoryCreate, MemoryUpdate, TimeSeriesResponse, SearchAccuracyMetrics, MemoryRetrievalMetrics, DashboardStats, Collection, CollectionDetail, CollectionListResponse, CollectionCreate, CollectionUpdate, CollectionDocumentItem, AnalyticsGrowth, GrowthPoint, LatencyPoint, OptimizerPlan, OptimizerExecuteResponse, TQLExplainResponse, ExecutorResult, ExecutionResponse };
export type { EmbeddingMetrics };

/** Search responses in the demo also carry a plain-language note describing how they were produced. */
export type DemoSearchResponse = SearchResponse & { demo_note?: string; demo_kind?: "precomputed" | "local" };

const fail = (msg: string): never => { throw new Error(msg); };
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

// ── Documents ──
export async function uploadFile(file: File, workspaceId = 1, _orgId = 1): Promise<UploadResponse> {
  const ws = wsOf(workspaceId);
  const ext = (file.name.split(".").pop() ?? "txt").toLowerCase();
  const id = nextId("doc");
  const now = Date.now();
  const created = new Date(now).toISOString();

  // Real local ingestion for text formats; PDF/DOCX parsing is not available in a static demo.
  let texts: string[] = [];
  if (ext === "txt" || ext === "csv") {
    try { texts = chunkText(await file.text()); } catch { texts = []; }
  }
  if (!texts.length) {
    texts = [`Demo placeholder for "${file.name}". Text extraction for .${ext} files needs the Titan backend, so this sample upload has no searchable body text. Upload a .txt or .csv file to see local chunking and search.`];
  }

  const doc: DocRec = {
    id, workspace_id: ws, filename: file.name, file_type: ext, file_size: file.size,
    storage_path: `demo-local/${file.name}`, status: "processing", error_message: null, created_at: created,
    seedKey: null, startedAt: now, readyAt: now + 2500, announced: false,
  };
  S.docs.unshift(doc);
  texts.forEach((t, i) => {
    const c: ChunkRec = { id: nextId("chunk"), workspace_id: ws, document_id: id, chunk_index: i, content: t, doc_metadata: { filename: file.name, source: "upload" }, created_at: created };
    S.chunks.push(c);
  });
  logActivity(ws, "uploaded", "document", file.name);
  return { message: "Uploaded to the in-browser demo store (nothing is sent over the network).", document: publicDoc(doc) };
}

/** Same defaults as the production pipeline: ~1000 chars with 200 overlap, split on whitespace. */
function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];
  const out: string[] = [];
  let start = 0;
  while (start < clean.length && out.length < 60) {
    let end = Math.min(clean.length, start + size);
    if (end < clean.length) {
      const sp = clean.lastIndexOf(" ", end);
      if (sp > start + size / 2) end = sp;
    }
    out.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out.filter(Boolean);
}

export async function listDocuments(skip = 0, limit = 100, workspaceId = 1, _orgId = 1): Promise<DocumentListResponse> {
  const ws = wsOf(workspaceId);
  const all = S.docs.filter((d) => d.workspace_id === ws).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { documents: all.slice(skip, skip + limit).map(publicDoc), total: all.length, skip, limit };
}

export async function getDocument(id: number): Promise<Document> {
  const d = S.docs.find((x) => x.id === id);
  return d ? publicDoc(d) : fail("Document not found");
}

export async function deleteDocument(id: number): Promise<DeleteResponse> {
  const d = S.docs.find((x) => x.id === id);
  if (!d) fail("Document not found");
  S.docs = S.docs.filter((x) => x.id !== id);
  S.chunks = S.chunks.filter((c) => c.document_id !== id);
  S.collections.forEach((c) => { c.docIds = c.docIds.filter((x) => x !== id); });
  logActivity(d!.workspace_id, "deleted", "document", d!.filename);
  return { message: "Document deleted from the demo store", document_id: id };
}

export async function getDocumentStatus(id: number): Promise<DocumentStatusResponse> {
  const d = S.docs.find((x) => x.id === id);
  if (!d) fail("Document not found");
  return { id, filename: d!.filename, status: docStatus(d!), error_message: d!.error_message };
}

export async function getDocumentChunks(id: number, skip = 0, limit = 500): Promise<Chunk[]> {
  return S.chunks
    .filter((c) => c.document_id === id)
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .slice(skip, skip + limit)
    .map(({ workspace_id: _w, ...c }) => c);
}

// ── Search ──
function toItems(ranked: Ranked[]): SearchResultItem[] {
  return ranked.map((r) => ({
    chunk_id: r.passage.chunk_id, chunk_index: r.passage.chunk_index, content: r.passage.content,
    score: round(r.score), document_id: r.passage.document_id, document_name: r.passage.document_name,
  }));
}

function recordSearch(ws: number, query: string, n: number) {
  S.searches.unshift({ id: nextId("search"), workspace_id: ws, query, results_count: n, timestamp: new Date().toISOString() });
  S.searches = S.searches.slice(0, 50);
}

function searchCore(mode: "semantic" | "hybrid", req: SearchRequest, ws: number, onlyDocIds?: number[]): { outcome: SearchOutcome; filtered: Passage[] } {
  const filtered = applyFilters(passagesFor(ws, onlyDocIds), req.filters, req.document_id);
  const outcome = runSearch(mode, req.query, filtered, req.top_k ?? 10);
  return { outcome, filtered };
}

async function doSearch(mode: "semantic" | "hybrid", req: SearchRequest, workspaceId: number): Promise<DemoSearchResponse> {
  const ws = wsOf(workspaceId);
  const { outcome } = searchCore(mode, req, ws);
  const results = toItems(outcome.ranked);
  recordSearch(ws, req.query, results.length);
  return { query: req.query, total: results.length, results, demo_note: outcome.note, demo_kind: outcome.kind };
}

export async function semanticSearch(req: SearchRequest, workspaceId = 1, _orgId = 1): Promise<DemoSearchResponse> {
  return doSearch("semantic", req, workspaceId);
}

export async function hybridSearch(req: SearchRequest, workspaceId = 1, _orgId = 1): Promise<DemoSearchResponse> {
  return doSearch("hybrid", req, workspaceId);
}

// ── Knowledge Graph ──
const inWs = <T extends { workspace_id: number }>(arr: T[], ws: number) => arr.filter((x) => x.workspace_id === ws);
const pubEnt = ({ workspace_id: _w, ...e }: (typeof S.entities)[number]): KGEntity => e;
const pubRel = ({ workspace_id: _w, ...r }: (typeof S.rels)[number]): KGRelationship => r;

export async function listKGEntities(workspaceId = 1, _orgId = 1): Promise<KGEntity[]> {
  return inWs(S.entities, wsOf(workspaceId)).map(pubEnt);
}

export async function getKGGraph(workspaceId = 1, _orgId = 1) {
  const ws = wsOf(workspaceId);
  const entities = inWs(S.entities, ws).map(pubEnt);
  const relationships = inWs(S.rels, ws).map(pubRel);
  return { entities, relationships, total_entities: entities.length, total_relationships: relationships.length };
}

export async function getKGEntity(id: number): Promise<KGEntity> {
  const e = S.entities.find((x) => x.id === id);
  return e ? pubEnt(e) : fail("Entity not found");
}

export async function searchKGEntities(query: string, workspaceId = 1, _orgId = 1): Promise<KGEntity[]> {
  const q = query.toLowerCase().trim();
  return inWs(S.entities, wsOf(workspaceId))
    .filter((e) => e.name.toLowerCase().includes(q) || e.entity_type.toLowerCase().includes(q))
    .map(pubEnt);
}

export async function createKGEntity(data: { name: string; entity_type: string; properties?: Record<string, unknown> }, workspaceId = 1, _orgId = 1): Promise<KGEntity> {
  const ws = wsOf(workspaceId);
  const e = { id: nextId("ent"), workspace_id: ws, name: data.name, entity_type: data.entity_type, properties: data.properties ?? null, created_at: new Date().toISOString() };
  S.entities.push(e);
  logActivity(ws, "created", "entity", data.name);
  return pubEnt(e);
}

export async function deleteKGEntity(id: number): Promise<void> {
  S.entities = S.entities.filter((e) => e.id !== id);
  S.rels = S.rels.filter((r) => r.source_entity_id !== id && r.target_entity_id !== id);
}

export async function listKGRelationships(): Promise<KGRelationship[]> {
  const ws = wsOf();
  return inWs(S.rels, ws).map(pubRel);
}

export async function getKGEntityRelationships(id: number): Promise<KGRelationship[]> {
  return S.rels.filter((r) => r.source_entity_id === id || r.target_entity_id === id).map(pubRel);
}

export async function createKGRelationship(data: { source_entity_id: number; target_entity_id: number; relationship_type: string; properties?: Record<string, unknown> }): Promise<KGRelationship> {
  const s = S.entities.find((e) => e.id === data.source_entity_id);
  const t = S.entities.find((e) => e.id === data.target_entity_id);
  if (!s || !t) fail("Entity not found");
  const r = {
    id: nextId("rel"), workspace_id: s!.workspace_id, source_entity_id: s!.id, target_entity_id: t!.id,
    source_name: s!.name, target_name: t!.name, relationship_type: data.relationship_type,
    properties: data.properties ?? null, created_at: new Date().toISOString(),
  };
  S.rels.push(r);
  return pubRel(r);
}

export async function deleteKGRelationship(id: number): Promise<void> {
  S.rels = S.rels.filter((r) => r.id !== id);
}

export async function findKGPaths(req: KGPathRequest): Promise<KGPathResponse> {
  const maxDepth = req.max_depth ?? 5;
  const start = S.entities.find((e) => e.id === req.source_entity_id);
  if (!start) return { paths: [] };
  const rels = inWs(S.rels, start.workspace_id);
  // Breadth-first search treating relationships as undirected.
  const prev = new Map<number, { from: number; rel: string }>();
  const seen = new Set([req.source_entity_id]);
  let frontier = [req.source_entity_id];
  for (let depth = 0; depth < maxDepth && frontier.length && !seen.has(req.target_entity_id); depth++) {
    const nextFrontier: number[] = [];
    for (const n of frontier) {
      for (const r of rels) {
        const other = r.source_entity_id === n ? r.target_entity_id : r.target_entity_id === n ? r.source_entity_id : null;
        if (other == null || seen.has(other)) continue;
        seen.add(other);
        prev.set(other, { from: n, rel: r.relationship_type });
        nextFrontier.push(other);
      }
    }
    frontier = nextFrontier;
  }
  if (!seen.has(req.target_entity_id)) return { paths: [] };
  const ids: number[] = [req.target_entity_id];
  const relTypes: string[] = [""];
  for (let cur = req.target_entity_id; cur !== req.source_entity_id;) {
    const p = prev.get(cur)!;
    ids.unshift(p.from);
    relTypes.unshift(p.rel);
    cur = p.from;
  }
  // relationship_type on step i is the edge from node i to node i+1 (matches the production output shape).
  const path = ids.map((id, i) => ({ entity_id: id, name: S.entities.find((e) => e.id === id)?.name ?? "?", relationship_type: relTypes[i] ?? "" }));
  return { paths: [{ path, total_weight: ids.length - 1 }] };
}

export async function getDocGraph(): Promise<DocGraphResponse> {
  const ws = wsOf();
  const docs = S.docs.filter((d) => d.workspace_id === ws);
  const edges: DocGraphResponse["edges"] = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const a = new Set(tokenize(S.chunks.filter((c) => c.document_id === docs[i].id).map((c) => c.content).join(" ")));
      const b = tokenize(S.chunks.filter((c) => c.document_id === docs[j].id).map((c) => c.content).join(" "));
      const shared = b.filter((t) => a.has(t)).length;
      if (shared > 25) edges.push({ source: docs[i].id, target: docs[j].id, type: "similar_content" });
    }
  }
  return { nodes: docs.map((d) => ({ id: d.id, filename: d.filename })), edges };
}

// ── Memory ──
const pubMem = ({ workspace_id: _w, ...m }: (typeof S.memories)[number]): Memory => m;

export async function listMemories(skip = 0, limit = 100, workspaceId = 1, _orgId = 1): Promise<MemoryListResponse> {
  const all = inWs(S.memories, wsOf(workspaceId)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { memories: all.slice(skip, skip + limit).map(pubMem), total: all.length, skip, limit };
}

export async function getMemory(id: number): Promise<Memory> {
  const m = S.memories.find((x) => x.id === id);
  return m ? pubMem(m) : fail("Memory not found");
}

export async function createMemory(data: MemoryCreate, workspaceId = 1, _orgId = 1): Promise<Memory> {
  const ws = wsOf(workspaceId);
  const m = {
    id: nextId("mem"), workspace_id: ws, fact: data.fact, source: data.source ?? null,
    importance_score: data.importance_score ?? 0.5, access_count: 0, last_accessed_at: null, created_at: new Date().toISOString(),
  };
  S.memories.push(m);
  logActivity(ws, "created", "memory");
  return pubMem(m);
}

export async function updateMemory(id: number, data: MemoryUpdate): Promise<Memory> {
  const m = S.memories.find((x) => x.id === id);
  if (!m) fail("Memory not found");
  if (data.fact !== undefined) m!.fact = data.fact;
  if (data.source !== undefined) m!.source = data.source;
  if (data.importance_score !== undefined) m!.importance_score = data.importance_score;
  return pubMem(m!);
}

export async function deleteMemory(id: number): Promise<void> {
  S.memories = S.memories.filter((m) => m.id !== id);
}

function rankMemories(query: string, ws: number, minImportance = 0): Memory[] {
  const q = tokenize(query);
  const pool = inWs(S.memories, ws).filter((m) => m.importance_score >= minImportance);
  if (!q.length) return pool.map(pubMem);
  return pool
    .map((m) => {
      const t = new Set(tokenize(m.fact + " " + (m.source ?? "")));
      const hit = q.filter((x) => t.has(x)).length;
      return { m, s: hit ? hit / q.length + m.importance_score * 0.25 : 0 };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => pubMem(x.m));
}

export async function searchMemories(req: MemorySearchRequest, workspaceId = 1, _orgId = 1): Promise<MemorySearchResponse> {
  const results = rankMemories(req.query, wsOf(workspaceId), req.min_importance ?? 0).slice(0, req.limit ?? 20);
  return { query: req.query, total: results.length, results };
}

export async function searchMemoriesRanked(req: MemorySearchRequest): Promise<MemorySearchResponse> {
  return searchMemories(req, wsOf());
}

export async function getImportantMemories(limit = 20, minImportance = 0.5, workspaceId = 1, _orgId = 1): Promise<Memory[]> {
  return inWs(S.memories, wsOf(workspaceId))
    .filter((m) => m.importance_score >= minImportance)
    .sort((a, b) => b.importance_score - a.importance_score)
    .slice(0, limit)
    .map(pubMem);
}

// ── Optimizer / TQL ──
export async function getOptimizerPlan(query: string, topK = 10, graphDepth = 5, _workspaceId = 1, _orgId = 1): Promise<OptimizerPlan> {
  return buildPlan({ query, topK, graphDepth });
}

export async function executeOptimizedQuery(query: string, topK = 10, graphDepth = 5, workspaceId = 1, _orgId = 1): Promise<OptimizerExecuteResponse> {
  const ws = wsOf(workspaceId);
  const plan = buildPlan({ query, topK, graphDepth });
  const tql = parseTQL(query);
  const about = tql ? (tql.about ?? "") : query;
  const on = (name: string) => plan.engines.find((e) => e.engine === name)?.enabled ?? false;
  const results: ExecutorResult[] = [];

  if (on("vector_search")) {
    const out = runSearch("hybrid", about || query, passagesFor(ws), topK);
    const data = out.ranked.map((r) => ({
      document_name: r.passage.document_name, chunk_index: r.passage.chunk_index, score: round(r.score),
      content: r.passage.content.length > 160 ? r.passage.content.slice(0, 160) + "…" : r.passage.content,
      chunk_id: r.passage.chunk_id, document_id: r.passage.document_id,
    }));
    results.push({ executor_name: "vector_search", success: true, error: null, data, total: data.length });
  }
  if (on("memory_search")) {
    let mem = rankMemories(about, ws);
    if (tql?.orderBy === "importance") mem = [...mem].sort((a, b) => b.importance_score - a.importance_score);
    const data = mem.slice(0, topK).map((m) => ({ fact: m.fact, source: m.source, importance_score: m.importance_score, access_count: m.access_count, id: m.id }));
    results.push({ executor_name: "memory_search", success: true, error: null, data, total: data.length });
  }
  if (on("graph_search")) {
    let ents = inWs(S.entities, ws);
    const typeFilter = tql?.where.find((w) => w.key === "type" || w.key === "entity_type");
    if (typeFilter) ents = ents.filter((e) => e.entity_type.toLowerCase() === typeFilter.value.toLowerCase());
    else if (about) {
      const q = tokenize(about);
      ents = ents.filter((e) => { const t = tokenize(e.name); return q.some((x) => t.includes(x)); });
    }
    ents = ents.slice(0, topK);
    const ids = new Set(ents.map((e) => e.id));
    const rels = inWs(S.rels, ws).filter((r) => ids.has(r.source_entity_id) || ids.has(r.target_entity_id)).slice(0, topK);
    const data: Record<string, unknown>[] = [
      ...ents.map((e) => ({ id: e.id, name: e.name, entity_type: e.entity_type })),
      ...rels.map((r) => ({ id: r.id, source_entity_id: r.source_entity_id, source_name: r.source_name, relationship_type: r.relationship_type, target_name: r.target_name })),
    ];
    results.push({ executor_name: "graph_search", success: true, error: null, data, total: data.length });
  }
  if (on("metadata_filter")) {
    let docs = S.docs.filter((d) => d.workspace_id === ws);
    tql?.where.forEach((w) => {
      if (w.key === "type" || w.key === "file_type") docs = docs.filter((d) => d.file_type === w.value.toLowerCase());
      if (w.key === "filename") docs = docs.filter((d) => d.filename.toLowerCase().includes(w.value.toLowerCase()));
    });
    if (about) {
      const q = tokenize(about);
      docs = docs.filter((d) => {
        const text = tokenize(d.filename.replace(/[-_.]/g, " ") + " " + S.chunks.filter((c) => c.document_id === d.id).map((c) => c.content).join(" "));
        return q.some((x) => text.includes(x));
      });
    }
    const data = docs.slice(0, topK).map((d) => ({ id: d.id, filename: d.filename, file_type: d.file_type, file_size: d.file_size, status: docStatus(d) }));
    results.push({ executor_name: "metadata_filter", success: true, error: null, data, total: data.length });
  }

  const execution: ExecutionResponse = {
    query,
    plan_used: { use_vector_search: on("vector_search"), use_memory_search: on("memory_search"), use_graph_search: on("graph_search"), use_metadata_filter: on("metadata_filter") },
    results,
    total_items: results.reduce((a, r) => a + r.total, 0),
  };
  recordSearch(ws, query, execution.total_items);
  return { plan, execution };
}

export async function explainTQL(tql: string): Promise<TQLExplainResponse> {
  const plan = buildPlan({ query: tql, topK: 10, graphDepth: 5 });
  return { tql, plan: plan.reasoning.join("\n") };
}

export async function executeTQL(req: TQLRequest): Promise<TQLResponse> {
  const parsed = parseTQL(req.tql);
  const { execution, plan } = await executeOptimizedQuery(req.tql);
  return {
    query: req.tql, resource: parsed?.resource ?? "documents",
    items: execution.results.flatMap((r) => r.data), total: execution.total_items,
    explanation: plan.reasoning[1] ?? "",
  };
}

// ── RAG (extractive, no LLM) ──
export async function executeRAG(req: RAGRequest, workspaceId = 1, _orgId = 1): Promise<RAGResponse> {
  const t0 = performance.now();
  const ws = wsOf(workspaceId);
  const mode = req.retrieval_mode === "semantic" ? "semantic" : "hybrid";
  const filtered = applyFilters(passagesFor(ws), req.filters, req.document_id);
  const outcome = runSearch(mode, req.query, filtered, req.top_k_chunks ?? 6);
  const t1 = performance.now();

  const items = toItems(outcome.ranked);
  const mems = rankMemories(req.query, ws).slice(0, req.top_k_memories ?? 3);
  const q = tokenize(req.query);
  const ents = inWs(S.entities, ws).filter((e) => tokenize(e.name).some((t) => q.includes(t))).slice(0, req.top_k_entities ?? 4);
  const answer = buildExtractiveAnswer(req.query, outcome.ranked);
  const t2 = performance.now();

  return {
    query: req.query,
    answer,
    sources: [
      { source: "vectors", count: items.length, items: items as unknown as Record<string, unknown>[] },
      { source: "memories", count: mems.length, items: mems as unknown as Record<string, unknown>[] },
      { source: "entities", count: ents.length, items: ents.map(pubEnt) as unknown as Record<string, unknown>[] },
    ],
    steps: [
      { name: "Query planning", duration_ms: round(Math.max(0.1, t1 - t0) * 0.1, 1), status: "ok", detail: "Rule-based plan (local)" },
      { name: "Retrieval", duration_ms: round(Math.max(0.2, t1 - t0), 1), status: "ok", detail: outcome.note },
      { name: "Context assembly", duration_ms: round(Math.max(0.1, t2 - t1), 1), status: "ok", detail: `${items.length} passages, ${mems.length} memories, ${ents.length} entities` },
      { name: "LLM generation", duration_ms: 0, status: "skipped", detail: "Skipped in demo mode: no language model is called." },
    ],
    total_duration_ms: round(t2 - t0, 1),
    llm_provider: "demo",
    llm_model: "extractive summary (no LLM called)",
    created_at: new Date().toISOString(),
  };
}

// ── Collections ──
const colView = (c: ColRec): Collection => ({
  id: c.id, organization_id: 1, workspace_id: c.workspace_id, name: c.name, description: c.description,
  document_count: c.docIds.filter((id) => S.docs.some((d) => d.id === id)).length, created_at: c.created_at, updated_at: c.updated_at,
});

export async function createCollection(data: CollectionCreate, workspaceId = 1, _orgId = 1): Promise<Collection> {
  const ws = wsOf(workspaceId);
  const now = new Date().toISOString();
  const c: ColRec = { id: nextId("col"), workspace_id: ws, name: data.name, description: data.description ?? null, created_at: now, updated_at: now, docIds: [] };
  S.collections.push(c);
  logActivity(ws, "created", "collection", data.name);
  return colView(c);
}

export async function listCollections(skip = 0, limit = 100, workspaceId = 1, _orgId = 1): Promise<CollectionListResponse> {
  const all = inWs(S.collections, wsOf(workspaceId));
  return { collections: all.slice(skip, skip + limit).map(colView), total: all.length };
}

export async function getCollection(id: number): Promise<CollectionDetail> {
  const c = S.collections.find((x) => x.id === id);
  if (!c) fail("Collection not found");
  const documents: CollectionDocumentItem[] = c!.docIds
    .map((did) => S.docs.find((d) => d.id === did))
    .filter((d): d is DocRec => !!d)
    .map((d) => ({ id: d.id, filename: d.filename, file_type: d.file_type, file_size: d.file_size, status: docStatus(d), created_at: d.created_at }));
  return { ...colView(c!), documents };
}

export async function updateCollection(id: number, data: CollectionUpdate): Promise<Collection> {
  const c = S.collections.find((x) => x.id === id);
  if (!c) fail("Collection not found");
  if (data.name !== undefined) c!.name = data.name;
  if (data.description !== undefined) c!.description = data.description;
  c!.updated_at = new Date().toISOString();
  return colView(c!);
}

export async function deleteCollection(id: number): Promise<void> {
  S.collections = S.collections.filter((c) => c.id !== id);
}

export async function addDocumentToCollection(collectionId: number, documentId: number): Promise<{ added: boolean; message: string }> {
  const c = S.collections.find((x) => x.id === collectionId);
  if (!c) fail("Collection not found");
  if (c!.docIds.includes(documentId)) return { added: false, message: "Document already in collection" };
  c!.docIds.push(documentId);
  c!.updated_at = new Date().toISOString();
  return { added: true, message: "Document added" };
}

export async function removeDocumentFromCollection(collectionId: number, documentId: number): Promise<void> {
  const c = S.collections.find((x) => x.id === collectionId);
  if (c) c.docIds = c.docIds.filter((id) => id !== documentId);
}

export async function searchCollection(collectionId: number, query: string, topK = 10): Promise<DemoSearchResponse> {
  const c = S.collections.find((x) => x.id === collectionId);
  if (!c) fail("Collection not found");
  const { outcome } = searchCore("hybrid", { query, top_k: topK }, c!.workspace_id, c!.docIds);
  const results = toItems(outcome.ranked);
  return { query, total: results.length, results, demo_note: outcome.note, demo_kind: outcome.kind };
}

// ── Analytics / Dashboard / Metrics ──
export async function getAnalyticsGrowth(days = 30, workspaceId = 1, _orgId = 1): Promise<AnalyticsGrowth> {
  return M.growth(days, wsOf(workspaceId));
}

export async function getDashboardStats(workspaceId = 1, _orgId = 1): Promise<DashboardStats> {
  const ws = wsOf(workspaceId);
  const docs = S.docs.filter((d) => d.workspace_id === ws);
  const done = new Set(docs.filter((d) => docStatus(d) === "completed").map((d) => d.id));
  const chunks = S.chunks.filter((c) => c.workspace_id === ws);
  return {
    total_documents: docs.length,
    total_chunks: chunks.length,
    total_embeddings: chunks.filter((c) => done.has(c.document_id)).length,
    total_memories: S.memories.filter((m) => m.workspace_id === ws).length,
    total_entities: S.entities.filter((e) => e.workspace_id === ws).length,
    recent_searches: S.searches.filter((s) => s.workspace_id === ws).slice(0, 5)
      .map((s) => ({ id: s.id, query: s.query, results_count: s.results_count, timestamp: s.timestamp })),
    storage_usage_bytes: docs.reduce((a, d) => a + d.file_size, 0),
  };
}

export async function getMetricsDashboard(): Promise<DashboardResponse> { return M.dashboardMetrics(); }
export async function getQueryLatencyTimeSeries(windowMinutes = 60): Promise<TimeSeriesResponse> { return M.queryLatencySeries(windowMinutes); }
export async function getEmbeddingTimeSeries(windowMinutes = 60): Promise<TimeSeriesResponse> { return M.embeddingSeries(windowMinutes); }
export async function getSearchMetrics(): Promise<SearchAccuracyMetrics> { return M.searchMetrics(); }
export async function getMemoryMetrics(): Promise<MemoryRetrievalMetrics> { return M.memoryMetrics(); }
