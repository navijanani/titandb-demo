import { useEffect, useState, useCallback } from "react";
import { IconFileText, IconBrain, IconNetwork, IconSearch, IconBolt } from "@tabler/icons-react";
import { getAnalyticsGrowth, getQueryLatencyTimeSeries, getMetricsDashboard, getSearchMetrics, getMemoryMetrics } from "../api/client";
import type { AnalyticsGrowth, GrowthPoint, LatencyPoint } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { DemoNote } from "../demo/DemoNote";

export function AnalyticsPage() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [growth, setGrowth] = useState<AnalyticsGrowth | null>(null);
  const [latencySeries, setLatencySeries] = useState<{ timestamp: string; value: number; count: number }[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const [g, l, d] = await Promise.all([
        getAnalyticsGrowth(days, workspaceId),
        getQueryLatencyTimeSeries(days * 1440),
        getMetricsDashboard(),
      ]);
      setGrowth(g);
      setLatencySeries(l.points);
      setDashboardData(d);
    } catch { } finally {
      setLoading(false);
    }
  }, [days, activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">PERFORMANCE METRICS</div>
          <h1 className="content-header-name">Analytics Dashboard</h1>
        </div>
        <div className="header-actions">
          <label className="window-label">
            Period:
            <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
              <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </label>
        </div>
      </div>

      <div className="content-body">
      <DemoNote>Document, memory and entity counts come from the sample data. Search volume and latency charts are generated sample metrics, not measurements of a live system.</DemoNote>
      {loading ? (
        <p className="loading-text">Loading analytics...</p>
      ) : !growth ? (
        <p className="empty-text">No data available.</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="analytics-summary">
            <SummaryCard label="Documents" value={sumValues(growth.documents)} icon={IconFileText} color="#2563eb" />
            <SummaryCard label="Memories" value={sumValues(growth.memories)} icon={IconBrain} color="#d97706" />
            <SummaryCard label="Entities" value={sumValues(growth.entities)} icon={IconNetwork} color="#059669" />
            <SummaryCard label="Searches" value={sumValues(growth.search_volume)} icon={IconSearch} color="#7c3aed" />
          </div>

          <div className="analytics-grid">
            {/* Document Growth */}
            <ChartPanel title="Document Growth" subtitle="Documents created per day" color="#2563eb" icon={IconFileText}>
              {growth.documents.length === 0 ? (
                <p className="empty-text">No documents in this period.</p>
              ) : (
                <BarChart data={growth.documents} color="#2563eb" valueLabel="documents" />
              )}
            </ChartPanel>

            {/* Search Trends */}
            <ChartPanel title="Search Trends" subtitle="Searches executed per day" color="#7c3aed" icon={IconSearch}>
              {growth.search_volume.length === 0 ? (
                <p className="empty-text">No searches in this period.</p>
              ) : (
                <BarChart data={growth.search_volume} color="#7c3aed" valueLabel="searches" />
              )}
            </ChartPanel>

            {/* Memory Growth */}
            <ChartPanel title="Memory Growth" subtitle="Memories created per day" color="#d97706" icon={IconBrain}>
              {growth.memories.length === 0 ? (
                <p className="empty-text">No memories in this period.</p>
              ) : (
                <BarChart data={growth.memories} color="#d97706" valueLabel="memories" />
              )}
            </ChartPanel>

            {/* Entity Growth */}
            <ChartPanel title="Entity Growth" subtitle="Entities created per day" color="#059669" icon={IconNetwork}>
              {growth.entities.length === 0 ? (
                <p className="empty-text">No entities in this period.</p>
              ) : (
                <BarChart data={growth.entities} color="#059669" valueLabel="entities" />
              )}
            </ChartPanel>

            {/* Query Performance */}
            <ChartPanel title="Query Performance" subtitle="Latency percentiles over time" color="#dc2626" icon={IconBolt} wide>
              {latencySeries.length === 0 ? (
                <p className="empty-text">No query data in this period.</p>
              ) : (
                <div className="perf-chart-area">
                  <LatencyChart data={latencySeries} />
                  <div className="perf-summary">
                    {dashboardData?.query_latency && (
                      <div className="perf-stats">
                        <PerfStat label="Avg" value={`${dashboardData.query_latency.avg_ms.toFixed(1)}ms`} />
                        <PerfStat label="P50" value={`${dashboardData.query_latency.p50_ms.toFixed(1)}ms`} />
                        <PerfStat label="P95" value={`${dashboardData.query_latency.p95_ms.toFixed(1)}ms`} />
                        <PerfStat label="P99" value={`${dashboardData.query_latency.p99_ms.toFixed(1)}ms`} />
                        <PerfStat label="Count" value={String(dashboardData.query_latency.count)} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ChartPanel>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: any; color: string }) {
  const Icon = icon;
  return (
    <div className="dash-card">
      <div className="dash-card-icon" style={{ background: color + "15", color }}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="dash-card-body">
        <span className="dash-card-label">{label}</span>
        <span className="dash-card-value">{value}</span>
      </div>
    </div>
  );
}

function ChartPanel({ title, subtitle, color, icon, children, wide }: { title: string; subtitle: string; color: string; icon: any; children: React.ReactNode; wide?: boolean }) {
  const Icon = icon;
  return (
    <div className={`chart-panel ${wide ? "chart-panel-wide" : ""}`}>
      <div className="chart-panel-header">
        <div className="chart-panel-title">
          <span className="chart-panel-icon" style={{ color }}>
            <Icon size={20} strokeWidth={2} />
          </span>
          <div>
            <h3>{title}</h3>
            <span className="chart-panel-subtitle">{subtitle}</span>
          </div>
        </div>
      </div>
      <div className="chart-panel-body">
        {children}
      </div>
    </div>
  );
}

function BarChart({ data, color, valueLabel }: { data: GrowthPoint[]; color: string; valueLabel: string }) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const height = 200;
  const barWidth = Math.max(6, Math.min(40, Math.floor(700 / data.length)));

  return (
    <div className="bar-chart-wrap">
      <div className="bar-chart-y-axis">
        <span>{max}</span>
        <span>{Math.round(max / 2)}</span>
        <span>0</span>
      </div>
      <div className="bar-chart" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * height;
          return (
            <div key={i} className="bar-chart-col" style={{ width: barWidth + 4 }}>
              <div
                className="bar-chart-bar"
                style={{
                  height: Math.max(2, h),
                  width: barWidth,
                  background: color,
                }}
                title={`${d.date}: ${d.value} ${valueLabel}`}
              />
              {data.length <= 31 && (
                <span className="bar-chart-label">{d.date.slice(5)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LatencyChart({ data }: { data: { timestamp: string; value: number; count: number }[] }) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const height = 200;
  const barWidth = Math.max(4, Math.min(30, Math.floor(700 / data.length)));

  return (
    <div className="bar-chart-wrap">
      <div className="bar-chart-y-axis">
        <span>{max.toFixed(0)}ms</span>
        <span>{Math.round(max / 2)}ms</span>
        <span>0</span>
      </div>
      <div className="bar-chart" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * height;
          return (
            <div key={i} className="bar-chart-col" style={{ width: barWidth + 4 }}>
              <div
                className="bar-chart-bar"
                style={{
                  height: Math.max(2, h),
                  width: barWidth,
                  background: "#dc2626",
                }}
                title={`${d.timestamp}: ${d.value.toFixed(1)}ms (${d.count} req)`}
              />
              {data.length <= 31 && (
                <span className="bar-chart-label">{new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="perf-stat">
      <span className="perf-stat-label">{label}</span>
      <span className="perf-stat-value">{value}</span>
    </div>
  );
}

function sumValues(points: GrowthPoint[]): number {
  return points.reduce((s, p) => s + p.value, 0);
}
