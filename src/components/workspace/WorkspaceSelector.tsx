import { useState, useEffect, useRef, type FC } from "react";
import { IconChevronDown, IconCheck, IconPlus } from "@tabler/icons-react";
import type { Workspace } from "../../types/workspace";
import { listWorkspaces } from "../../api/workspaceApi";
import { getWorkspaceIcon } from "../../utils/workspaceIcons";

type Props = {
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
};

export const WorkspaceSelector: FC<Props> = ({ activeId, onSelect, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Demo: load on mount too, so the active workspace name shows without opening the dropdown.
  useEffect(() => {
    if (open) setLoading(true);
    listWorkspaces({ limit: 50, archived: false })
      .then((res) => setWorkspaces(res.workspaces))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, activeId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = workspaces.find((w) => w.id === activeId);

  return (
    <div className="ws-selector" ref={ref}>
      <button className="ws-selector-trigger" onClick={() => setOpen(!open)}>
        <div className="ws-selector-left">
          <div className="ws-selector-icon-box">
            <span className="ws-selector-icon">{getWorkspaceIcon(active?.icon ?? "folder", 18, 2)}</span>
          </div>
          <span className="ws-selector-name">{active?.name ?? "Select Workspace"}</span>
        </div>
        <IconChevronDown size={18} className="ws-selector-arrow" />
      </button>
      {open && (
        <div className="ws-selector-dropdown">
          {loading && <div className="ws-selector-loading">Loading…</div>}
          {!loading && workspaces.length === 0 && (
            <div className="ws-selector-loading">No workspaces</div>
          )}
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              className={`ws-selector-item ${ws.id === activeId ? "active" : ""}`}
              onClick={() => { onSelect(ws.id); setOpen(false); }}
            >
              <div className="ws-selector-icon-box">
                <span className="ws-selector-item-icon">{getWorkspaceIcon(ws.icon, 18, 2)}</span>
              </div>
              <span className="ws-selector-item-name">{ws.name}</span>
              {ws.id === activeId && <IconCheck size={16} className="ws-selector-check" />}
            </button>
          ))}
          <button className="ws-selector-item new" onClick={() => { onCreate(); setOpen(false); }}>
            <IconPlus size={16} />
            <span className="ws-selector-item-name">New Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
