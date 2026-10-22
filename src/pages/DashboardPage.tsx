import { useEffect, useState, useCallback } from "react";
import { IconFileText, IconPuzzle, IconBinaryTree, IconBrain, IconNetwork, IconDatabase } from "@tabler/icons-react";
import { getDashboardStats } from "../api/client";
import type { DashboardStats } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";

export function DashboardPage() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getDashboardStats(activeWorkspaceId || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="studio-content">
        <div className="content-header">
          <div className="content-header-title">
            <div className="content-header-label">OVERVIEW</div>
            <h1 className="content-header-name">Dashboard</h1>
          </div>
        </div>
        <div className="content-body">
          <p className="loading-text">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="studio-content">
        <div className="content-header">
          <div className="content-header-title">
            <div className="content-header-label">OVERVIEW</div>
            <h1 className="content-header-name">Dashboard</h1>
          </div>
          <div className="header-actions">
            <button onClick={load} className="btn-primary">Retry</button>
          </div>
        </div>
        <div className="content-body">
          <div className="msg error">{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards: { label: string; value: number | string; icon: any }[] = [
    { label: "Total Documents", value: stats.total_documents, icon: IconFileText },
    { label: "Total Chunks", value: stats.total_chunks, icon: IconPuzzle },
    { label: "Total Embeddings", value: stats.total_embeddings, icon: IconBinaryTree },
    { label: "Total Memories", value: stats.total_memories, icon: IconBrain },
    { label: "Total Entities", value: stats.total_entities, icon: IconNetwork },
    { label: "Storage Used", value: formatBytes(stats.storage_usage_bytes), icon: IconDatabase },
  ];

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">OVERVIEW</div>
          <h1 className="content-header-name">Dashboard</h1>
        </div>
        <div className="header-actions">
          <button onClick={load} className="btn-secondary">Refresh</button>
        </div>
      </div>

      <div className="content-body">

      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="dash-card">
              <div className="dash-card-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="dash-card-body">
                <span className="dash-card-label">{card.label}</span>
                <span className="dash-card-value">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <div className="section-header">
          <h3>Recent Searches</h3>
        </div>
        {stats.recent_searches.length === 0 ? (
          <p className="empty-text">No searches recorded yet.</p>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Query</th>
                <th>Results</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_searches.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><span className="search-query-text">{s.query}</span></td>
                  <td>{s.results_count}</td>
                  <td className="timestamp-cell">{new Date(s.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
