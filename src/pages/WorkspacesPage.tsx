import { useState, useEffect, useCallback, type FC } from "react";
import { IconSearch } from "@tabler/icons-react";
import type { Workspace } from "../types/workspace";
import { listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, toggleFavorite, toggleArchive } from "../api/workspaceApi";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { WorkspaceCard } from "../components/workspace/WorkspaceCard";
import { WorkspaceRow } from "../components/workspace/WorkspaceRow";
import { WorkspaceCreateModal } from "../components/workspace/WorkspaceCreateModal";
import { WorkspaceContextMenu, type MenuAction } from "../components/workspace/WorkspaceContextMenu";
import { WorkspaceEmpty } from "../components/workspace/WorkspaceEmpty";

type ViewMode = "grid" | "list";
type SortKey = "name" | "created" | "updated";

export const WorkspacesPage: FC = () => {
  const { setActiveWorkspaceId } = useActiveWorkspace();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; ws: Workspace } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listWorkspaces({
        search: debouncedSearch || undefined,
        sort,
        order,
        limit: 100,
      });
      setWorkspaces(res.workspaces);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sort, order]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const handleCreate = async (data: { name: string; description: string; icon: string; color: string }) => {
    const ws = await createWorkspace(data);
    await fetchWorkspaces();
    setActiveWorkspaceId(ws.id);
  };

  const handleEdit = async (data: { name: string; description: string; icon: string; color: string }) => {
    if (!editTarget) return;
    await updateWorkspace(editTarget.id, data);
    setEditTarget(null);
    await fetchWorkspaces();
  };

  const handleContextAction = async (action: MenuAction) => {
    if (!menu) return;
    const { ws } = menu;
    try {
      switch (action) {
        case "edit":
          setEditTarget(ws);
          break;
        case "favorite":
          await toggleFavorite(ws.id);
          await fetchWorkspaces();
          break;
        case "archive":
          await toggleArchive(ws.id);
          await fetchWorkspaces();
          break;
        case "delete":
          setConfirmDelete(ws.id);
          break;
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteWorkspace(confirmDelete);
    } catch { /* ignore */ }
    setConfirmDelete(null);
    await fetchWorkspaces();
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("asc");
    }
  };

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">WORKSPACE MANAGEMENT</div>
          <h1 className="content-header-name">Workspaces</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>+ New Workspace</button>
        </div>
      </div>

      <div className="content-body">

      <div className="ws-toolbar">
        <div className="ws-search-wrap">
          <span className="ws-search-icon"><IconSearch size={18} strokeWidth={2} /></span>
          <input
            className="ws-search"
            placeholder="Search workspaces…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="ws-search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="ws-view-toggle">
          <button
            className={`ws-view-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => setView("grid")}
            title="Grid view"
          >▦</button>
          <button
            className={`ws-view-btn ${view === "list" ? "active" : ""}`}
            onClick={() => setView("list")}
            title="List view"
          >☰</button>
        </div>
        <div className="ws-sort">
          <button
            className={`ws-sort-btn ${sort === "name" ? "active" : ""}`}
            onClick={() => toggleSort("name")}
          >
            Name {sort === "name" && (order === "asc" ? "↑" : "↓")}
          </button>
          <button
            className={`ws-sort-btn ${sort === "created" ? "active" : ""}`}
            onClick={() => toggleSort("created")}
          >
            Created {sort === "created" && (order === "asc" ? "↑" : "↓")}
          </button>
          <button
            className={`ws-sort-btn ${sort === "updated" ? "active" : ""}`}
            onClick={() => toggleSort("updated")}
          >
            Updated {sort === "updated" && (order === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {error && <div className="msg error">{error}</div>}

      {loading ? (
        <div className="loading-text">Loading workspaces…</div>
      ) : workspaces.length === 0 ? (
        <WorkspaceEmpty search={debouncedSearch} onCreate={() => setCreateOpen(true)} />
      ) : (
        <>
          <div className="ws-count">{total} workspace{total !== 1 ? "s" : ""}</div>
          {view === "grid" ? (
            <div className="ws-grid">
              {workspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  onSelect={(id) => setActiveWorkspaceId(id)}
                  onFavorite={async (id) => { await toggleFavorite(id); fetchWorkspaces(); }}
                  onContextMenu={(e, ws) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, ws });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="ws-list">
              <div className="ws-list-header">
                <span className="ws-list-h-icon" />
                <span className="ws-list-h-name">Name</span>
                <span className="ws-list-h-stat">Docs</span>
                <span className="ws-list-h-stat">Memories</span>
                <span className="ws-list-h-stat">Storage</span>
                <span className="ws-list-h-time">Updated</span>
                <span className="ws-list-h-star" />
              </div>
              {workspaces.map((ws) => (
                <WorkspaceRow
                  key={ws.id}
                  workspace={ws}
                  onSelect={(id) => setActiveWorkspaceId(id)}
                  onFavorite={async (id) => { await toggleFavorite(id); fetchWorkspaces(); }}
                  onContextMenu={(e, ws) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, ws });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
      </div>

      {menu && (
        <WorkspaceContextMenu
          x={menu.x}
          y={menu.y}
          workspace={menu.ws}
          onAction={handleContextAction}
          onClose={() => setMenu(null)}
        />
      )}

      {createOpen && (
        <WorkspaceCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {editTarget && (
        <WorkspaceCreateModal
          onClose={() => setEditTarget(null)}
          onCreate={handleEdit}
          initial={{
            name: editTarget.name,
            description: editTarget.description,
            icon: editTarget.icon,
            color: editTarget.color,
          }}
        />
      )}

      {confirmDelete !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Workspace</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this workspace? All documents, memories, and data within will be permanently removed.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
