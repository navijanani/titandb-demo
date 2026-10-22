import { useEffect, useState, useCallback } from "react";
import { IconFolder } from "@tabler/icons-react";
import {
  listCollections, createCollection, deleteCollection, getCollection,
  addDocumentToCollection, removeDocumentFromCollection, searchCollection,
  listDocuments,
} from "../api/client";
import type { Collection, CollectionDetail, CollectionDocumentItem, SearchResultItem } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";

type View = "list" | "detail";

export function CollectionsPage() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [view, setView] = useState<View>("list");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  // Detail
  const [selectedCollection, setSelectedCollection] = useState<CollectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add document
  const [allDocs, setAllDocs] = useState<CollectionDocumentItem[]>([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [addDocId, setAddDocId] = useState("");

  // Search within collection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await listCollections(0, 100, workspaceId, 1);
      setCollections(resp.collections);
      setTotal(resp.total);
    } catch { } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const workspaceId = activeWorkspaceId || 1;
    try {
      await createCollection({ name: createName.trim(), description: createDesc.trim() || null }, workspaceId, 1);
      setCreateName("");
      setCreateDesc("");
      setShowCreate(false);
      loadCollections();
    } catch { }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } catch { } finally {
      setDeletingId(null);
    }
  };

  const openDetail = async (col: Collection) => {
    setDetailLoading(true);
    setView("detail");
    setSearchResults([]);
    setSearched(false);
    setSearchQuery("");
    const workspaceId = activeWorkspaceId || 1;
    try {
      const detail = await getCollection(col.id);
      setSelectedCollection(detail);
      const docResp = await listDocuments(0, 100, workspaceId, 1);
      setAllDocs(docResp.documents);
    } catch { } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setView("list");
    setSelectedCollection(null);
    setAllDocs([]);
    setShowAddDoc(false);
    setAddDocId("");
  };

  const handleAddDocument = async () => {
    if (!addDocId.trim() || !selectedCollection) return;
    const docId = parseInt(addDocId);
    if (isNaN(docId)) return;
    try {
      await addDocumentToCollection(selectedCollection.id, docId);
      setAddDocId("");
      setShowAddDoc(false);
      const detail = await getCollection(selectedCollection.id);
      setSelectedCollection(detail);
    } catch { }
  };

  const handleRemoveDocument = async (docId: number) => {
    if (!selectedCollection) return;
    try {
      await removeDocumentFromCollection(selectedCollection.id, docId);
      const detail = await getCollection(selectedCollection.id);
      setSelectedCollection(detail);
    } catch { }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedCollection) return;
    setSearching(true);
    setSearched(true);
    try {
      const resp = await searchCollection(selectedCollection.id, searchQuery.trim());
      setSearchResults(resp.results);
      setSearchTotal(resp.total);
    } catch { } finally {
      setSearching(false);
    }
  };

  // ── Detail View ──
  if (view === "detail" && selectedCollection) {
    const inCollection = new Set(selectedCollection.documents.map((d) => d.id));
    const docsNotIn = allDocs.filter((d) => !inCollection.has(d.id));

    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-ghost" onClick={closeDetail}>← Back to Collections</button>
          <h2>{selectedCollection.name}</h2>
          <span className="badge" style={{ background: "#6b7280" }}>
            {selectedCollection.document_count} docs
          </span>
        </div>

        {selectedCollection.description && (
          <p className="section-desc" style={{ margin: "-12px 0 16px" }}>{selectedCollection.description}</p>
        )}

        <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
          {/* Search within collection */}
          <section className="section">
            <h3>Search within Collection</h3>
            <div className="search-row">
              <input
                className="search-input"
                placeholder="Search documents in this collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
            {searched && (
              <div className="collection-search-results">
                <p className="result-count">{searchTotal} result{searchTotal !== 1 ? "s" : ""}</p>
                {searchResults.length === 0 ? (
                  <p className="empty-text">No results in this collection.</p>
                ) : (
                  searchResults.map((r, i) => (
                    <div key={i} className="result-card">
                      <div className="result-header">
                        <span className="result-rank">#{i + 1}</span>
                        <span className="result-doc">{r.document_name}</span>
                        <span className="result-score">{(r.score * 100).toFixed(1)}%</span>
                      </div>
                      <p className="result-content">{r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="section">
            <div className="section-header">
              <h3>Documents ({selectedCollection.document_count})</h3>
              <button className="btn-secondary" onClick={() => { setShowAddDoc(!showAddDoc); setAddDocId(""); }}>
                {showAddDoc ? "Cancel" : "+ Add Document"}
              </button>
            </div>

            {showAddDoc && (
              <div className="inline-form" style={{ marginBottom: 12 }}>
                <select className="search-input select-input" value={addDocId} onChange={(e) => setAddDocId(e.target.value)}>
                  <option value="">Select a document...</option>
                  {docsNotIn.map((d) => (
                    <option key={d.id} value={d.id}>#{d.id} {d.filename}</option>
                  ))}
                </select>
                <button onClick={handleAddDocument} disabled={!addDocId}>Add</button>
              </div>
            )}

            {selectedCollection.documents.length === 0 ? (
              <p className="empty-text">No documents in this collection.</p>
            ) : (
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCollection.documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td className="doc-filename">{d.filename}</td>
                      <td><span className="type-badge">{d.file_type}</span></td>
                      <td>{(d.file_size / 1024).toFixed(1)} KB</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <button className="btn-danger-sm" onClick={() => handleRemoveDocument(d.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">DATA ORGANIZATION</div>
          <h1 className="content-header-name">Collections</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "+ New Collection"}
          </button>
        </div>
      </div>

      <div className="content-body">

      {showCreate && (
        <section className="section">
          <h3>Create Collection</h3>
          <div className="create-collection-form">
            <input
              className="search-input"
              placeholder="Collection name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              autoFocus
            />
            <textarea
              className="memory-input"
              placeholder="Description (optional)"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              rows={2}
            />
            <button onClick={handleCreate} disabled={!createName.trim()} style={{ alignSelf: "flex-start" }}>
              Create
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <section className="section"><p className="loading-text">Loading collections...</p></section>
      ) : collections.length === 0 ? (
        <section className="section">
          <div className="empty-state">
            <span className="empty-icon"><IconFolder size={48} strokeWidth={1.5} /></span>
            <p className="empty-text">No collections yet.</p>
            <p className="empty-hint">Create a collection to group your documents.</p>
          </div>
        </section>
      ) : (
        <div className="collection-grid">
          {collections.map((col) => (
            <div key={col.id} className="collection-card" onClick={() => openDetail(col)}>
              <div className="collection-card-header">
                <span className="collection-icon"><IconFolder size={20} strokeWidth={2} /></span>
                <div className="collection-card-info">
                  <strong className="collection-card-name">{col.name}</strong>
                  {col.description && <p className="collection-card-desc">{col.description}</p>}
                </div>
              </div>
              <div className="collection-card-meta">
                <span>{col.document_count} document{col.document_count !== 1 ? "s" : ""}</span>
                <span className="collection-workspace-badge">Workspace #{col.workspace_id}</span>
                <span className="collection-card-date">{new Date(col.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="collection-card-actions" onClick={(e) => e.stopPropagation()}>
                {deletingId === col.id ? (
                  <span className="confirm-delete">
                    <button className="btn-danger-sm" onClick={() => handleDelete(col.id)}>Confirm</button>
                    <button className="btn-ghost-sm" onClick={() => setDeletingId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button className="btn-danger-sm" onClick={() => setDeletingId(col.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f59e0b", processing: "#3b82f6",
    completed: "#22c55e", failed: "#ef4444",
  };
  return <span className="badge" style={{ background: colors[status] ?? "#6b7280" }}>{status}</span>;
}
