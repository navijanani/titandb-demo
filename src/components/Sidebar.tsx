import { useState } from "react";
import {
  IconBriefcase, IconLayoutDashboard, IconFileText, IconStack2,
  IconNetwork, IconSearch, IconBrain, IconTerminal,
  IconChartBar, IconChartPie
} from "@tabler/icons-react";
import { WorkspaceSelector } from "./workspace/WorkspaceSelector";
import { WorkspaceCreateModal } from "./workspace/WorkspaceCreateModal";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { createWorkspace } from "../api/workspaceApi";

export type StudioTab = "dashboard" | "documents" | "collections" | "graph" | "search" | "memory" | "query" | "analytics" | "metrics" | "workspaces" | "profile";

const NAV: { key: StudioTab; label: string; icon: any; section?: string }[] = [
  { key: "workspaces", label: "Workspaces", icon: IconBriefcase, section: "main" },
  { key: "dashboard", label: "Dashboard", icon: IconLayoutDashboard, section: "main" },
  { key: "documents", label: "Documents", icon: IconFileText, section: "main" },
  { key: "collections", label: "Collections", icon: IconStack2, section: "main" },
  { key: "graph", label: "Graph", icon: IconNetwork, section: "main" },
  { key: "search", label: "Search", icon: IconSearch, section: "ai" },
  { key: "memory", label: "Memory", icon: IconBrain, section: "ai" },
  { key: "query", label: "Query", icon: IconTerminal, section: "ai" },
  { key: "analytics", label: "Analytics", icon: IconChartBar, section: "insights" },
  { key: "metrics", label: "Metrics", icon: IconChartPie, section: "insights" },
];

type SidebarProps = {
  active: StudioTab;
  onSelect: (tab: StudioTab) => void;
  userDisplayName?: string;
  userEmail?: string;
};

export function Sidebar({ active, onSelect, userDisplayName, userEmail }: SidebarProps) {
  const { activeWorkspaceId, setActiveWorkspaceId } = useActiveWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (data: { name: string; description: string; icon: string; color: string }) => {
    const ws = await createWorkspace(data);
    setActiveWorkspaceId(ws.id);
  };

  const mainNav = NAV.filter(n => n.section === "main");
  const aiNav = NAV.filter(n => n.section === "ai");
  const insightsNav = NAV.filter(n => n.section === "insights");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">T</div>
        <div className="sidebar-title">Titan Studio</div>
      </div>
      
      <div className="sidebar-workspace-selector">
        <WorkspaceSelector
          activeId={activeWorkspaceId}
          onSelect={(id) => { setActiveWorkspaceId(id); onSelect("workspaces"); }}
          onCreate={() => setCreateOpen(true)}
        />
      </div>
      
      <nav className="sidebar-nav">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${active === item.key ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span className="sidebar-icon"><Icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
        
        <div className="nav-section-divider" />
        
        {aiNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${active === item.key ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span className="sidebar-icon"><Icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
        
        <div className="nav-section-divider" />
        
        {insightsNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${active === item.key ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span className="sidebar-icon"><Icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button 
        className="sidebar-user-section" 
        onClick={() => onSelect("profile")}
      >
        <div className="sidebar-user-avatar">
          {(userDisplayName?.[0] ?? userEmail?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{userDisplayName || "User"}</div>
          <div className="sidebar-user-email">{userEmail || "user@example.com"}</div>
        </div>
      </button>

      {createOpen && (
        <WorkspaceCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </aside>
  );
}
