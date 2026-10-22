import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type WorkspaceContextValue = {
  activeWorkspaceId: number | null;
  setActiveWorkspaceId: (id: number | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<number | null>(() => {
    // Demo: open straight into the preloaded sample workspace.
    try {
      const stored = localStorage.getItem("active_workspace_id");
      if (stored) return parseInt(stored, 10);
    } catch { /* storage blocked */ }
    return 1;
  });

  const setActiveWorkspaceId = useCallback((id: number | null) => {
    setActiveWorkspaceIdState(id);
    try {
      if (id) localStorage.setItem("active_workspace_id", String(id));
      else localStorage.removeItem("active_workspace_id");
    } catch { /* storage blocked: keep in memory only */ }
  }, []);

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useActiveWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useActiveWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
