import { type FC } from "react";
import type { Workspace } from "../../types/workspace";
import { getWorkspaceIcon } from "../../utils/workspaceIcons";

type Props = {
  workspace: Workspace;
  onSelect: (id: number) => void;
  onFavorite: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, ws: Workspace) => void;
};

export const WorkspaceCard: FC<Props> = ({ workspace, onSelect, onFavorite, onContextMenu }) => {
  const fmtBytes = (b: number) => {
    for (const unit of ["B", "KB", "MB", "GB"]) {
      if (b < 1024) return `${b.toFixed(1)} ${unit}`;
      b /= 1024;
    }
    return `${b.toFixed(1)} TB`;
  };

  return (
    <div
      className={`ws-card ${workspace.is_archived ? "ws-card-archived" : ""}`}
      style={{ borderTopColor: workspace.color, borderTopStyle: "solid", borderTopWidth: "3px" }}
      onClick={() => onSelect(workspace.id)}
      onContextMenu={(e) => onContextMenu(e, workspace)}
    >
      <div className="ws-card-head">
        <span className="ws-card-icon" style={{ background: workspace.color + "18", color: workspace.color }}>
          {getWorkspaceIcon(workspace.icon, 20, 2)}
        </span>
        <button
          className={`ws-card-star ${workspace.is_favorite ? "starred" : ""}`}
          onClick={(e) => { e.stopPropagation(); onFavorite(workspace.id); }}
          title={workspace.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {workspace.is_favorite ? "★" : "☆"}
        </button>
      </div>
      <div className="ws-card-body">
        <h3 className="ws-card-name">{workspace.name}</h3>
        {workspace.description && (
          <p className="ws-card-desc">{workspace.description}</p>
        )}
      </div>
      <div className="ws-card-footer">
        <span className="ws-card-stat">{workspace.document_count} docs</span>
        <span className="ws-card-stat">{workspace.memory_count} memories</span>
        <span className="ws-card-stat">{fmtBytes(workspace.storage_bytes)}</span>
      </div>
    </div>
  );
};
