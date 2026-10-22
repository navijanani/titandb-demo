import { useState, useCallback } from "react";
import { IconClipboard, IconFileText, IconSearch, IconBrain, IconNetwork, IconChartBar, IconPlayerPlay } from "@tabler/icons-react";
import { executeOptimizedQuery, explainTQL, getOptimizerPlan } from "../api/client";
import type { OptimizerPlan, OptimizerExecuteResponse, ExecutorResult } from "../api/client";
import { useActiveWorkspace } from "../context/WorkspaceContext";
import { DemoNote } from "../demo/DemoNote";

type ResultTab = "all" | "search" | "memories" | "graph" | "plan";

export function QueryPlayground() {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [input, setInput] = useState("machine learning");
  const [executing, setExecuting] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [result, setResult] = useState<OptimizerExecuteResponse | null>(null);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>("all");

  const handleExecute = useCallback(async () => {
    if (!input.trim()) return;
    setExecuting(true);
    setError(null);
    setResult(null);
    setExplainText(null);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await executeOptimizedQuery(input.trim(), 10, 5, workspaceId);
      setResult(resp);
      setResultTab("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query execution failed");
    } finally {
      setExecuting(false);
    }
  }, [input, activeWorkspaceId]);

  const handleExplain = useCallback(async () => {
    if (!input.trim()) return;
    setExplaining(true);
    setError(null);
    setExplainText(null);
    const workspaceId = activeWorkspaceId || 1;
    try {
      const resp = await getOptimizerPlan(input.trim(), 10, 5, workspaceId);
      setExplainText(resp.reasoning.join("\n"));
      setResultTab("plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setExplaining(false);
    }
  }, [input, activeWorkspaceId]);

  const extResult = result?.execution;
  const plan = result?.plan;

  const getEngineResults = (name: string): ExecutorResult | undefined =>
    extResult?.results.find((r) => r.executor_name === name);

  const searchResults = getEngineResults("vector_search");
  const metadataResults = getEngineResults("metadata_filter");
  const memoryResults = getEngineResults("memory_search");
  const graphResults = getEngineResults("graph_search");

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">QUERY INTERFACE</div>
          <h1 className="content-header-name">Query Playground</h1>
        </div>
      </div>

      <div className="content-body">
      <DemoNote>Plans come from simple rules and results from a local search over the sample data. The production optimizer and vector engines run on the Titan backend, which is not part of this demo.</DemoNote>
      <div className="section query-section">
        <div className="query-editor">
          <textarea
            className="tql-input"
            placeholder="Enter a natural language query or TQL statement..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            spellCheck={false}
          />
          <div className="playground-actions">
            <button onClick={handleExecute} disabled={executing || !input.trim()} className="execute-btn">
              <IconPlayerPlay size={16} strokeWidth={2} /> {executing ? "Executing..." : "Run Query"}
            </button>
            <button onClick={handleExplain} disabled={explaining || !input.trim()} className="btn-secondary">
              <IconClipboard size={16} strokeWidth={2} /> {explaining ? "Analyzing..." : "Explain Plan"}
            </button>
          </div>
        </div>

        {error && <div className="msg error">{error}</div>}

        {/* Example chips */}
        <div className="examples-row">
          {[
            "machine learning",
            "FIND documents ABOUT AI",
            "FIND memories ABOUT database ORDER BY importance",
            "FIND entities WHERE type=technology",
          ].map((ex, i) => (
            <button key={i} className="example-chip" onClick={() => setInput(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      {result && (
        <div className="playground-results">
          <div className="result-tabs">
            {(["all", "search", "memories", "graph", "plan"] as ResultTab[]).map((t) => {
              const counts: Record<string, number | undefined> = {
                all: extResult?.total_items,
                search: (searchResults?.total ?? 0) + (metadataResults?.total ?? 0),
                memories: memoryResults?.total,
                graph: graphResults?.total,
                plan: undefined,
              };
              return (
                <button
                  key={t}
                  className={`result-tab ${resultTab === t ? "active" : ""}`}
                  onClick={() => setResultTab(t)}
                >
                  {t === "all" ? <><IconChartBar size={16} strokeWidth={2} /> All Results</>
                    : t === "search" ? <><IconSearch size={16} strokeWidth={2} /> Search{counts[t] != null ? ` (${counts[t]})` : ""}</>
                    : t === "memories" ? <><IconBrain size={16} strokeWidth={2} /> Memories{counts[t] != null ? ` (${counts[t]})` : ""}</>
                    : t === "graph" ? <><IconNetwork size={16} strokeWidth={2} /> Graph{counts[t] != null ? ` (${counts[t]})` : ""}</>
                    : <><IconClipboard size={16} strokeWidth={2} /> Execution Plan</>}
                </button>
              );
            })}
          </div>

          {resultTab === "all" && (
            <div className="result-panels">
              {searchResults && searchResults.total > 0 && (
                <ResultPanel title="Search Results" icon={IconSearch} count={searchResults.total} executor={searchResults} />
              )}
              {memoryResults && memoryResults.total > 0 && (
                <ResultPanel title="Retrieved Memories" icon={IconBrain} count={memoryResults.total} executor={memoryResults} />
              )}
              {graphResults && graphResults.total > 0 && (
                <ResultPanel title="Graph Matches" icon={IconNetwork} count={graphResults.total} executor={graphResults} />
              )}
              {metadataResults && metadataResults.total > 0 && (
                <ResultPanel title="Metadata Filter" icon={IconFileText} count={metadataResults.total} executor={metadataResults} />
              )}
              {(!searchResults || searchResults.total === 0) &&
                (!memoryResults || memoryResults.total === 0) &&
                (!graphResults || graphResults.total === 0) &&
                (!metadataResults || metadataResults.total === 0) && (
                <p className="empty-text">No results returned.</p>
              )}
            </div>
          )}

          {resultTab === "search" && (
            <SearchResultsPanel vector={searchResults} metadata={metadataResults} />
          )}

          {resultTab === "memories" && (
            <MemoriesPanel executor={memoryResults} />
          )}

          {resultTab === "graph" && (
            <GraphPanel executor={graphResults} />
          )}

          {resultTab === "plan" && (
            <PlanPanel plan={plan} explainText={explainText} />
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function ResultPanel({ title, icon, count, executor }: { title: string; icon: any; count: number; executor: ExecutorResult }) {
  const Icon = icon;
  return (
    <div className="result-panel">
      <div className="result-panel-header">
        <span><Icon size={16} strokeWidth={2} /> {title}</span>
        <span className="result-panel-count">{count} items</span>
      </div>
      {executor.data.length > 0 && (
        <table className="doc-table result-table compact-table">
          <thead>
            <tr>
              {Object.keys(executor.data[0]).slice(0, 6).map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {executor.data.slice(0, 10).map((item, i) => (
              <tr key={i}>
                {Object.entries(item).slice(0, 6).map(([k, v], j) => (
                  <td key={j}>{renderCell(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SearchResultsPanel({ vector, metadata }: { vector?: ExecutorResult; metadata?: ExecutorResult }) {
  return (
    <div className="result-panels">
      {vector && vector.total > 0 && <ResultPanel title="Vector Search" icon={IconSearch} count={vector.total} executor={vector} />}
      {metadata && metadata.total > 0 && <ResultPanel title="Metadata Filter" icon={IconFileText} count={metadata.total} executor={metadata} />}
      {(!vector || vector.total === 0) && (!metadata || metadata.total === 0) && (
        <p className="empty-text">No search results.</p>
      )}
    </div>
  );
}

function MemoriesPanel({ executor }: { executor?: ExecutorResult }) {
  if (!executor || executor.total === 0) return <p className="empty-text">No memories retrieved.</p>;
  return (
    <div className="result-panels">
      <div className="memory-list">
        {executor.data.map((m, i) => (
          <div key={i} className="memory-card">
            <div className="memory-meta">
              <span className="memory-importance" style={{ opacity: (m.importance_score as number) ?? 0.5 }}>◆</span>
              <span className="memory-score">{(((m.importance_score as number) ?? 0.5) * 100).toFixed(0)}%</span>
              {m.access_count != null && <span className="memory-access">Accessed {String(m.access_count)}x</span>}
              {(m.source as string | null) && <span className="memory-source">{String(m.source)}</span>}
            </div>
            <p className="memory-fact">{String(m.fact ?? m.content ?? JSON.stringify(m))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphPanel({ executor }: { executor?: ExecutorResult }) {
  if (!executor || executor.total === 0) return <p className="empty-text">No graph matches.</p>;
  const data = executor.data;
  const entities = data.filter((d) => (d as any).name && !(d as any).source_entity_id);
  const relationships = data.filter((d) => (d as any).source_entity_id);

  return (
    <div className="result-panels">
      {entities.length > 0 && (
        <div className="result-panel">
          <div className="result-panel-header">
            <span><IconNetwork size={16} strokeWidth={2} /> Entities</span>
            <span className="result-panel-count">{entities.length} items</span>
          </div>
          <div className="entity-grid">
            {entities.slice(0, 20).map((e, i) => {
              const ent = e as any;
              return (
                <div key={i} className="entity-card">
                  <div className="entity-header">
                    <strong>{String(ent.name)}</strong>
                    <span className="entity-type-badge">{ent.entity_type ?? "entity"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {relationships.length > 0 && (
        <div className="result-panel">
          <div className="result-panel-header">
            <span>🔗 Relationships</span>
            <span className="result-panel-count">{relationships.length} items</span>
          </div>
          <table className="doc-table result-table compact-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {relationships.slice(0, 20).map((r, i) => {
                const rel = r as any;
                return (
                  <tr key={i}>
                    <td>{String(rel.source_name ?? rel.source_entity_id)}</td>
                    <td><span className="rel-badge">{String(rel.relationship_type)}</span></td>
                    <td>{String(rel.target_name ?? rel.target_entity_id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlanPanel({ plan, explainText }: { plan?: OptimizerPlan; explainText: string | null }) {
  if (!plan && !explainText) return <p className="empty-text">No plan available. Run a query first.</p>;

  return (
    <div className="result-panels">
      {explainText && (
        <div className="result-panel">
          <div className="result-panel-header">
            <span><IconClipboard size={16} strokeWidth={2} /> Optimizer Reasoning</span>
          </div>
          <div className="plan-reasoning">
            {explainText.split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="reasoning-step">{line}</div>
            ))}
          </div>
        </div>
      )}

      {plan && (
        <>
          <div className="result-panel">
            <div className="result-panel-header">
              <span>⚙️ Strategy</span>
            </div>
            <div className="plan-meta">
              <div className="plan-meta-row">
                <span className="plan-meta-key">Strategy</span>
                <span className="plan-meta-val badge">{plan.strategy}</span>
              </div>
              <div className="plan-meta-row">
                <span className="plan-meta-key">Total Est. Cost</span>
                <span className="plan-meta-val">{plan.total_estimated_cost.toFixed(2)}</span>
              </div>
              <div className="plan-meta-row">
                <span className="plan-meta-key">Query</span>
                <span className="plan-meta-val mono">{plan.query}</span>
              </div>
            </div>
          </div>

          <div className="result-panel">
            <div className="result-panel-header">
              <span>🔧 Engines</span>
            </div>
            <table className="doc-table result-table compact-table">
              <thead>
                <tr>
                  <th>Engine</th>
                  <th>Enabled</th>
                  <th>Priority</th>
                  <th>Top-K</th>
                  <th>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {plan.engines.map((e, i) => (
                  <tr key={i}>
                    <td>{e.engine}</td>
                    <td>{e.enabled ? "✓" : "—"}</td>
                    <td>{e.priority}</td>
                    <td>{e.top_k}</td>
                    <td>{e.estimated_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="result-panel">
            <div className="result-panel-header">
              <span>⚡ Vector Config</span>
            </div>
            <div className="plan-meta">
              {Object.entries(plan.vector).map(([k, v]) => (
                <div key={k} className="plan-meta-row">
                  <span className="plan-meta-key">{k}</span>
                  <span className="plan-meta-val mono">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="result-panel">
            <div className="result-panel-header">
              <span><IconNetwork size={16} strokeWidth={2} /> Graph Config</span>
            </div>
            <div className="plan-meta">
              {Object.entries(plan.graph).map(([k, v]) => (
                <div key={k} className="plan-meta-row">
                  <span className="plan-meta-key">{k}</span>
                  <span className="plan-meta-val mono">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function renderCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v).slice(0, 80);
}
