import { type FC } from "react";
import type { Workspace } from "../../types/workspace";
import { getWorkspaceIcon } from "../../utils/workspaceIcons";

type Props = {
  workspace: Workspace;
  onSelect: (id: number) => void;
  onFavorite: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, ws: Workspace) => void;
};

export const WorkspaceRow: FC<Props> = ({ workspace, onSelect, onFavorite, onContextMenu }) => {
  const fmtBytes = (b: number) => {
    for (const unit of ["B", "KB", "MB", "GB"]) {
      if (b < 1024) return `${b.toFixed(1)} ${unit}`;
      b /= 1024;
    }
    return `${b.toFixed(1)} TB`;
  };

  const ago = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className={`ws-row ${workspace.is_archived ? "ws-row-archived" : ""}`}
      onClick={() => onSelect(workspace.id)}
      onContextMenu={(e) => onContextMenu(e, workspace)}
    >
      <span className="ws-row-icon" style={{ background: workspace.color + "18", color: workspace.color }}>
        {getWorkspaceIcon(workspace.icon, 20, 2)}
      </span>
      <div className="ws-row-info">
        <span className="ws-row-name">{workspace.name}</span>
        {workspace.description && <span className="ws-row-desc">{workspace.description}</span>}
      </div>
      <span className="ws-row-stat">{workspace.document_count} docs</span>
      <span className="ws-row-stat">{workspace.memory_count} mems</span>
      <span className="ws-row-stat">{fmtBytes(workspace.storage_bytes)}</span>
      <span className="ws-row-time">{ago(workspace.updated_at)}</span>
      <button
        className={`ws-row-star ${workspace.is_favorite ? "starred" : ""}`}
        onClick={(e) => { e.stopPropagation(); onFavorite(workspace.id); }}
      >
        {workspace.is_favorite ? "★" : "☆"}
      </button>
    </div>
  );
};
