import { useEffect, useState, useCallback } from "react";
import { IconNetwork } from "@tabler/icons-react";
import { getKGGraph, listKGEntities, searchKGEntities, createKGEntity, deleteKGEntity, listKGRelationships, getKGEntityRelationships, createKGRelationship, deleteKGRelationship, findKGPaths } from "../api/client";
import { ForceGraph } from "../components/ForceGraph";
import { S } from "../demo/store";
import type { KGEntity, KGRelationship } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";

type GraphTab = "visual" | "entities" | "relationships" | "path-finder";

export function GraphExplorer() {
  const [tab, setTab] = useState<GraphTab>("visual");
  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">KNOWLEDGE GRAPH</div>
          <h1 className="content-header-name">Graph Explorer</h1>
        </div>
      </div>
      <div className="content-body">
      <div className="sub-tabs">
        {(["visual", "entities", "relationships", "path-finder"] as GraphTab[]).map((t) => (
          <button key={t} className={`sub-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "visual" ? "Visual Graph" : t === "entities" ? "Entities" : t === "relationships" ? "Relationships" : "Path Finder"}
          </button>
        ))}
      </div>
      {tab === "visual" && <VisualGraphPanel />}
      {tab === "entities" && <EntitiesPanel />}
      {tab === "relationships" && <RelationshipsPanel />}
      {tab === "path-finder" && <PathFinderPanel />}
      </div>
    </div>
  );
}

function VisualGraphPanel() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [entities, setEntities] = useState<KGEntity[]>([]);
  const [relationships, setRelationships] = useState<KGRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<KGEntity | null>(null);
  const [selectedRels, setSelectedRels] = useState<KGRelationship[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const graph = await getKGGraph(workspaceId);
      setEntities(graph.entities);
      setRelationships(graph.relationships);
    } catch { } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleNodeClick = useCallback(async (nodeId: number) => {
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setSelectedEntity(null);
      setSelectedRels([]);
      return;
    }
    setSelectedNodeId(nodeId);
    const entity = entities.find((e) => e.id === nodeId) ?? null;
    setSelectedEntity(entity);
    try {
      const rels = await getKGEntityRelationships(nodeId);
      setSelectedRels(rels);
    } catch {
      setSelectedRels([]);
    }
  }, [selectedNodeId, entities]);

  const graphNodes = entities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.entity_type,
  }));

  const graphEdges = relationships.map((r) => ({
    source: r.source_entity_id,
    target: r.target_entity_id,
    type: r.relationship_type,
  }));

  const allRelsCount = relationships.length;
  const visibleRels = selectedNodeId
    ? selectedRels.length
    : allRelsCount;

  return (
    <div className="visual-graph-layout">
      <div className="graph-canvas-container">
        {loading ? (
          <div className="loading-text" style={{ padding: 80, textAlign: "center" }}>Loading graph...</div>
        ) : entities.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <span className="empty-icon"><IconNetwork size={48} strokeWidth={1.5} /></span>
            <p className="empty-text">No knowledge graph data yet.</p>
            <p className="empty-hint">Upload documents to extract entities and relationships.</p>
          </div>
        ) : (
          <ForceGraph
            nodes={graphNodes}
            edges={graphEdges}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        )}
      </div>

      <aside className="graph-sidebar">
        {/* Stats */}
        <div className="graph-stats">
          <div className="graph-stat">
            <span className="graph-stat-value">{entities.length}</span>
            <span className="graph-stat-label">Entities</span>
          </div>
          <div className="graph-stat">
            <span className="graph-stat-value">{visibleRels}</span>
            <span className="graph-stat-label">{selectedNodeId ? "Connections" : "Relationships"}</span>
          </div>
        </div>

        {/* Selected entity detail */}
        {selectedEntity && (
          <div className="graph-node-detail">
            <div className="graph-node-detail-header">
              <h4>{selectedEntity.name}</h4>
              <span className="entity-type-badge">{selectedEntity.entity_type}</span>
            </div>
            {selectedEntity.properties && Object.keys(selectedEntity.properties).length > 0 && (
              <div className="graph-node-props">
                {Object.entries(selectedEntity.properties).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="graph-prop">
                    <span className="graph-prop-key">{k}</span>
                    <span className="graph-prop-value">{String(v).slice(0, 40)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="graph-node-rels">
              <strong>Connections ({selectedRels.length})</strong>
              {selectedRels.length === 0 ? (
                <p className="empty-text" style={{ padding: "8px 0", fontSize: "0.8rem" }}>No direct connections</p>
              ) : (
                selectedRels.map((r) => {
                  const isSource = r.source_entity_id === selectedEntity.id;
                  const neighbor = isSource ? r.target_name : r.source_name;
                  return (
                    <div key={r.id} className="graph-rel-item">
                      <span className="graph-rel-dir">{isSource ? "→" : "←"}</span>
                      <span className="graph-rel-type">{r.relationship_type}</span>
                      <span className="graph-rel-neighbor">{neighbor}</span>
                    </div>
                  );
                })
              )}
            </div>
            <button className="btn-ghost-sm" onClick={() => { setSelectedNodeId(null); setSelectedEntity(null); setSelectedRels([]); }}>
              Clear selection
            </button>
          </div>
        )}

        {!selectedEntity && !loading && entities.length > 0 && (
          <div className="graph-hint">
            <p>Click a node to explore its connections.</p>
            <p>Drag nodes to rearrange the graph.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function EntitiesPanel() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [entities, setEntities] = useState<KGEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("concept");
  const [relEntities, setRelEntities] = useState<Record<number, KGRelationship[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const data = search ? await searchKGEntities(search, workspaceId) : await listKGEntities(workspaceId);
      setEntities(data);
    } catch { } finally {
      setLoading(false);
    }
  }, [search, activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const workspaceId = activeWorkspaceId || 1;
    try {
      await createKGEntity({ name: name.trim(), entity_type: entityType }, workspaceId);
      setName("");
      setShowCreate(false);
      load();
    } catch { }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKGEntity(id);
      setEntities((prev) => prev.filter((e) => e.id !== id));
    } catch { }
  };

  const toggleRelationships = async (id: number) => {
    if (relEntities[id]) {
      setRelEntities((prev) => { const next = { ...prev }; delete next[id]; return next; });
      return;
    }
    try {
      const rels = await getKGEntityRelationships(id);
      setRelEntities((prev) => ({ ...prev, [id]: rels }));
    } catch { }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>Entities ({entities.length})</h3>
        <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Entity"}
        </button>
      </div>

      {showCreate && (
        <div className="inline-form">
          <input className="search-input" placeholder="Entity name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="search-input select-input" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            <option value="concept">Concept</option>
            <option value="person">Person</option>
            <option value="organization">Organization</option>
            <option value="location">Location</option>
            <option value="event">Event</option>
            <option value="technology">Technology</option>
          </select>
          <button onClick={handleCreate} disabled={!name.trim()}>Create</button>
        </div>
      )}

      <input
        className="search-input"
        placeholder="Search entities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {loading ? (
        <p className="loading-text">Loading entities...</p>
      ) : entities.length === 0 ? (
        <p className="empty-text">No entities found.</p>
      ) : (
        <div className="entity-grid">
          {entities.map((e) => (
            <div key={e.id} className="entity-card">
              <div className="entity-header">
                <strong>{e.name}</strong>
                <span className="entity-type-badge">{e.entity_type}</span>
              </div>
              <div className="entity-actions">
                <button className="btn-ghost-sm" onClick={() => toggleRelationships(e.id)}>
                  {relEntities[e.id] ? "Hide" : "Relationships"}
                </button>
                <button className="btn-danger-sm" onClick={() => handleDelete(e.id)}>Delete</button>
              </div>
              {relEntities[e.id] && (
                <div className="entity-rels">
                  {relEntities[e.id].length === 0 ? (
                    <p className="empty-text">No relationships</p>
                  ) : (
                    relEntities[e.id].map((r) => (
                      <div key={r.id} className="rel-chip">
                        {r.source_name} → {r.relationship_type} → {r.target_name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipsPanel() {
  const [rels, setRels] = useState<KGRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState("related_to");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRels(await listKGRelationships());
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!sourceId.trim() || !targetId.trim()) return;
    try {
      await createKGRelationship({
        source_entity_id: parseInt(sourceId),
        target_entity_id: parseInt(targetId),
        relationship_type: relType,
      });
      setSourceId("");
      setTargetId("");
      setShowCreate(false);
      load();
    } catch { }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKGRelationship(id);
      setRels((prev) => prev.filter((r) => r.id !== id));
    } catch { }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>Relationships ({rels.length})</h3>
        <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Relationship"}
        </button>
      </div>

      {showCreate && (
        <div className="inline-form">
          <input className="search-input" placeholder="Source Entity ID" type="number" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
          <input className="search-input" placeholder="Target Entity ID" type="number" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          <select className="search-input select-input" value={relType} onChange={(e) => setRelType(e.target.value)}>
            <option value="related_to">Related To</option>
            <option value="part_of">Part Of</option>
            <option value="contains">Contains</option>
            <option value="used_by">Used By</option>
            <option value="depends_on">Depends On</option>
            <option value="mentions">Mentions</option>
          </select>
          <button onClick={handleCreate}>Create</button>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading relationships...</p>
      ) : rels.length === 0 ? (
        <p className="empty-text">No relationships found.</p>
      ) : (
        <table className="doc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Type</th>
              <th>Target</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rels.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.source_name} <span className="id-hint">({r.source_entity_id})</span></td>
                <td><span className="rel-badge">{r.relationship_type}</span></td>
                <td>{r.target_name} <span className="id-hint">({r.target_entity_id})</span></td>
                <td><button className="btn-danger-sm" onClick={() => handleDelete(r.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PathFinderPanel() {
  // Demo: prefill two connected sample entities (HNSW -> Retrieval-Augmented Generation) so the tab works on first click.
  const sampleId = (name: string) => String(S.entities.find((e) => e.name === name)?.id ?? "");
  const [sourceId, setSourceId] = useState(() => sampleId("HNSW"));
  const [targetId, setTargetId] = useState(() => sampleId("Retrieval-Augmented Generation"));
  const [maxDepth, setMaxDepth] = useState(5);
  const [paths, setPaths] = useState<KnownPath[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFind = async () => {
    if (!sourceId.trim() || !targetId.trim()) return;
    setLoading(true);
    setError(null);
    setPaths(null);
    try {
      const result = await findKGPaths({
        source_entity_id: parseInt(sourceId),
        target_entity_id: parseInt(targetId),
        max_depth: maxDepth,
      });
      setPaths(result.paths);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Path finding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h3>Path Finder</h3>
      <p className="section-desc">Find paths between two entities in the knowledge graph. Sample IDs are prefilled; entity IDs are listed in the Entities tab.</p>
      <div className="inline-form">
        <input className="search-input" placeholder="Source Entity ID" type="number" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
        <input className="search-input" placeholder="Target Entity ID" type="number" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <input className="search-input" placeholder="Max Depth" type="number" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value) || 5)} style={{ width: 100 }} />
        <button onClick={handleFind} disabled={loading || !sourceId.trim() || !targetId.trim()}>
          {loading ? "Searching..." : "Find Paths"}
        </button>
      </div>
      {error && <div className="msg error">{error}</div>}
      {paths && (
        <div className="paths-results">
          {paths.length === 0 ? (
            <p className="empty-text">No paths found between these entities.</p>
          ) : (
            paths.map((path, i) => (
              <div key={i} className="path-card">
                <div className="path-header">Path {i + 1} (weight: {path.total_weight.toFixed(2)})</div>
                <div className="path-steps">
                  {path.path.map((step, j) => (
                    <span key={j} className="path-step">
                      {j > 0 && <span className="path-arrow">→</span>}
                      <span className="path-entity">{step.name}</span>
                      {j < path.path.length - 1 && <span className="path-rel">({step.relationship_type})</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

type KnownPath = {
  path: { entity_id: number; name: string; relationship_type: string }[];
  total_weight: number;
};
