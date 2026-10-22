import { useState, useEffect, type FC } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { WorkspaceProvider, useActiveWorkspace } from "./context/WorkspaceContext";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { GraphExplorer } from "./pages/GraphExplorer";
import { MemoryExplorer } from "./pages/MemoryExplorer";
import { QueryPlayground } from "./pages/QueryPlayground";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { MetricsDashboard } from "./pages/MetricsDashboard";
import { SearchPage } from "./pages/SearchPage";
import { WorkspacesPage } from "./pages/WorkspacesPage";
import { WorkspaceHome } from "./pages/WorkspaceHome";
import { ProfilePage } from "./pages/ProfilePage";
import type { StudioTab } from "./components/Sidebar";
import { DemoBar } from "./demo/DemoBar";
import { WelcomeModal } from "./demo/WelcomeModal";

const STUDIO_PAGES: Record<string, FC> = {
  dashboard: DashboardPage,
  documents: DocumentsPage,
  collections: CollectionsPage,
  graph: GraphExplorer,
  search: SearchPage,
  memory: MemoryExplorer,
  query: QueryPlayground,
  analytics: AnalyticsPage,
  metrics: MetricsDashboard,
  workspaces: WorkspacesPage,
  profile: ProfilePage,
};

function StudioShell() {
  const { user } = useAuth();
  const { activeWorkspaceId, setActiveWorkspaceId } = useActiveWorkspace();
  // Read the hash up front so shared deep links (e.g. #search) are not overwritten on first render.
  const [active, setActive] = useState<StudioTab>(() => {
    const hash = window.location.hash.replace("#", "");
    return hash && hash in STUDIO_PAGES ? (hash as StudioTab) : "workspaces";
  });

  const syncFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash in STUDIO_PAGES) {
      setActive(hash as StudioTab);
      return;
    }
    setActive("workspaces");
  };

  // On mount, determine initial tab
  useEffect(() => {
    syncFromHash();
  }, []);

  useEffect(() => {
    const onHashChange = () => syncFromHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = active === "workspaces" && activeWorkspaceId
      ? "#"
      : active === "workspaces"
      ? "#workspaces"
      : `#${active}`;
  }, [active, activeWorkspaceId]);

  // When clicking "workspaces" tab and there's an active workspace, show that workspace's home
  const handleTabSelect = (tab: StudioTab) => {
    if (tab === "workspaces" && activeWorkspaceId) {
      setActive("workspaces");
      return;
    }
    setActive(tab);
  };

  // If on workspaces tab and there's an active workspace, show the workspace home
  const showWorkspaceHome = active === "workspaces" && activeWorkspaceId;

  return (
    <div className="studio-shell">
      <Sidebar
        active={active}
        onSelect={handleTabSelect}
        userDisplayName={user?.display_name}
        userEmail={user?.email}
      />
      <main className="studio-content">
        <DemoBar />
        {showWorkspaceHome ? (
          <WorkspaceHome />
        ) : active === "workspaces" ? (
          <WorkspacesPage />
        ) : (() => {
          const Page = STUDIO_PAGES[active];
          return Page ? <Page /> : <WorkspacesPage />;
        })()}
      </main>
      <WelcomeModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <StudioShell />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
