import { useEffect, useState, useCallback } from "react";
import { listMemories, createMemory, updateMemory, deleteMemory, searchMemories, getImportantMemories } from "../api/client";
import type { Memory, MemoryCreate, MemoryUpdate } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";

type MemoryTab = "browse" | "important" | "search";

export function MemoryExplorer() {
  const [tab, setTab] = useState<MemoryTab>("browse");
  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">MEMORY SYSTEM</div>
          <h1 className="content-header-name">Memory Explorer</h1>
        </div>
      </div>
      <div className="content-body">
      <div className="sub-tabs">
        {(["browse", "search", "important"] as MemoryTab[]).map((t) => (
          <button key={t} className={`sub-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "browse" ? "All Memories" : t === "search" ? "Search" : "Important"}
          </button>
        ))}
      </div>
      {tab === "browse" && <BrowseMemories />}
      {tab === "search" && <SearchMemories />}
      {tab === "important" && <ImportantMemories />}
      </div>
    </div>
  );
}

function BrowseMemories() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [fact, setFact] = useState("");
  const [source, setSource] = useState("");
  const [importance, setImportance] = useState(0.5);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFact, setEditFact] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await listMemories(0, 100, workspaceId);
      setMemories(resp.memories);
      setTotal(resp.total);
    } catch { } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!fact.trim()) return;
    const workspaceId = activeWorkspaceId || 1;
    try {
      const data: MemoryCreate = { fact: fact.trim(), importance_score: importance };
      if (source.trim()) data.source = source.trim();
      await createMemory(data, workspaceId);
      setFact("");
      setSource("");
      setImportance(0.5);
      setShowCreate(false);
      load();
    } catch { }
  };

  const handleUpdate = async (id: number) => {
    if (!editFact.trim()) return;
    try {
      const data: MemoryUpdate = { fact: editFact.trim() };
      await updateMemory(id, data);
      setEditingId(null);
      load();
    } catch { }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
    } catch { }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>All Memories ({total})</h3>
        <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Memory"}
        </button>
      </div>

      {showCreate && (
        <div className="create-memory-form">
          <textarea
            className="memory-input"
            placeholder="Enter a fact or memory..."
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            rows={3}
          />
          <div className="inline-form">
            <input className="search-input" placeholder="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
            <label className="importance-label">
              Importance: {importance.toFixed(1)}
              <input type="range" min="0" max="1" step="0.1" value={importance} onChange={(e) => setImportance(parseFloat(e.target.value))} />
            </label>
            <button onClick={handleCreate} disabled={!fact.trim()}>Save</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading memories...</p>
      ) : memories.length === 0 ? (
        <p className="empty-text">No memories stored yet.</p>
      ) : (
        <div className="memory-list">
          {memories.map((m) => (
            <div key={m.id} className="memory-card">
              {editingId === m.id ? (
                <div className="memory-edit">
                  <textarea className="memory-input" value={editFact} onChange={(e) => setEditFact(e.target.value)} rows={2} />
                  <div className="memory-edit-actions">
                    <button onClick={() => handleUpdate(m.id)} disabled={!editFact.trim()}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="memory-meta">
                    <span className="memory-importance" style={{ opacity: m.importance_score }}>◆</span>
                    <span className="memory-score">{(m.importance_score * 100).toFixed(0)}%</span>
                    <span className="memory-access">Accessed {m.access_count}x</span>
                    {m.source && <span className="memory-source">{m.source}</span>}
                  </div>
                  <p className="memory-fact">{m.fact}</p>
                  <div className="memory-actions">
                    <button className="btn-ghost-sm" onClick={() => { setEditingId(m.id); setEditFact(m.fact); }}>Edit</button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(m.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchMemories() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [query, setQuery] = useState("");
  const [minImportance, setMinImportance] = useState(0);
  const [results, setResults] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await searchMemories({ query: query.trim(), min_importance: minImportance || undefined }, workspaceId);
      setResults(resp.results);
      setTotal(resp.total);
    } catch { } finally {
      setSearching(false);
    }
  };

  return (
    <div className="section">
      <h3>Search Memories</h3>
      <div className="search-row">
        <input className="search-input" placeholder="Search memory content..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        <button onClick={handleSearch} disabled={searching || !query.trim()}>{searching ? "Searching..." : "Search"}</button>
      </div>
      <label className="filter-label">
        Min Importance: {minImportance.toFixed(1)}
        <input type="range" min="0" max="1" step="0.1" value={minImportance} onChange={(e) => setMinImportance(parseFloat(e.target.value))} />
      </label>
      {searched && (
        <>
          <p className="result-count">{total} result{total !== 1 ? "s" : ""}</p>
          {results.length === 0 ? (
            <p className="empty-text">No matching memories.</p>
          ) : (
            <div className="memory-list">
              {results.map((m) => (
                <div key={m.id} className="memory-card">
                  <div className="memory-meta">
                    <span className="memory-importance" style={{ opacity: m.importance_score }}>◆</span>
                    <span className="memory-score">{(m.importance_score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="memory-fact">{m.fact}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ImportantMemories() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [minImportance, setMinImportance] = useState(0.5);

  const load = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      setMemories(await getImportantMemories(50, minImportance, workspaceId));
    } catch { } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, minImportance]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="section">
      <div className="section-header">
        <h3>Important Memories</h3>
        <label className="filter-label">
          Min Score: {minImportance.toFixed(1)}
          <input type="range" min="0" max="1" step="0.1" value={minImportance} onChange={(e) => setMinImportance(parseFloat(e.target.value))} />
        </label>
      </div>
      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : memories.length === 0 ? (
        <p className="empty-text">No memories at this importance level.</p>
      ) : (
        <div className="memory-list">
          {memories.map((m) => (
            <div key={m.id} className="memory-card important">
              <div className="memory-meta">
                <span className="memory-importance" style={{ opacity: m.importance_score }}>◆</span>
                <span className="memory-score">{(m.importance_score * 100).toFixed(0)}%</span>
                <span className="memory-access">Accessed {m.access_count}x</span>
              </div>
              <p className="memory-fact">{m.fact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
