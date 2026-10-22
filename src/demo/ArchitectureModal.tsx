import { useEffect } from "react";
import { LINKS } from "./links";

const LAYERS: { title: string; items: string; demo: string }[] = [
  { title: "React + Vite studio", items: "Pages, sidebar, graph canvas, charts", demo: "Unchanged. This is the real UI code." },
  { title: "FastAPI REST API (/api/v1)", items: "Auth, workspaces, documents, search, RAG, KG, memory, metrics", demo: "Replaced by local functions in src/api/*." },
  { title: "Services", items: "Ingestion pipeline, hybrid search (BM25 + vectors + RRF), query optimizer, RAG, entity extraction", demo: "Search and planning logic re-implemented in a small browser module." },
  { title: "Storage", items: "PostgreSQL + pgvector (SQLite locally), file storage (local or Supabase)", demo: "An in-memory sample dataset." },
  { title: "Models", items: "MiniLM embeddings, Gemini / OpenAI / Ollama language models", demo: "Not used. Semantic ranking is precomputed or approximated; answers are extractive." },
];

export function ArchitectureModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal demo-arch" role="dialog" aria-modal="true" aria-labelledby="demo-arch-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="demo-arch-title">Architecture overview</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p>How the full TitanDB application is layered, and what this demo does in place of each layer.</p>
          <div className="demo-arch-flow">
            {LAYERS.map((l, i) => (
              <div key={l.title} className="demo-arch-layer">
                <div className="demo-arch-layer-main">
                  <strong>{i + 1}. {l.title}</strong>
                  <span>{l.items}</span>
                </div>
                <div className="demo-arch-layer-demo"><em>In this demo:</em> {l.demo}</div>
              </div>
            ))}
          </div>
          <p className="demo-welcome-foot">
            Ingestion flow in the full app: upload, text extraction, chunking, embedding, entity extraction, graph building.
            Source code: <a href={LINKS.frontendRepo} target="_blank" rel="noopener noreferrer">frontend</a> ·{" "}
            <a href={LINKS.backendRepo} target="_blank" rel="noopener noreferrer">backend</a>.
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
