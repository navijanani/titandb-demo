import { useState, useCallback, useEffect } from "react";
import { IconSearch } from "@tabler/icons-react";
import { executeRAG, hybridSearch, semanticSearch } from "../api/client";
import type { RAGResponse, SearchResultItem } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { DemoNote } from "../demo/DemoNote";
import { EXAMPLE_QUERIES } from "../demo/seed";

type SearchMode = "semantic" | "hybrid";

export function SearchPage() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(10);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [answer, setAnswer] = useState<RAGResponse | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [demoNote, setDemoNote] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDocId, setFilterDocId] = useState("");
  const [filterFilename, setFilterFilename] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail
  const [detailResult, setDetailResult] = useState<SearchResultItem | null>(null);

  const buildPayload = useCallback(() => {
    const payload: Record<string, unknown> = { query: query.trim(), top_k: topK };
    if (filterDocId) payload.document_id = parseInt(filterDocId);
    const filters: Record<string, string> = {};
    if (filterFilename) filters.filename = filterFilename;
    if (filterFileType) filters.file_type = filterFileType;
    if (filterDateFrom) filters.upload_date_from = filterDateFrom;
    if (filterDateTo) filters.upload_date_to = filterDateTo;
    if (Object.keys(filters).length > 0) payload.filters = filters;
    return payload;
  }, [query, topK, filterDocId, filterFilename, filterFileType, filterDateFrom, filterDateTo, activeWorkspaceId]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setAnswerError(null);
    setAnswer(null);
    setDemoNote(null);
    setDetailResult(null);
    setSearched(true);
    try {
      const workspaceId = activeWorkspaceId || 1;
      const payload = buildPayload();
      const dateFiltered = Boolean(filterDateFrom || filterDateTo);
      const answerFilters = {
        ...(filterFilename ? { filename: filterFilename } : {}),
        ...(filterFileType ? { file_type: filterFileType } : {}),
        ...(filterDateFrom ? { upload_date_from: filterDateFrom } : {}),
        ...(filterDateTo ? { upload_date_to: filterDateTo } : {}),
      };
      const searchRequest = mode === "hybrid"
        ? hybridSearch(payload as any, workspaceId)
        : semanticSearch(payload as any, workspaceId);
      const [searchResponse, answerResponse] = await Promise.allSettled([
        searchRequest,
        executeRAG({
          query: query.trim(),
          retrieval_mode: dateFiltered ? "semantic" : "hybrid",
          top_k_chunks: topK,
          document_id: filterDocId ? Number(filterDocId) : undefined,
          filters: Object.keys(answerFilters).length ? answerFilters : undefined,
        }, workspaceId),
      ]);

      if (searchResponse.status === "fulfilled") {
        const data = searchResponse.value;
        setResults(data.results ?? []);
        setTotal(data.total ?? 0);
        setDemoNote(data.demo_note ?? null);
      } else {
        throw searchResponse.reason;
      }

      if (answerResponse.status === "fulfilled") {
        setAnswer(answerResponse.value);
      } else {
        setAnswerError(answerResponse.reason instanceof Error ? answerResponse.reason.message : "Answer generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setTotal(0);
    } finally {
      setSearching(false);
    }
  };

  // Example-query chips fill the box and run the search right away.
  useEffect(() => {
    if (autoRun) {
      setAutoRun(false);
      handleSearch();
    }
  }, [autoRun]);

  const citations = answer?.sources
    .filter((source) => source.source === "vectors")
    .flatMap((source) => source.items.map(toSearchResult))
    .filter((item): item is SearchResultItem => item !== null) ?? [];

  const clearFilters = () => {
    setFilterDocId("");
    setFilterFilename("");
    setFilterFileType("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  if (detailResult) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-ghost" onClick={() => setDetailResult(null)}>← Back to Results</button>
          <h2>Result Detail</h2>
        </div>

        <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="section">
            <h3>Document</h3>
            <table className="meta-table">
              <tbody>
                <tr><td>Document</td><td><strong>{detailResult.document_name}</strong></td></tr>
                <tr><td>Document ID</td><td>{detailResult.document_id}</td></tr>
                <tr><td>Chunk ID</td><td>{detailResult.chunk_id}</td></tr>
                <tr><td>Chunk Index</td><td>#{detailResult.chunk_index}</td></tr>
                <tr><td>Score</td><td>{(detailResult.score * 100).toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Content</h3>
            <p className="detail-content">{detailResult.content}</p>
          </div>

          <div className="section">
            <h3>Similarity</h3>
            <div className="score-bar-container">
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${(detailResult.score * 100).toFixed(0)}%` }} />
              </div>
              <span className="score-label">{(detailResult.score * 100).toFixed(1)}% match</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasFilters = filterDocId || filterFilename || filterFileType || filterDateFrom || filterDateTo;

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">SEARCH ENGINE</div>
          <h1 className="content-header-name">Search</h1>
        </div>
        {searched && <div className="header-actions"><span className="result-count">{total} result{total !== 1 ? "s" : ""}</span></div>}
      </div>

      <div className="content-body">

      <DemoNote>Keyword matching and filters run locally on the sample documents. Semantic and hybrid ranking use precomputed example results or a simple approximation, and answers are extractive summaries. No embedding model, FAISS index or LLM is running.</DemoNote>

      <div className="sub-tabs">
        {(["semantic", "hybrid"] as SearchMode[]).map((m) => (
          <button key={m} className={`sub-tab ${mode === m ? "active" : ""}`} onClick={() => { setMode(m); setSearched(false); setResults([]); }}>
            {m === "semantic" ? "Semantic Search" : "Hybrid Search"}
          </button>
        ))}
      </div>

      <div className="section search-section">
        <div className="search-row">
          <input
            className="search-input"
            placeholder={
              mode === "semantic"
                ? "Search by meaning across all documents..."
                : "Search by keywords + meaning..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="demo-examples">
          <span className="demo-examples-label">Try an example:</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button key={ex} className="example-chip" onClick={() => { setQuery(ex); setAutoRun(true); }}>{ex}</button>
          ))}
        </div>

        <div className="search-extra">
          <div className="search-extra-row">
            <label className="topk-label">
              Results:
              <select value={topK} onChange={(e) => setTopK(parseInt(e.target.value))}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <button className="btn-ghost" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Filters"} {hasFilters ? "●" : ""}
            </button>
            {hasFilters && <button className="btn-ghost-sm" onClick={clearFilters}>Clear All</button>}
          </div>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-row">
                <label>
                  Document ID
                  <input type="number" className="filter-input" placeholder="e.g. 1" value={filterDocId} onChange={(e) => setFilterDocId(e.target.value)} />
                </label>
                <label>
                  Filename
                  <input className="filter-input" placeholder="Partial match..." value={filterFilename} onChange={(e) => setFilterFilename(e.target.value)} />
                </label>
                <label>
                  File Type
                  <select className="filter-input" value={filterFileType} onChange={(e) => setFilterFileType(e.target.value)}>
                    <option value="">Any</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="txt">TXT</option>
                    <option value="csv">CSV</option>
                  </select>
                </label>
              </div>
              <div className="filter-row">
                <label>
                  Upload From
                  <input type="date" className="filter-input" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                </label>
                <label>
                  Upload To
                  <input type="date" className="filter-input" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                </label>
              </div>
            </div>
          )}
        </div>

        {error && <div className="msg error">{error}</div>}
      </div>

      {/* Results */}
      {searched && (
        <>
          {demoNote && <DemoNote>{demoNote}</DemoNote>}
          <div className="section search-answer-section">
            <div className="section-header"><h3>Answer</h3></div>
            {searching && !answer && <p className="loading-text">Retrieving context and generating an answer...</p>}
            {answerError && <div className="msg error">{answerError}</div>}
            {answer && (
              <div className="query-result">
                <div className="rag-answer">
                  <h4>Grounded answer</h4>
                  <p>{answer.answer}</p>
                </div>
                <div className="rag-meta">
                  <span>LLM: {answer.llm_provider}/{answer.llm_model || "default"}</span>
                  <span>Duration: {answer.total_duration_ms.toFixed(0)}ms</span>
                </div>
                {citations.length > 0 && (
                  <div className="rag-sources">
                    <h4>Sources</h4>
                    <ol className="search-citations">
                      {citations.map((citation, index) => (
                        <li key={citation.chunk_id}>
                          <button className="btn-ghost" onClick={() => setDetailResult(citation)}>
                            {citation.document_name} · chunk {citation.chunk_index + 1}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          <details className="section raw-search-results">
            <summary>View retrieved chunks ({total})</summary>
            {results.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><IconSearch size={48} strokeWidth={1.5} /></span>
                <p className="empty-text">No results found.</p>
                <p className="empty-hint">Try a different query or adjust filters.</p>
              </div>
            ) : (
              <div className="results-list">
                {results.map((r, i) => (
                  <div key={`${r.chunk_id}-${i}`} className="result-card" onClick={() => setDetailResult(r)}>
                    <div className="result-header">
                      <span className="result-rank">#{i + 1}</span>
                      <span className="result-doc">{r.document_name}</span>
                      <span className="result-score">{(r.score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="result-content">{truncate(r.content, 300)}</p>
                    <div className="result-footer">
                      <span className="result-meta">Chunk #{r.chunk_index} · ID: {r.chunk_id}</span>
                      <span className="result-detail-link">View details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </details>
        </>
      )}
      </div>
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function toSearchResult(item: Record<string, unknown>): SearchResultItem | null {
  if (
    typeof item.chunk_id !== "number" ||
    typeof item.document_id !== "number" ||
    typeof item.content !== "string"
  ) {
    return null;
  }

  return {
    chunk_id: item.chunk_id,
    chunk_index: typeof item.chunk_index === "number" ? item.chunk_index : 0,
    content: item.content,
    score: typeof item.score === "number" ? item.score : 0,
    document_id: item.document_id,
    document_name: typeof item.document_name === "string" ? item.document_name : "Unknown document",
  };
}
