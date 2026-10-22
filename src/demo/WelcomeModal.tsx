import { useEffect, useState } from "react";
import { WELCOME_KEY } from "./links";

let shownThisSession = false;

function alreadySeen(): boolean {
  if (shownThisSession) return true;
  try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch { return false; }
}

export function WelcomeModal() {
  const [open, setOpen] = useState(() => !alreadySeen());

  const close = () => {
    shownThisSession = true;
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* storage blocked: only hide for this session */ }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal demo-welcome" role="dialog" aria-modal="true" aria-labelledby="demo-welcome-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="demo-welcome-title">Welcome to the TitanDB interactive demo</h3>
          <button className="modal-close" onClick={close} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p>
            This is a self-contained preview of <strong>TitanDB</strong>, a document intelligence engine with
            hybrid search, a knowledge graph and memory. You are signed in to a sample workspace in a
            fictional organization, so there is nothing to sign up for.
          </p>
          <div className="demo-welcome-cols">
            <div>
              <h4>Works for real, in your browser</h4>
              <ul>
                <li>Browsing, filtering, uploading .txt/.csv files</li>
                <li>Keyword matching (BM25) and search filters</li>
                <li>Reciprocal Rank Fusion math</li>
                <li>Memories, collections, graph editing</li>
              </ul>
            </div>
            <div>
              <h4>Simulated or sample</h4>
              <ul>
                <li>Semantic ranking: precomputed examples or a simple approximation, not live FAISS or embeddings</li>
                <li>Answers: extractive summaries, no LLM is called</li>
                <li>Metrics and analytics charts</li>
              </ul>
            </div>
          </div>
          <p className="demo-welcome-foot">
            No backend, database or network requests are used. Changes you make last until you reload the page.
          </p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={close} autoFocus>Explore TitanDB</button>
          </div>
        </div>
      </div>
    </div>
  );
}
