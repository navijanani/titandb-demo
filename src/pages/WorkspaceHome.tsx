import { useState, useEffect, useCallback, useRef, type FC } from "react";
import {
  IconFileText, IconBrain, IconBox, IconFolders, IconSearch, IconUsers, IconSettings,
  IconSparkles, IconUpload, IconTrash, IconEdit, IconStar, IconArchive, IconMicroscope, IconCheck, IconPin, IconFolder
} from "@tabler/icons-react";
import type { Workspace, WorkspaceStats, ActivityItem } from "../types/workspace";
import { getWorkspace, getWorkspaceStats, getWorkspaceActivity, updateWorkspace, deleteWorkspace, toggleFavorite, toggleArchive } from "../api/workspaceApi";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { WorkspaceCreateModal } from "../components/workspace/WorkspaceCreateModal";

export const WorkspaceHome: FC = () => {
  const { activeWorkspaceId, setActiveWorkspaceId } = useActiveWorkspace();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError("");
    try {
      const [ws, st, act] = await Promise.all([
        getWorkspace(activeWorkspaceId),
        getWorkspaceStats(activeWorkspaceId),
        getWorkspaceActivity(activeWorkspaceId, 0, 10),
      ]);
      setWorkspace(ws);
      setStats(st);
      setActivities(act.activities);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleUpdateWorkspace = async (data: { name: string; description: string; icon: string; color: string }) => {
    if (!activeWorkspaceId) return;
    const updated = await updateWorkspace(activeWorkspaceId, data);
    setWorkspace(updated);
  };

  const handleToggleFavorite = async () => {
    if (!activeWorkspaceId) return;
    await toggleFavorite(activeWorkspaceId);
    await fetchAll();
    setMenuOpen(false);
  };

  const handleToggleArchive = async () => {
    if (!activeWorkspaceId) return;
    await toggleArchive(activeWorkspaceId);
    await fetchAll();
    setMenuOpen(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId) return;
    await deleteWorkspace(activeWorkspaceId);
    setConfirmDelete(false);
    setActiveWorkspaceId(null);
    window.location.hash = "#workspaces";
  };

  const fmtBytes = (b: number) => {
    for (const unit of ["B", "KB", "MB", "GB"]) {
      if (b < 1024) return `${b.toFixed(1)} ${unit}`;
      b /= 1024;
    }
    return `${b.toFixed(1)} TB`;
  };

  const renderActivityIcon = (action: string) => {
    const map: Record<string, any> = {
      created: IconSparkles, uploaded: IconUpload, deleted: IconTrash, updated: IconEdit,
      favorite_toggled: IconStar, archive_toggled: IconArchive, extracted: IconMicroscope,
      completed: IconCheck,
    };
    const Icon = map[action] ?? IconPin;
    return <Icon size={16} strokeWidth={2} />;
  };

  if (!activeWorkspaceId) {
    return (
      <div className="page">
        <div className="ws-home-empty">
          <div className="ws-empty-icon"><IconFolder size={48} strokeWidth={1.5} /></div>
          <h3>Select a workspace</h3>
          <p>Choose a workspace from the sidebar to view its details.</p>
          <button className="btn-primary" onClick={() => setActiveWorkspaceId(1)}>
            Go to Default Workspace
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-text">Loading workspace…</div>;
  if (error) return <div className="msg error">{error}</div>;
  if (!workspace) return <div className="empty-text">Workspace not found</div>;

  const metricCards = [
    { label: "Documents", value: stats?.document_count ?? 0, icon: IconFileText },
    { label: "Memories", value: stats?.memory_count ?? 0, icon: IconBrain },
    { label: "Entities", value: stats?.entity_count ?? 0, icon: IconBox },
    { label: "Collections", value: stats?.collection_count ?? 0, icon: IconFolders },
  ];

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">WORKSPACE</div>
          <h1 className="content-header-name">{workspace.name}</h1>
        </div>
        <div className="header-actions">
          <div style={{ position: "relative" }} ref={menuRef}>
            <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
              <IconSettings size={18} strokeWidth={2} />
            </button>
            {menuOpen && workspace && (
              <div className="ws-settings-menu">
                <button className="ws-settings-item" onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}>
                  <IconEdit size={16} strokeWidth={2} />
                  <span>Edit Details</span>
                </button>
                <button className="ws-settings-item" onClick={handleToggleFavorite}>
                  <IconStar size={16} strokeWidth={2} />
                  <span>{workspace.is_favorite ? "Remove from favorites" : "Add to favorites"}</span>
                </button>
                <button className="ws-settings-item" onClick={handleToggleArchive}>
                  <IconArchive size={16} strokeWidth={2} />
                  <span>{workspace.is_archived ? "Unarchive" : "Archive"}</span>
                </button>
                <button className="ws-settings-item danger" onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}>
                  <IconTrash size={16} strokeWidth={2} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={() => { window.location.hash = "#documents"; }}>
            <IconUpload size={18} strokeWidth={2} />
            Add Resource
          </button>
        </div>
      </div>

      <div className="content-body">
        <div className="dashboard-metrics">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="metric-card">
                <div className="metric-icon">
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="metric-content">
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {workspace.description && (
          <p className="ws-home-desc">{workspace.description}</p>
        )}

        {stats && (
          <div className="section">
            <div className="section-header"><h3>Storage</h3></div>
            <div className="ws-storage-bar">
              <div className="ws-storage-track">
                <div
                  className="ws-storage-fill"
                  style={{ width: `${Math.min((stats.storage_bytes / (50 * 1024 * 1024)) * 100, 100)}%` }}
                />
              </div>
              <span className="ws-storage-label">{stats.storage_formatted} / 50.0 MB</span>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-header"><h3>Recent Activity</h3></div>
          {activities.length === 0 ? (
            <p className="empty-text">No recent activity</p>
          ) : (
            <div className="ws-activity-list">
              {activities.map((act) => (
                <div key={act.id} className="ws-activity-item">
                  <span className="ws-activity-icon">{renderActivityIcon(act.action)}</span>
                  <div className="ws-activity-body">
                    <span className="ws-activity-text">
                      <strong>{act.user_display_name || "System"}</strong>{" "}
                      {act.action.replace(/_/g, " ")}
                      {act.entity_type ? ` ${act.entity_type}` : ""}
                      {act.metadata?.name ? ` "${act.metadata.name}"` : ""}
                    </span>
                    <span className="ws-activity-time">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {settingsOpen && workspace && (
        <WorkspaceCreateModal
          onClose={() => setSettingsOpen(false)}
          onCreate={handleUpdateWorkspace}
          initial={{
            name: workspace.name,
            description: workspace.description || "",
            icon: workspace.icon,
            color: workspace.color,
            id: workspace.id,
          }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Workspace</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this workspace? All documents, memories, and data within will be permanently removed.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn-danger" onClick={handleDeleteWorkspace}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
