/**
 * Local retrieval helpers for the demo. Everything runs in the browser.
 *
 *  - tokenize / bm25      -> REAL keyword ranking over the sample passages.
 *  - simulatedVector      -> SIMULATED semantic similarity (concept lexicon). Not an embedding model.
 *  - rrf                  -> REAL Reciprocal Rank Fusion math (k = 60) over the lists above.
 *  - PRECOMPUTED (seed)   -> hand-curated result sets that stand in for a live FAISS index.
 *
 * The UI labels each result set so nothing is presented as live AI processing.
 */
import { PRECOMPUTED } from "./seed";

export type Passage = {
  chunk_id: number;
  chunk_index: number;
  content: string;
  document_id: number;
  document_name: string;
  file_type: string;
  created_at: string;
  key: string | null; // `${seedDocKey}:${chunkIndex}` for sample documents
};

export type Ranked = { passage: Passage; score: number; detail?: string };

export type SearchFilters = {
  filename?: string | null;
  file_type?: string | null;
  upload_date_from?: string | null;
  upload_date_to?: string | null;
};

const STOP = new Set(("a an and are as at be but by for from has have how in is it its of on or that the their this to was were what when where which who why will with we our you your do does did not can i if into than then there these those about over under per via vs").split(" "));

export function stem(w: string): string {
  let s = w.toLowerCase();
  if (s.length > 5 && s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.length > 6 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 5 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9@][a-z0-9@_]*/g) ?? [])
    .filter((t) => !STOP.has(t))
    .map(stem);
}

// ───────── Filters (real, local) ─────────
export function applyFilters(passages: Passage[], filters?: SearchFilters | null, documentId?: number | null): Passage[] {
  return passages.filter((p) => {
    if (documentId && p.document_id !== documentId) return false;
    if (!filters) return true;
    if (filters.filename && !p.document_name.toLowerCase().includes(filters.filename.toLowerCase())) return false;
    if (filters.file_type && p.file_type.toLowerCase() !== filters.file_type.toLowerCase()) return false;
    const day = p.created_at.slice(0, 10);
    if (filters.upload_date_from && day < filters.upload_date_from) return false;
    if (filters.upload_date_to && day > filters.upload_date_to) return false;
    return true;
  });
}

// ───────── BM25 (real, local) ─────────
export function bm25(query: string, passages: Passage[]): Ranked[] {
  const q = Array.from(new Set(tokenize(query)));
  if (!q.length || !passages.length) return [];
  const docs = passages.map((p) => tokenize(p.content + " " + p.document_name.replace(/[-_.]/g, " ")));
  const N = docs.length;
  const avg = docs.reduce((a, d) => a + d.length, 0) / N || 1;
  const df = new Map<string, number>();
  for (const t of q) df.set(t, docs.filter((d) => d.includes(t)).length);
  const out: Ranked[] = [];
  docs.forEach((d, i) => {
    const tf = new Map<string, number>();
    d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let s = 0;
    for (const t of q) {
      const f = tf.get(t) ?? 0;
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * ((f * 2.5) / (f + 1.5 * (0.25 + 0.75 * (d.length / avg))));
    }
    if (s > 0) out.push({ passage: passages[i], score: s });
  });
  return out.sort((a, b) => b.score - a.score);
}

// ───────── Simulated vector similarity ─────────
const CONCEPTS: Record<string, string[]> = {
  ann: "nearest neighbor ann index indexing hnsw ivf faiss flat quantization recall efsearch approximate speed fast lookup latency scan".split(" "),
  embeddings: "embedding embeddings vector vectors encoder minilm dimension dimensions model semantic meaning cosine similarity normalize".split(" "),
  hybrid: "hybrid keyword bm25 rrf reciprocal rank fusion merge combine fuse lexical paraphrase".split(" "),
  rag: "rag retrieval augmented generation answer grounded language llm hallucination prompt faithfulness context citation".split(" "),
  graph: "graph knowledge entity entities relationship relationships edge neighbor path connected connection link node cooccurrence".split(" "),
  database: "database postgres postgresql pgvector sqlite sql storage schema migration index column table".split(" "),
  ops: "latency slow incident outage alert p95 postmortem metrics monitoring regression remediation performance spike".split(" "),
  query: "tql query language find statement parser optimizer executor plan explain filter".split(" "),
  ml: "machine learning neural network transformer training supervised model evaluation metric test".split(" "),
  support: "ticket support upload processing stuck file customer faq billing".split(" "),
  deploy: "deploy deployment rollback runbook container migration capacity cpu memory load balancer".split(" "),
};
const CONCEPT_STEMS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(CONCEPTS).map(([k, v]) => [k, new Set(v.map(stem))]),
);
const CONCEPT_KEYS = Object.keys(CONCEPTS);

function conceptVec(tokens: string[]): number[] {
  const v = CONCEPT_KEYS.map((k) => {
    let n = 0;
    for (const t of tokens) if (CONCEPT_STEMS[k].has(t)) n++;
    return Math.sqrt(n);
  });
  return v;
}
function cos(a: number[], b: number[]): number {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}

export function simulatedVector(query: string, passages: Passage[]): Ranked[] {
  const qt = Array.from(new Set(tokenize(query)));
  if (!qt.length) return [];
  const qv = conceptVec(qt);
  const raw = passages.map((p) => {
    const pt = tokenize(p.content);
    const set = new Set(pt);
    const overlap = qt.filter((t) => set.has(t)).length / Math.sqrt(qt.length * Math.max(1, set.size));
    return { p, r: 0.7 * cos(qv, conceptVec(pt)) + 0.3 * Math.min(1, overlap * 3) };
  }).filter((x) => x.r > 0.04);
  const max = Math.max(...raw.map((x) => x.r), 0);
  if (!max) return [];
  // Spread into a cosine-like range; ranking order is preserved.
  return raw
    .map((x) => ({ passage: x.p, score: 0.5 + 0.45 * (x.r / max) }))
    .sort((a, b) => b.score - a.score);
}

// ───────── RRF (real math) ─────────
export function rrf(lists: Ranked[][], k = 60): Ranked[] {
  const acc = new Map<number, { passage: Passage; s: number; ranks: string[] }>();
  lists.forEach((list, li) => {
    list.forEach((r, i) => {
      const cur = acc.get(r.passage.chunk_id) ?? { passage: r.passage, s: 0, ranks: [] };
      cur.s += 1 / (k + i + 1);
      cur.ranks.push(`${li === 0 ? "keyword" : "vector"}#${i + 1}`);
      acc.set(r.passage.chunk_id, cur);
    });
  });
  const maxPossible = lists.length / (k + 1);
  return Array.from(acc.values())
    .sort((a, b) => b.s - a.s)
    .map((x) => ({ passage: x.passage, score: Math.min(1, x.s / maxPossible), detail: x.ranks.join(" + ") }));
}

export function capPerDocument(list: Ranked[], cap = 3): Ranked[] {
  const seen = new Map<number, number>();
  return list.filter((r) => {
    const n = seen.get(r.passage.document_id) ?? 0;
    if (n >= cap) return false;
    seen.set(r.passage.document_id, n + 1);
    return true;
  });
}

// ───────── Orchestration ─────────
export type SearchOutcome = {
  ranked: Ranked[];
  /** "precomputed" = curated example result set; "local" = computed in the browser right now */
  kind: "precomputed" | "local";
  note: string;
};

const normQuery = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function fromRefs(refs: [string, number][], passages: Passage[]): Ranked[] {
  const byKey = new Map(passages.filter((p) => p.key).map((p) => [p.key as string, p]));
  return refs.flatMap(([k, s]) => {
    const p = byKey.get(k);
    return p ? [{ passage: p, score: s }] : [];
  });
}

export function runSearch(mode: "semantic" | "hybrid", query: string, passages: Passage[], topK: number): SearchOutcome {
  const pre = PRECOMPUTED[normQuery(query)];
  if (pre) {
    const vec = fromRefs(pre.vector, passages);
    if (mode === "semantic") {
      return {
        ranked: vec.slice(0, topK),
        kind: "precomputed",
        note: "Precomputed example: this result set stands in for a live FAISS vector search. No embedding model ran in your browser.",
      };
    }
    const kw = fromRefs(pre.keyword, passages);
    return {
      ranked: capPerDocument(rrf([kw, vec])).slice(0, topK),
      kind: "precomputed",
      note: "Precomputed example: keyword and vector rankings were prepared in advance and fused here with Reciprocal Rank Fusion (k = 60). No live FAISS index or embedding model is running.",
    };
  }
  if (mode === "semantic") {
    return {
      ranked: simulatedVector(query, passages).slice(0, topK),
      kind: "local",
      note: "Computed locally in your browser with a simulated concept-similarity ranking. This approximates semantic search; no embedding model or FAISS index is running.",
    };
  }
  const kw = bm25(query, passages);
  const vec = simulatedVector(query, passages);
  return {
    ranked: capPerDocument(rrf([kw, vec])).slice(0, topK),
    kind: "local",
    note: "Computed locally in your browser: BM25 keyword ranking plus a simulated concept-similarity ranking, fused with Reciprocal Rank Fusion (k = 60). No embedding model or FAISS index is running.",
  };
}

// ───────── Extractive "answer" (no LLM) ─────────
export function firstSentence(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const m = clean.match(/^.+?[.!?](?=\s|$)/);
  const s = m ? m[0] : clean;
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, "") + "…" : s;
}

export function buildExtractiveAnswer(query: string, top: Ranked[]): string {
  if (!top.length) {
    return `No relevant passages for "${query}" were found in this sample workspace. Try one of the example queries or remove filters.`;
  }
  const parts = top.slice(0, 3).map((r, i) => `[${i + 1}] ${firstSentence(r.passage.content)}`);
  return `Demo answer assembled from the top ${parts.length} retrieved passage${parts.length > 1 ? "s" : ""} (extractive summary, no language model was called):\n\n${parts.join("\n")}`;
}

// ───────── TQL + optimizer (rule-based, local) ─────────
export type ParsedTQL = {
  resource: string;
  about: string | null;
  where: { key: string; value: string }[];
  orderBy: string | null;
};

export function parseTQL(input: string): ParsedTQL | null {
  const m = input.trim().match(/^FIND\s+(\w+)(?:\s+ABOUT\s+(.+?))?(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+))?\s*$/i);
  if (!m) return null;
  const where = (m[3] ?? "")
    .split(/\s+AND\s+/i)
    .map((c) => c.match(/^\s*(\w+)\s*=\s*['"]?([^'"]+?)['"]?\s*$/))
    .filter((x): x is RegExpMatchArray => !!x)
    .map((x) => ({ key: x[1].toLowerCase(), value: x[2] }));
  return { resource: m[1].toLowerCase(), about: m[2]?.trim() ?? null, where, orderBy: m[4]?.toLowerCase() ?? null };
}

export type PlanInput = { query: string; topK: number; graphDepth: number };

export function buildPlan(input: PlanInput) {
  const { query, topK, graphDepth } = input;
  const tql = parseTQL(query);
  const words = tokenize(query);
  const relational = /\b(related|relation|connect|connected|between|depends|link|path|neighbors?)\b/i.test(query) || tql?.resource === "entities";
  const structured = !!tql && (tql.where.length > 0 || tql.orderBy !== null);
  const wantsMemory = !tql || tql.resource === "memories" || /\b(remember|memory|memories|fact|facts|note)\b/i.test(query);
  const wantsDocs = !tql || tql.resource === "documents";

  let strategy = "hybrid_fusion";
  if (structured) strategy = "metadata_first";
  else if (relational) strategy = "graph_augmented";
  else if (words.length <= 1) strategy = "vector_only";

  const engines = [
    { engine: "vector_search", enabled: wantsDocs, priority: 1, top_k: topK, estimated_cost: 4.2, params: { metric: "cosine", simulated: true } },
    { engine: "memory_search", enabled: wantsMemory, priority: 2, top_k: Math.max(3, Math.round(topK / 2)), estimated_cost: 1.6, params: { min_importance: 0.3 } },
    { engine: "graph_search", enabled: relational || strategy === "hybrid_fusion", priority: 3, top_k: topK, estimated_cost: 2.8, params: { depth: graphDepth } },
    { engine: "metadata_filter", enabled: structured || (tql?.resource === "documents"), priority: 4, top_k: topK, estimated_cost: 0.9, params: { fields: ["filename", "file_type"] } },
  ];
  const reasoning: string[] = [
    tql ? `Parsed as TQL: FIND ${tql.resource}${tql.about ? ` ABOUT "${tql.about}"` : ""}${tql.where.length ? ` WHERE ${tql.where.map((w) => `${w.key}=${w.value}`).join(" AND ")}` : ""}${tql.orderBy ? ` ORDER BY ${tql.orderBy}` : ""}.` : `Treated as a natural-language query with ${words.length} significant term${words.length === 1 ? "" : "s"}.`,
    `Strategy "${strategy}" chosen by local rules (query shape, structured clauses, relational keywords).`,
    ...engines.map((e) => `${e.engine}: ${e.enabled ? "enabled" : "skipped"} (priority ${e.priority}, estimated cost ${e.estimated_cost}).`),
    "This plan is generated by simple rules in your browser; the production optimizer runs on the Titan backend.",
  ];
  return {
    query,
    strategy,
    engines,
    graph: { max_depth: graphDepth, max_neighbors: 10, prune_unconnected: true, bidirectional: true, expand_neighbors: relational },
    vector: { top_k: topK, ef_search: 64, min_score_threshold: 0.3, use_embedding_cache: true },
    total_estimated_cost: Math.round(engines.filter((e) => e.enabled).reduce((a, e) => a + e.estimated_cost, 0) * 100) / 100,
    reasoning,
  };
}
