import { useEffect, useState, useCallback } from "react";
import { DemoNote } from "../demo/DemoNote";
import { getMetricsDashboard, getQueryLatencyTimeSeries, getEmbeddingTimeSeries, getSearchMetrics, getMemoryMetrics } from "../api/client";
import type { DashboardResponse, TimeSeriesResponse, SearchAccuracyMetrics, MemoryRetrievalMetrics } from "../api/client";

export function MetricsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [latencySeries, setLatencySeries] = useState<TimeSeriesResponse | null>(null);
  const [embeddingSeries, setEmbeddingSeries] = useState<TimeSeriesResponse | null>(null);
  const [searchMetrics, setSearchMetrics] = useState<SearchAccuracyMetrics | null>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryRetrievalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState(60);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, l, e, s, m] = await Promise.all([
        getMetricsDashboard(),
        getQueryLatencyTimeSeries(window),
        getEmbeddingTimeSeries(window),
        getSearchMetrics(),
        getMemoryMetrics(),
      ]);
      setDashboard(d);
      setLatencySeries(l);
      setEmbeddingSeries(e);
      setSearchMetrics(s);
      setMemoryMetrics(m);
    } catch { } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><h2>System Metrics</h2></div>
        <p className="loading-text">Loading metrics...</p>
      </div>
    );
  }

  const ql = dashboard?.query_latency;
  const em = dashboard?.embedding;
  const sa = searchMetrics;
  const mr = memoryMetrics;

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">SYSTEM MONITORING</div>
          <h1 className="content-header-name">System Metrics</h1>
        </div>
        <div className="header-actions">
          <label className="window-label">
            Window:
            <select value={window} onChange={(e) => setWindow(parseInt(e.target.value))}>
              <option value="15">15 min</option>
              <option value="60">1 hour</option>
              <option value="360">6 hours</option>
              <option value="1440">24 hours</option>
            </select>
          </label>
        </div>
      </div>

      <div className="content-body">
      <DemoNote>All figures on this page are generated sample metrics, not measurements of a live system.</DemoNote>

      <div className="metrics-grid">
        {/* Query Latency */}
        <div className="metric-card">
          <h3>Query Latency</h3>
          {ql ? (
            <div className="metric-stats">
              <div className="stat-row"><span>Avg</span><span className="stat-value">{ql.avg_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>P50</span><span className="stat-value">{ql.p50_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>P95</span><span className="stat-value">{ql.p95_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>P99</span><span className="stat-value">{ql.p99_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>Count</span><span className="stat-value">{ql.count}</span></div>
            </div>
          ) : <p className="empty-text">No data</p>}
        </div>

        {/* Embeddings */}
        <div className="metric-card">
          <h3>Embeddings</h3>
          {em ? (
            <div className="metric-stats">
              <div className="stat-row"><span>Total</span><span className="stat-value">{em.total_embeddings}</span></div>
              <div className="stat-row"><span>Avg Time</span><span className="stat-value">{em.avg_time_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>Chunks</span><span className="stat-value">{em.total_chunks_embedded}</span></div>
            </div>
          ) : <p className="empty-text">No data</p>}
        </div>

        {/* Search Accuracy */}
        <div className="metric-card">
          <h3>Search Accuracy</h3>
          {sa ? (
            <div className="metric-stats">
              <div className="stat-row"><span>Total</span><span className="stat-value">{sa.total_searches}</span></div>
              <div className="stat-row"><span>With Results</span><span className="stat-value">{sa.queries_with_results}</span></div>
              <div className="stat-row"><span>Zero Results</span><span className="stat-value">{sa.zero_result_queries}</span></div>
              <div className="stat-row"><span>Zero Rate</span><span className="stat-value">{(sa.zero_result_rate * 100).toFixed(1)}%</span></div>
              <div className="stat-row"><span>Avg Results</span><span className="stat-value">{sa.avg_results_per_query.toFixed(1)}</span></div>
            </div>
          ) : <p className="empty-text">No data</p>}
        </div>

        {/* Memory */}
        <div className="metric-card">
          <h3>Memory</h3>
          {mr ? (
            <div className="metric-stats">
              <div className="stat-row"><span>Retrievals</span><span className="stat-value">{mr.total_retrievals}</span></div>
              <div className="stat-row"><span>Avg Latency</span><span className="stat-value">{mr.avg_latency_ms.toFixed(1)}ms</span></div>
              <div className="stat-row"><span>Avg Results</span><span className="stat-value">{mr.avg_results_count.toFixed(1)}</span></div>
              <div className="stat-row"><span>Stored</span><span className="stat-value">{mr.total_memories_stored}</span></div>
            </div>
          ) : <p className="empty-text">No data</p>}
        </div>
      </div>

      {/* Time Series Charts */}
      <div className="charts-row">
        <div className="section chart-section">
          <h3>Query Latency (Last {window} min)</h3>
          {latencySeries && latencySeries.points.length > 0 ? (
            <SimpleChart points={latencySeries.points} color="#2563eb" />
          ) : (
            <p className="empty-text">No time-series data yet. Make some queries first.</p>
          )}
        </div>
        <div className="section chart-section">
          <h3>Embedding Time (Last {window} min)</h3>
          {embeddingSeries && embeddingSeries.points.length > 0 ? (
            <SimpleChart points={embeddingSeries.points} color="#8b5cf6" />
          ) : (
            <p className="empty-text">No time-series data yet. Process documents first.</p>
          )}
        </div>
      </div>

      {dashboard?.recent_alerts && dashboard.recent_alerts.length > 0 && (
        <div className="section alerts-section">
          <h3>Recent Alerts</h3>
          <div className="alerts-list">
            {dashboard.recent_alerts.map((alert, i) => (
              <div key={i} className="alert-item">
                {JSON.stringify(alert)}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function SimpleChart({ points, color }: { points: { timestamp: string; value: number; count: number }[]; color: string }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const height = 160;
  const barWidth = Math.max(4, Math.min(30, Math.floor(600 / points.length)));

  return (
    <div className="chart-container">
      <div className="chart-bars" style={{ height }}>
        {points.slice(-60).map((p, i) => {
          const h = (p.value / max) * height;
          return (
            <div
              key={i}
              className="chart-bar"
              style={{
                height: Math.max(2, h),
                width: barWidth,
                background: color,
                opacity: 0.6 + (p.count / Math.max(...points.map((x) => x.count), 1)) * 0.4,
              }}
              title={`${p.value.toFixed(1)}ms (${p.count} req at ${new Date(p.timestamp).toLocaleTimeString()})`}
            />
          );
        })}
      </div>
    </div>
  );
}
