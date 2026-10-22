import { type FC, useEffect, useRef } from "react";
import { IconEdit, IconStar, IconArchive, IconTrash } from "@tabler/icons-react";
import type { Workspace } from "../../types/workspace";

export type MenuAction = "edit" | "favorite" | "archive" | "delete";

type Props = {
  x: number;
  y: number;
  workspace: Workspace;
  onAction: (action: MenuAction) => void;
  onClose: () => void;
};

export const WorkspaceContextMenu: FC<Props> = ({ x, y, workspace, onAction, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items: { label: string; icon: any; action: MenuAction }[] = [
    { label: "Edit Details", icon: IconEdit, action: "edit" },
    { label: workspace.is_favorite ? "Remove from favorites" : "Add to favorites", icon: IconStar, action: "favorite" },
    { label: workspace.is_archived ? "Unarchive" : "Archive", icon: IconArchive, action: "archive" },
    { label: "Delete", icon: IconTrash, action: "delete" },
  ];

  return (
    <div
      ref={ref}
      className="ws-context-menu"
      style={{ left: x, top: y }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.action}
            className={`ws-context-item ${item.action === "delete" ? "danger" : ""}`}
            onClick={() => { onAction(item.action); onClose(); }}
          >
            <span className="ws-context-icon"><Icon size={16} strokeWidth={2} /></span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
