/**
 * Sample operational metrics. Values are generated from a seeded pseudo-random
 * sequence so the charts look realistic and stay stable between renders.
 * They are NOT measurements of a running system.
 */
import type { TimeSeriesResponse, DashboardResponse, SearchAccuracyMetrics, MemoryRetrievalMetrics } from "../types/metrics";
import type { AnalyticsGrowth, GrowthPoint } from "../types/analytics";
import { S } from "./store";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};

export function growth(days: number, ws: number): AnalyticsGrowth {
  const perDay = (items: { created_at: string }[]): GrowthPoint[] => {
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.created_at.slice(0, 10), (counts.get(i.created_at.slice(0, 10)) ?? 0) + 1));
    return Array.from({ length: days }, (_, i) => {
      const date = day(days - 1 - i);
      return { date, value: counts.get(date) ?? 0 };
    });
  };
  const r = rng(ws * 7919 + days);
  const search_volume = Array.from({ length: days }, (_, i) => {
    const date = day(days - 1 - i);
    const weekday = new Date(date).getDay();
    const base = weekday === 0 || weekday === 6 ? 3 : 14;
    return { date, value: Math.round(base + r() * base * 0.8 + (i / days) * 6) };
  });
  const query_latency = Array.from({ length: days }, (_, i) => {
    const avg = 38 + r() * 14 - (i / days) * 6;
    return { date: day(days - 1 - i), avg_ms: avg, p50_ms: avg * 0.85, p95_ms: avg * 2.3, p99_ms: avg * 3.4, count: search_volume[i].value };
  });
  return {
    documents: perDay(S.docs.filter((d) => d.workspace_id === ws)),
    memories: perDay(S.memories.filter((m) => m.workspace_id === ws)),
    entities: perDay(S.entities.filter((e) => e.workspace_id === ws)),
    search_volume, query_latency, days,
  };
}

function series(name: string, windowMinutes: number, seed: number, base: number, spread: number): TimeSeriesResponse {
  const bucket = windowMinutes <= 1440 ? Math.max(1, Math.ceil(windowMinutes / 60)) : 1440;
  const n = Math.max(1, Math.floor(windowMinutes / bucket));
  const r = rng(seed + windowMinutes);
  const now = Date.now();
  const points = Array.from({ length: n }, (_, i) => {
    const t = now - (n - 1 - i) * bucket * 60_000;
    const spike = r() > 0.94 ? spread * 2.2 : 0;
    return { timestamp: new Date(t).toISOString(), value: Math.max(1, base + (r() - 0.5) * spread + spike), count: Math.round(4 + r() * 22) };
  });
  return { metric_name: name, points, total: points.length, window_minutes: windowMinutes };
}

export const queryLatencySeries = (w: number) => series("query_latency_ms", w, 11, 42, 22);
export const embeddingSeries = (w: number) => series("embedding_time_ms", w, 29, 6.4, 3.2);

export function searchMetrics(): SearchAccuracyMetrics {
  return { total_searches: 1284, queries_with_results: 1241, zero_result_queries: 43, zero_result_rate: 43 / 1284, avg_results_per_query: 7.6 };
}
export function memoryMetrics(): MemoryRetrievalMetrics {
  return { total_retrievals: 642, avg_latency_ms: 11.8, avg_results_count: 4.3, total_memories_stored: S.memories.length };
}
export function dashboardMetrics(): DashboardResponse {
  const chunks = S.chunks.length;
  return {
    query_latency: { min_ms: 9.4, max_ms: 188.2, avg_ms: 41.7, p50_ms: 35.2, p95_ms: 96.4, p99_ms: 141.8, count: 1284 },
    embedding: { total_embeddings: chunks, avg_time_ms: 6.4, total_chunks_embedded: chunks },
    search_accuracy: searchMetrics(),
    memory: memoryMetrics(),
    recent_alerts: [
      { level: "warning", metric: "query_latency_p95", message: "p95 latency above 150 ms for 3 minutes (sample alert)", at: new Date(Date.now() - 6 * 3_600_000).toISOString() },
      { level: "info", metric: "ingestion", message: "Embedding backlog cleared (sample alert)", at: new Date(Date.now() - 20 * 3_600_000).toISOString() },
    ],
  };
}
