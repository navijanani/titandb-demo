import { useEffect, useState, useCallback, useRef } from "react";
import { IconFolder, IconFileText } from "@tabler/icons-react";
import { uploadFile, listDocuments, deleteDocument, getDocumentChunks, getDocumentStatus } from "../api/client";
import type { Document, Chunk } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";

type View = "list" | "detail";

export function DocumentsPage() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [docs, setDocs] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Upload
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Detail
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  const getDisplayNumber = useCallback(
    (documentId: number) => {
      const index = docs.findIndex((doc) => doc.id === documentId);
      return index >= 0 ? index + 1 : null;
    },
    [docs],
  );

  // Status polling
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await listDocuments(0, 100, workspaceId);
      setDocs(resp.documents);
      setTotal(resp.total);
      setProcessingIds(new Set(
        resp.documents
          .filter((d) => d.status === "processing" || d.status === "pending")
          .map((d) => d.id),
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);

  // Auto-poll processing documents every 3s
  useEffect(() => {
    if (processingIds.size === 0) return;
    const interval = setInterval(async () => {
      const ids = Array.from(processingIds);
      let changed = false;
      for (const id of ids) {
        try {
          const status = await getDocumentStatus(id);
          if (status.status === "completed" || status.status === "failed") {
            changed = true;
          }
        } catch { }
      }
      if (changed) load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load, processingIds]);

  // Upload
  const handleUpload = async (file: File) => {
    setUploadMsg(null);
    const valid = [".pdf", ".docx", ".txt", ".csv"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!valid.includes(ext)) {
      setUploadMsg(`Unsupported type "${ext}". Use pdf, docx, txt, or csv.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadMsg("File exceeds 50 MB limit.");
      return;
    }
    setUploading(true);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await uploadFile(file, workspaceId);
      setUploadMsg(`"${resp.document.filename}" uploaded; processing continues in the background.`);
      load();
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleUpload(f);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Delete
  const [deleting, setDeleting] = useState<number | null>(null);
  const confirmDelete = async (id: number) => {
    setDeleting(id);
  };
  const executeDelete = async (id: number) => {
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  // Detail
  const openDetail = async (doc: Document) => {
    setSelectedDoc(doc);
    setView("detail");
    setChunksLoading(true);
    setChunks([]);
    try {
      const data = await getDocumentChunks(doc.id);
      setChunks(data);
    } catch {
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  };

  const closeDetail = () => {
    setView("list");
    setSelectedDoc(null);
    setChunks([]);
  };

  // Detail view
  if (view === "detail" && selectedDoc) {
    const isProcessing = selectedDoc.status === "processing" || selectedDoc.status === "pending";
    const displayNumber = getDisplayNumber(selectedDoc.id);
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-ghost" onClick={closeDetail}>← Back to Documents</button>
          <h2>{selectedDoc.filename}</h2>
          <StatusBadge status={selectedDoc.status} />
        </div>

        <div className="detail-grid">
          <div className="section doc-meta">
            <h3>Metadata</h3>
            <table className="meta-table">
              <tbody>
                {displayNumber && <tr><td>Document #</td><td>{displayNumber}</td></tr>}
                <tr><td>Filename</td><td>{selectedDoc.filename}</td></tr>
                <tr><td>Type</td><td>{selectedDoc.file_type}</td></tr>
                <tr><td>Size</td><td>{(selectedDoc.file_size / 1024).toFixed(1)} KB</td></tr>
                <tr><td>Status</td><td><StatusBadge status={selectedDoc.status} /></td></tr>
                <tr><td>Created</td><td>{new Date(selectedDoc.created_at).toLocaleString()}</td></tr>
                {selectedDoc.error_message && (
                  <tr><td>Error</td><td className="error-text">{selectedDoc.error_message}</td></tr>
                )}
              </tbody>
            </table>
            {isProcessing && <p className="poll-hint">Auto-refreshing status...</p>}
          </div>

          <div className="section doc-chunks">
            <div className="section-header">
              <h3>Chunks ({chunks.length})</h3>
            </div>
            {chunksLoading ? (
              <p className="loading-text">Loading chunks...</p>
            ) : chunks.length === 0 ? (
              <p className="empty-text">No chunks available.</p>
            ) : (
              <div className="chunk-list">
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="chunk-card">
                    <div className="chunk-header">
                      <span className="chunk-index">Chunk #{chunk.chunk_index}</span>
                      <span className="chunk-id">ID: {chunk.id}</span>
                    </div>
                    <p className="chunk-content">{chunk.content}</p>
                    {chunk.doc_metadata && Object.keys(chunk.doc_metadata).length > 0 && (
                      <details className="chunk-meta-details">
                        <summary>Metadata</summary>
                        <pre className="chunk-meta-json">{JSON.stringify(chunk.doc_metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasProcessing =
    docs.some((d) => d.status === "processing" || d.status === "pending");

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">DATA MANAGEMENT</div>
          <h1 className="content-header-name">Documents</h1>
        </div>
        <div className="header-actions">
          {hasProcessing && <span className="poll-hint">Auto-updating...</span>}
          <button onClick={load} className="btn-secondary" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="content-body">
        {error && <div className="msg error">{error}</div>}

      {/* Upload */}
      <section className="section upload-section">
        <h3>Upload Document</h3>
        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.csv"
            onChange={onFileSelect}
            style={{ display: "none" }}
          />
          <div className="drop-zone-content">
            <span className="drop-icon"><IconFolder size={48} strokeWidth={1.5} /></span>
            <span className="drop-text">
              {uploading
                ? "Uploading..."
                : "Drop a file here or click to browse"}
            </span>
            <span className="drop-hint">PDF, DOCX, TXT, CSV up to 50 MB</span>
          </div>
        </div>
        {uploadMsg && (
          <p className={uploadMsg.includes("Error") || uploadMsg.includes("Unsupported") || uploadMsg.includes("exceeds") ? "msg error" : "upload-msg"}>
            {uploadMsg}
          </p>
        )}
      </section>

      {/* Document List */}
      <section className="section">
        <div className="section-header">
          <h3>All Documents ({total})</h3>
        </div>
        {loading ? (
          <p className="loading-text">Loading documents...</p>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><IconFileText size={48} strokeWidth={1.5} /></span>
            <p className="empty-text">No documents uploaded yet.</p>
            <p className="empty-hint">Drop a file above to get started.</p>
          </div>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Filename</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, index) => (
                <tr key={d.id} className={d.status === "processing" ? "row-processing" : ""}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="doc-filename">{d.filename}</span>
                  </td>
                  <td><span className="type-badge">{d.file_type}</span></td>
                  <td>{(d.file_size / 1024).toFixed(1)} KB</td>
                  <td>
                    <StatusBadge status={d.status} />
                    {d.error_message && <span className="status-error-icon" title={d.error_message}>⚠</span>}
                  </td>
                  <td className="timestamp-cell">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-ghost-sm" onClick={() => openDetail(d)}>View</button>
                    {deleting === d.id ? (
                      <span className="confirm-delete">
                        <button className="btn-danger-sm" onClick={() => executeDelete(d.id)}>Confirm</button>
                        <button className="btn-ghost-sm" onClick={() => setDeleting(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button className="btn-danger-sm" onClick={() => confirmDelete(d.id)}>Delete</button>
                    )}
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    processing: "#3b82f6",
    completed: "#22c55e",
    failed: "#ef4444",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
  };
  return (
    <span className="badge" style={{ background: colors[status] ?? "#6b7280" }}>
      {labels[status] ?? status}
    </span>
  );
}
