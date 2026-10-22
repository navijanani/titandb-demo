/**
 * Static sample data for the TitanDB demo.
 * Everything here is fictional and exists only to make the UI explorable.
 * Org: "Northwind Labs" (sample). No network, no database.
 */

export type SeedDoc = {
  key: string;
  ws: number;
  filename: string;
  type: "pdf" | "docx" | "txt" | "csv";
  kb: number;
  daysAgo: number;
  chunks: string[];
};

export const ORG = { id: 1, name: "Northwind Labs (sample organization)" };

export const DEMO_USER = {
  id: 1,
  email: "visitor@demo.titandb.dev",
  display_name: "Demo Visitor",
  is_active: true,
};

export const SEED_WORKSPACES = [
  { id: 1, name: "TitanDB Research Lab", description: "Retrieval research, benchmarks and design notes for the Titan engine.", icon: "microscope", color: "#6366f1", is_favorite: true, is_archived: false, daysAgo: 42, role: "owner", member_count: 4 },
  { id: 2, name: "Product & Support Docs", description: "Customer-facing documentation, FAQs and support ticket samples.", icon: "books", color: "#14b8a6", is_favorite: false, is_archived: false, daysAgo: 35, role: "editor", member_count: 3 },
  { id: 3, name: "Infra Playbooks", description: "Runbooks, incident process and capacity planning.", icon: "tool", color: "#f97316", is_favorite: false, is_archived: false, daysAgo: 28, role: "viewer", member_count: 3 },
  { id: 4, name: "Legacy Prototype", description: "Archived notes from the first brute-force prototype.", icon: "folder", color: "#64748b", is_favorite: false, is_archived: true, daysAgo: 90, role: "owner", member_count: 1 },
];

export const SEED_MEMBERS = [
  { user_id: 1, user_display_name: "Demo Visitor", user_email: "visitor@demo.titandb.dev" },
  { user_id: 2, user_display_name: "Priya Nair", user_email: "priya@northwind.example" },
  { user_id: 3, user_display_name: "Marcus Webb", user_email: "marcus@northwind.example" },
  { user_id: 4, user_display_name: "Elena Rossi", user_email: "elena@northwind.example" },
];

export const SEED_DOCS: SeedDoc[] = [
  // ───────── Workspace 1: TitanDB Research Lab ─────────
  {
    key: "vector", ws: 1, filename: "vector-search-fundamentals.pdf", type: "pdf", kb: 842, daysAgo: 38,
    chunks: [
      "Vector search retrieves items by meaning instead of exact wording. Each passage is converted into an embedding, a list of numbers positioned so that similar ideas land close together, and a query is embedded the same way before the nearest neighbors are returned.",
      "Cosine similarity compares the angle between two embeddings and ignores their length, which makes it the default metric for sentence embeddings. Inner product gives the same ranking when vectors are normalized, so most production systems normalize once at write time.",
      "Exact nearest neighbor search scans every vector and costs O(n) per query. Approximate nearest neighbor indexes such as HNSW and IVF trade a small loss in recall for orders of magnitude lower latency once a corpus grows past a few hundred thousand chunks.",
      "Embedding quality matters more than index choice for most workloads. Domain vocabulary, chunk size and a consistent preprocessing pipeline usually move recall further than switching algorithms.",
    ],
  },
  {
    key: "hybrid", ws: 1, filename: "hybrid-retrieval-and-rrf-notes.pdf", type: "pdf", kb: 516, daysAgo: 33,
    chunks: [
      "Keyword search is precise for rare identifiers, error codes and product names, but it misses paraphrases. Vector search finds paraphrases but can blur exact terms. Hybrid retrieval runs both and merges the ranked lists.",
      "Reciprocal Rank Fusion scores each document as the sum of 1 divided by (k + rank) across every ranked list, with k commonly set to 60. Because it uses ranks rather than raw scores, BM25 values and cosine similarities never need to be normalized against each other.",
      "In our evaluation, hybrid retrieval with RRF raised Recall@10 from 0.71 for vectors alone to 0.84, with the largest gains on queries that contain exact acronyms or file names.",
      "To keep one long document from crowding out the others, the merged list is capped at three chunks per document before the final top-k is returned.",
    ],
  },
  {
    key: "faiss", ws: 1, filename: "faiss-index-tuning-guide.pdf", type: "pdf", kb: 1204, daysAgo: 29,
    chunks: [
      "FAISS offers flat, IVF and HNSW style indexes. A flat index is exact and simple, IVF partitions vectors into clusters and only scans the nearest few, and HNSW builds a navigable small-world graph that answers queries in logarithmic time.",
      "For HNSW the main knobs are M, which sets how many links each node keeps, and efSearch, which sets how wide the search frontier is at query time. Raising efSearch improves recall at the cost of latency, and it can be changed without rebuilding the index.",
      "IVF with product quantization compresses vectors into short codes, cutting memory by up to 32x. It is the right choice when the index must fit in RAM on a small instance, accepting a drop in recall that reranking can partly recover.",
      "Benchmark every change on a held-out query set. Our baseline of HNSW with M=16 and efSearch=64 reached 0.96 recall against exact search at a median latency of 4 ms.",
    ],
  },
  {
    key: "rag", ws: 1, filename: "rag-evaluation-report-q3.docx", type: "docx", kb: 389, daysAgo: 21,
    chunks: [
      "Retrieval-augmented generation grounds a language model answer in passages fetched from the user's own documents. The pipeline plans the query, retrieves chunks, memories and graph entities, assembles a context window and then asks the model to answer using only that context.",
      "We scored 120 questions on faithfulness and answer relevance. Grounded answers cited at least one correct source in 91 percent of cases, and unsupported claims fell sharply once the prompt required every statement to reference a numbered passage.",
      "The most common failure was not the model but retrieval: when the right chunk was missing from the top ten, no prompt could repair the answer. Improving chunking and adding hybrid search fixed more errors than changing the model.",
      "Latency is dominated by generation. Retrieval and context assembly together stay under 120 ms, so streaming the answer token by token gives the best perceived responsiveness.",
    ],
  },
  {
    key: "kg", ws: 1, filename: "knowledge-graph-design.docx", type: "docx", kb: 274, daysAgo: 24,
    chunks: [
      "The knowledge graph stores entities such as technologies, people and organizations, connected by typed relationships like USES, DEPENDS_ON and AUTHORED_BY. It complements vector search by answering questions about how things relate, not just which text is similar.",
      "Entities are extracted from every chunk during ingestion. Two entities that appear in the same chunk receive a co-occurrence edge, and edges seen repeatedly across documents gain weight.",
      "Graph neighbors are used during retrieval to expand a query. A search for pgvector can also surface passages about PostgreSQL, because the two entities are linked by a DEPENDS_ON relationship.",
      "Shortest-path queries explain connections between two concepts, for example how HNSW relates to latency through the chain HNSW, ANN index, query latency.",
    ],
  },
  {
    key: "embed", ws: 1, filename: "embedding-model-benchmarks.csv", type: "csv", kb: 12, daysAgo: 17,
    chunks: [
      "model,dimensions,avg_encode_ms,recall_at_10\nall-MiniLM-L6-v2,384,6.1,0.81\nbge-small-en-v1.5,384,8.4,0.85\ne5-base-v2,768,19.7,0.87\ntext-embedding-3-small,1536,42.0,0.89",
      "notes: MiniLM is the default embedding model because it runs on CPU and keeps the index small. Larger models improve recall by a few points but multiply storage and encode time.",
      "dataset,queries,corpus_chunks\nsupport_faq,300,12400\nengineering_docs,180,38200\nresearch_papers,90,9100",
    ],
  },
  {
    key: "ml", ws: 1, filename: "machine-learning-primer.txt", type: "txt", kb: 18, daysAgo: 45,
    chunks: [
      "Machine learning builds models that learn patterns from examples instead of following hand-written rules. Supervised learning fits labeled data, unsupervised learning finds structure in unlabeled data, and reinforcement learning optimizes actions through reward.",
      "Neural networks stack layers of weighted connections trained by gradient descent. Transformers, the architecture behind modern language models and embedding encoders, use attention to weigh how much each token should influence every other token.",
      "Evaluating a model requires data it has never seen. Hold out a test set, report metrics that match the product goal, such as recall for search, and watch for leakage between training and evaluation.",
      "Large language models are pretrained on broad text and then prompted or fine-tuned for a task. Their main weakness for knowledge work is hallucination, which retrieval-augmented generation reduces by supplying real source passages.",
    ],
  },
  {
    key: "pg", ws: 1, filename: "postgres-pgvector-migration-notes.txt", type: "txt", kb: 22, daysAgo: 14,
    chunks: [
      "We moved the vector store from an in-process Python scan to PostgreSQL with the pgvector extension. Embeddings live in a vector(384) column next to the chunk text, so a single SQL query can filter by workspace and rank by cosine distance.",
      "An HNSW index on the embedding column cut p95 query latency from 310 ms to 22 ms on 40 thousand chunks. Index builds are memory hungry, so run them during low traffic and set maintenance_work_mem generously.",
      "SQLite remains the default database for local development. The service layer hides the difference, falling back to a Python cosine scan when pgvector is not available.",
      "Every query now carries a workspace id filter in the WHERE clause, which keeps tenants isolated and lets the planner use the workspace index before ranking.",
    ],
  },
  {
    key: "post", ws: 1, filename: "query-latency-postmortem.pdf", type: "pdf", kb: 233, daysAgo: 9,
    chunks: [
      "On the afternoon of the incident, p95 search latency rose from 40 ms to over 2 seconds for roughly 25 minutes. The cause was an unbounded metrics table that grew until the dashboard query began scanning millions of rows.",
      "Contributing factors were missing retention, a blocking metrics flush inside the event loop, and no alert on slow query count. Search itself was healthy, but shared database connections were exhausted.",
      "Remediation: prune metric rows older than seven days, move the flush to a background thread, and alert when p95 latency exceeds 150 ms for five minutes. Add a regression test that fails if a request path creates unbounded label values.",
    ],
  },
  {
    key: "tql", ws: 1, filename: "tql-language-spec.docx", type: "docx", kb: 156, daysAgo: 11,
    chunks: [
      "TQL, the Titan Query Language, is a small declarative language for asking structured questions. A statement starts with FIND, names a resource such as documents, memories or entities, and can narrow it with ABOUT, WHERE and ORDER BY.",
      "Example: FIND documents ABOUT database. The parser turns the statement into a plan, the optimizer chooses engines, and the executor merges results from vector search, memory search and graph search.",
      "Filters use simple comparisons, for example FIND entities WHERE type=technology. ORDER BY importance sorts memories by their stored importance score, highest first.",
      "EXPLAIN prints the chosen plan without running it, showing each engine, its estimated cost and why the optimizer enabled it.",
    ],
  },
  // ───────── Workspace 2: Product & Support Docs ─────────
  {
    key: "onboard", ws: 2, filename: "onboarding-handbook.pdf", type: "pdf", kb: 640, daysAgo: 30,
    chunks: [
      "Welcome to Northwind Labs. In your first week you will set up your workspace, meet your onboarding buddy and ship a small change to production. Every new teammate is added to the shared Default workspace automatically.",
      "Workspaces separate projects. Each workspace has its own documents, memories, collections and knowledge graph, and members can be owners, editors or viewers.",
    ],
  },
  {
    key: "tickets", ws: 2, filename: "customer-support-tickets-sample.csv", type: "csv", kb: 9, daysAgo: 12,
    chunks: [
      "ticket_id,topic,priority,summary\n1042,search,high,Search results feel stale after uploading a new PDF\n1051,billing,low,Invoice shows the wrong company name\n1057,ingestion,medium,CSV upload stuck in processing",
      "Common resolution for stuck ingestion: re-upload the file after confirming it is under 50 MB and uses UTF-8 encoding. Processing normally finishes within a few seconds for files under 5 MB.",
    ],
  },
  {
    key: "faq", ws: 2, filename: "product-faq.docx", type: "docx", kb: 94, daysAgo: 20,
    chunks: [
      "How does Titan answer questions? It retrieves the most relevant passages from your documents, shows them as sources, and writes an answer grounded in those passages.",
      "Which file types are supported? PDF, DOCX, TXT and CSV up to 50 MB. Text is extracted, split into overlapping chunks and embedded for search.",
    ],
  },
  {
    key: "notes", ws: 2, filename: "release-notes-v2.txt", type: "txt", kb: 7, daysAgo: 5,
    chunks: [
      "Release 2.0 adds hybrid search with Reciprocal Rank Fusion, workspace-level permissions and a query optimizer that explains its plan.",
      "Release 2.0 also fixes duplicate chunks in search results and speeds up knowledge graph construction for large documents.",
    ],
  },
  // ───────── Workspace 3: Infra Playbooks ─────────
  {
    key: "deploy", ws: 3, filename: "deployment-runbook.pdf", type: "pdf", kb: 418, daysAgo: 26,
    chunks: [
      "Deploy the API as a stateless container behind a load balancer. Run database migrations first, then roll instances one at a time while watching the error rate and p95 latency dashboards.",
      "Rollback plan: redeploy the previous image tag. Database migrations are written to be backward compatible for one release so a rollback never requires a schema change.",
    ],
  },
  {
    key: "incident", ws: 3, filename: "incident-response-playbook.docx", type: "docx", kb: 133, daysAgo: 19,
    chunks: [
      "When an alert fires, the on-call engineer acknowledges within five minutes, opens an incident channel and assigns an incident commander for anything customer facing.",
      "After resolution, hold a blameless review within three business days. Record the timeline, root cause, contributing factors and concrete follow-up tasks with owners.",
    ],
  },
  {
    key: "capacity", ws: 3, filename: "capacity-planning-sheet.csv", type: "csv", kb: 5, daysAgo: 8,
    chunks: [
      "service,cpu_cores,memory_gb,peak_rps\napi,4,8,120\nworker,2,16,40\npostgres,8,32,300\nvector_index,4,24,80",
    ],
  },
  // ───────── Workspace 4: Legacy Prototype (archived) ─────────
  {
    key: "proto", ws: 4, filename: "prototype-notes.txt", type: "txt", kb: 4, daysAgo: 85,
    chunks: [
      "The first prototype stored embeddings in a Python list and compared every query against every vector with brute force cosine similarity.",
      "It worked for a few hundred chunks but became slow beyond ten thousand, which motivated the move to approximate nearest neighbor indexes and PostgreSQL.",
    ],
  },
];

export const SEED_MEMORIES: { ws: number; fact: string; source: string | null; importance: number; access: number; daysAgo: number }[] = [
  { ws: 1, fact: "Default embedding model is all-MiniLM-L6-v2 with 384 dimensions.", source: "embedding-model-benchmarks.csv", importance: 0.9, access: 14, daysAgo: 17 },
  { ws: 1, fact: "Hybrid search merges keyword and vector rankings with Reciprocal Rank Fusion using k=60.", source: "hybrid-retrieval-and-rrf-notes.pdf", importance: 0.95, access: 22, daysAgo: 33 },
  { ws: 1, fact: "HNSW baseline: M=16 and efSearch=64 gives 0.96 recall at a 4 ms median latency.", source: "faiss-index-tuning-guide.pdf", importance: 0.85, access: 9, daysAgo: 29 },
  { ws: 1, fact: "Moving to pgvector with an HNSW index cut p95 database query latency from 310 ms to 22 ms.", source: "postgres-pgvector-migration-notes.txt", importance: 0.88, access: 11, daysAgo: 14 },
  { ws: 1, fact: "Uploads accept PDF, DOCX, TXT and CSV files up to 50 MB.", source: "Titan ingestion spec", importance: 0.6, access: 5, daysAgo: 30 },
  { ws: 1, fact: "Search results are capped at three chunks per document before the top-k cut.", source: "hybrid-retrieval-and-rrf-notes.pdf", importance: 0.7, access: 7, daysAgo: 33 },
  { ws: 1, fact: "Retrieval quality, not the language model, was the main source of RAG errors in the Q3 evaluation.", source: "rag-evaluation-report-q3.docx", importance: 0.92, access: 18, daysAgo: 21 },
  { ws: 1, fact: "Incident: an unbounded metrics table caused a 25 minute latency spike; prune rows older than 7 days.", source: "query-latency-postmortem.pdf", importance: 0.8, access: 6, daysAgo: 9 },
  { ws: 1, fact: "TQL statements start with FIND and support ABOUT, WHERE and ORDER BY clauses.", source: "tql-language-spec.docx", importance: 0.65, access: 8, daysAgo: 11 },
  { ws: 1, fact: "Workspace id is a required filter on every vector query to keep tenants isolated.", source: "postgres-pgvector-migration-notes.txt", importance: 0.78, access: 10, daysAgo: 14 },
  { ws: 1, fact: "Co-occurrence of two entities in a chunk creates a knowledge graph edge.", source: "knowledge-graph-design.docx", importance: 0.72, access: 4, daysAgo: 24 },
  { ws: 1, fact: "Priya prefers a weekly retrieval-quality report shared on Fridays.", source: "manual note", importance: 0.4, access: 2, daysAgo: 6 },
  { ws: 2, fact: "Files stuck in processing are usually over 50 MB or not UTF-8 encoded.", source: "customer-support-tickets-sample.csv", importance: 0.7, access: 6, daysAgo: 12 },
  { ws: 2, fact: "Release 2.0 shipped hybrid search and workspace-level permissions.", source: "release-notes-v2.txt", importance: 0.8, access: 9, daysAgo: 5 },
  { ws: 2, fact: "Every new teammate joins the Default workspace automatically.", source: "onboarding-handbook.pdf", importance: 0.5, access: 3, daysAgo: 30 },
  { ws: 3, fact: "Database migrations stay backward compatible for one release to allow safe rollbacks.", source: "deployment-runbook.pdf", importance: 0.85, access: 7, daysAgo: 26 },
  { ws: 3, fact: "Blameless review within three business days of any customer-facing incident.", source: "incident-response-playbook.docx", importance: 0.75, access: 5, daysAgo: 19 },
  { ws: 3, fact: "Postgres is the largest capacity consumer at 8 cores and 32 GB.", source: "capacity-planning-sheet.csv", importance: 0.55, access: 2, daysAgo: 8 },
  { ws: 4, fact: "Brute-force cosine search stopped scaling beyond ten thousand chunks.", source: "prototype-notes.txt", importance: 0.6, access: 1, daysAgo: 85 },
];

export type SeedEntity = { ws: number; name: string; type: string; props?: Record<string, unknown> };
export const SEED_ENTITIES: SeedEntity[] = [
  // ws 1
  { ws: 1, name: "FAISS", type: "technology", props: { kind: "ANN library" } },
  { ws: 1, name: "HNSW", type: "technology", props: { kind: "graph index" } },
  { ws: 1, name: "IVF-PQ", type: "technology", props: { kind: "compressed index" } },
  { ws: 1, name: "pgvector", type: "technology", props: { kind: "PostgreSQL extension" } },
  { ws: 1, name: "PostgreSQL", type: "technology" },
  { ws: 1, name: "SQLite", type: "technology" },
  { ws: 1, name: "FastAPI", type: "technology" },
  { ws: 1, name: "BM25", type: "technology", props: { kind: "keyword ranking" } },
  { ws: 1, name: "TQL", type: "technology", props: { kind: "query language" } },
  { ws: 1, name: "Vector Search", type: "concept" },
  { ws: 1, name: "Hybrid Search", type: "concept" },
  { ws: 1, name: "Reciprocal Rank Fusion", type: "concept", props: { k: 60 } },
  { ws: 1, name: "Retrieval-Augmented Generation", type: "concept" },
  { ws: 1, name: "Knowledge Graph", type: "concept" },
  { ws: 1, name: "Embeddings", type: "concept" },
  { ws: 1, name: "Cosine Similarity", type: "concept" },
  { ws: 1, name: "Query Latency", type: "concept" },
  { ws: 1, name: "Recall@10", type: "concept" },
  { ws: 1, name: "Chunking", type: "concept" },
  { ws: 1, name: "all-MiniLM-L6-v2", type: "technology", props: { kind: "embedding model", dimensions: 384 } },
  { ws: 1, name: "Large Language Model", type: "technology" },
  { ws: 1, name: "Priya Nair", type: "person", props: { role: "Research lead" } },
  { ws: 1, name: "Marcus Webb", type: "person", props: { role: "Platform engineer" } },
  { ws: 1, name: "Northwind Labs", type: "organization" },
  { ws: 1, name: "Engineering Docs Benchmark", type: "concept", props: { kind: "dataset", queries: 180 } },
  // ws 2
  { ws: 2, name: "Workspace", type: "concept" },
  { ws: 2, name: "Document Ingestion", type: "concept" },
  { ws: 2, name: "Support Tickets", type: "concept", props: { kind: "dataset" } },
  { ws: 2, name: "Release 2.0", type: "concept" },
  // ws 3
  { ws: 3, name: "Deployment Runbook", type: "concept" },
  { ws: 3, name: "Incident Response", type: "concept" },
  { ws: 3, name: "PostgreSQL", type: "technology" },
  { ws: 3, name: "Load Balancer", type: "technology" },
  // ws 4
  { ws: 4, name: "Brute Force Search", type: "concept" },
  { ws: 4, name: "Approximate Nearest Neighbor", type: "concept" },
];

export type SeedRel = { ws: number; from: string; type: string; to: string };
export const SEED_RELS: SeedRel[] = [
  { ws: 1, from: "Hybrid Search", type: "USES", to: "Reciprocal Rank Fusion" },
  { ws: 1, from: "Hybrid Search", type: "USES", to: "BM25" },
  { ws: 1, from: "Hybrid Search", type: "USES", to: "Vector Search" },
  { ws: 1, from: "Vector Search", type: "USES", to: "Embeddings" },
  { ws: 1, from: "Vector Search", type: "USES", to: "Cosine Similarity" },
  { ws: 1, from: "Vector Search", type: "USES", to: "HNSW" },
  { ws: 1, from: "Embeddings", type: "COMPUTED_BY", to: "all-MiniLM-L6-v2" },
  { ws: 1, from: "FAISS", type: "IMPLEMENTS", to: "HNSW" },
  { ws: 1, from: "FAISS", type: "IMPLEMENTS", to: "IVF-PQ" },
  { ws: 1, from: "HNSW", type: "IMPROVES", to: "Query Latency" },
  { ws: 1, from: "pgvector", type: "DEPENDS_ON", to: "PostgreSQL" },
  { ws: 1, from: "pgvector", type: "IMPLEMENTS", to: "HNSW" },
  { ws: 1, from: "SQLite", type: "FALLBACK_FOR", to: "PostgreSQL" },
  { ws: 1, from: "FastAPI", type: "SERVES", to: "Retrieval-Augmented Generation" },
  { ws: 1, from: "Retrieval-Augmented Generation", type: "USES", to: "Hybrid Search" },
  { ws: 1, from: "Retrieval-Augmented Generation", type: "USES", to: "Knowledge Graph" },
  { ws: 1, from: "Retrieval-Augmented Generation", type: "USES", to: "Large Language Model" },
  { ws: 1, from: "Chunking", type: "FEEDS", to: "Embeddings" },
  { ws: 1, from: "Chunking", type: "FEEDS", to: "Knowledge Graph" },
  { ws: 1, from: "Recall@10", type: "MEASURES", to: "Hybrid Search" },
  { ws: 1, from: "Recall@10", type: "MEASURES", to: "Vector Search" },
  { ws: 1, from: "TQL", type: "QUERIES", to: "Knowledge Graph" },
  { ws: 1, from: "TQL", type: "QUERIES", to: "Vector Search" },
  { ws: 1, from: "Priya Nair", type: "WORKS_AT", to: "Northwind Labs" },
  { ws: 1, from: "Marcus Webb", type: "WORKS_AT", to: "Northwind Labs" },
  { ws: 1, from: "Priya Nair", type: "RESEARCHES", to: "Hybrid Search" },
  { ws: 1, from: "Marcus Webb", type: "MAINTAINS", to: "PostgreSQL" },
  { ws: 1, from: "Query Latency", type: "AFFECTS", to: "Retrieval-Augmented Generation" },
  { ws: 1, from: "Engineering Docs Benchmark", type: "EVALUATES", to: "Hybrid Search" },
  { ws: 2, from: "Document Ingestion", type: "PART_OF", to: "Workspace" },
  { ws: 2, from: "Support Tickets", type: "ABOUT", to: "Document Ingestion" },
  { ws: 2, from: "Release 2.0", type: "IMPROVES", to: "Workspace" },
  { ws: 3, from: "Deployment Runbook", type: "USES", to: "Load Balancer" },
  { ws: 3, from: "Incident Response", type: "REVIEWS", to: "Deployment Runbook" },
  { ws: 3, from: "Deployment Runbook", type: "RUNS_MIGRATIONS_ON", to: "PostgreSQL" },
  { ws: 4, from: "Brute Force Search", type: "REPLACED_BY", to: "Approximate Nearest Neighbor" },
];

export const SEED_COLLECTIONS: { ws: number; name: string; description: string; docs: string[]; daysAgo: number }[] = [
  { ws: 1, name: "Retrieval Research", description: "Papers and guides on vector, hybrid and RAG retrieval.", docs: ["vector", "hybrid", "faiss", "rag"], daysAgo: 30 },
  { ws: 1, name: "Operations & Incidents", description: "Migration notes and the latency postmortem.", docs: ["pg", "post"], daysAgo: 12 },
  { ws: 1, name: "Language & Specs", description: "TQL spec and knowledge graph design.", docs: ["kg", "tql"], daysAgo: 11 },
  { ws: 2, name: "Customer Facing", description: "FAQ and support samples.", docs: ["tickets", "faq"], daysAgo: 12 },
  { ws: 3, name: "Runbooks", description: "Deployment and incident process.", docs: ["deploy", "incident"], daysAgo: 19 },
];

export const SEED_ACTIVITY: { ws: number; user: string; action: string; entity_type: string | null; name?: string; daysAgo: number; hour: number }[] = [
  { ws: 1, user: "Priya Nair", action: "created", entity_type: "workspace", name: "TitanDB Research Lab", daysAgo: 42, hour: 9 },
  { ws: 1, user: "Priya Nair", action: "uploaded", entity_type: "document", name: "vector-search-fundamentals.pdf", daysAgo: 38, hour: 10 },
  { ws: 1, user: "Priya Nair", action: "uploaded", entity_type: "document", name: "hybrid-retrieval-and-rrf-notes.pdf", daysAgo: 33, hour: 15 },
  { ws: 1, user: "Marcus Webb", action: "uploaded", entity_type: "document", name: "faiss-index-tuning-guide.pdf", daysAgo: 29, hour: 11 },
  { ws: 1, user: "Elena Rossi", action: "extracted", entity_type: "entities", name: "knowledge-graph-design.docx", daysAgo: 24, hour: 14 },
  { ws: 1, user: "Priya Nair", action: "uploaded", entity_type: "document", name: "rag-evaluation-report-q3.docx", daysAgo: 21, hour: 16 },
  { ws: 1, user: "Marcus Webb", action: "uploaded", entity_type: "document", name: "postgres-pgvector-migration-notes.txt", daysAgo: 14, hour: 9 },
  { ws: 1, user: "Marcus Webb", action: "completed", entity_type: "ingestion", name: "postgres-pgvector-migration-notes.txt", daysAgo: 14, hour: 9 },
  { ws: 1, user: "Elena Rossi", action: "created", entity_type: "collection", name: "Language & Specs", daysAgo: 11, hour: 13 },
  { ws: 1, user: "Marcus Webb", action: "uploaded", entity_type: "document", name: "query-latency-postmortem.pdf", daysAgo: 9, hour: 17 },
  { ws: 2, user: "Elena Rossi", action: "created", entity_type: "workspace", name: "Product & Support Docs", daysAgo: 35, hour: 10 },
  { ws: 2, user: "Elena Rossi", action: "uploaded", entity_type: "document", name: "release-notes-v2.txt", daysAgo: 5, hour: 12 },
  { ws: 3, user: "Marcus Webb", action: "created", entity_type: "workspace", name: "Infra Playbooks", daysAgo: 28, hour: 10 },
  { ws: 3, user: "Marcus Webb", action: "uploaded", entity_type: "document", name: "capacity-planning-sheet.csv", daysAgo: 8, hour: 14 },
  { ws: 4, user: "Priya Nair", action: "archive_toggled", entity_type: "workspace", name: "Legacy Prototype", daysAgo: 60, hour: 9 },
];

export const SEED_SEARCHES: { q: string; results: number; minutesAgo: number }[] = [
  { q: "reciprocal rank fusion", results: 6, minutesAgo: 190 },
  { q: "how to speed up nearest neighbor lookup", results: 8, minutesAgo: 95 },
  { q: "pgvector latency", results: 5, minutesAgo: 50 },
  { q: "knowledge graph entities", results: 4, minutesAgo: 22 },
];

/**
 * Hand-curated result sets for the example queries shown on the Search page.
 * These stand in for a live FAISS index + RRF run. The UI labels them as
 * "Precomputed" so nothing here is presented as live AI processing.
 * Each entry lists chunk references as `${docKey}:${chunkIndex}` with a similarity score.
 */
export const PRECOMPUTED: Record<string, { semantic: [string, number][]; vector: [string, number][]; keyword: [string, number][] }> = {
  "how to speed up nearest neighbor lookup": {
    semantic: [["faiss:1", 0.91], ["pg:1", 0.87], ["vector:2", 0.84], ["faiss:0", 0.79], ["faiss:3", 0.74], ["faiss:2", 0.66]],
    vector: [["faiss:1", 0.91], ["pg:1", 0.87], ["vector:2", 0.84], ["faiss:0", 0.79], ["faiss:3", 0.74], ["faiss:2", 0.66]],
    keyword: [["vector:2", 12.4], ["faiss:0", 9.1], ["faiss:1", 6.5], ["proto:1", 4.2]],
  },
  "combine keyword and vector results": {
    semantic: [["hybrid:0", 0.93], ["hybrid:1", 0.88], ["hybrid:2", 0.8], ["hybrid:3", 0.61], ["rag:2", 0.58]],
    vector: [["hybrid:0", 0.93], ["hybrid:1", 0.88], ["hybrid:2", 0.8], ["hybrid:3", 0.61], ["rag:2", 0.58]],
    keyword: [["hybrid:0", 10.2], ["hybrid:1", 8.8], ["vector:3", 3.1]],
  },
  "why did search get slow": {
    semantic: [["post:0", 0.9], ["post:1", 0.86], ["post:2", 0.77], ["pg:1", 0.69], ["rag:3", 0.55]],
    vector: [["post:0", 0.9], ["post:1", 0.86], ["post:2", 0.77], ["pg:1", 0.69], ["rag:3", 0.55]],
    keyword: [["post:0", 7.7], ["pg:1", 5.2], ["rag:3", 2.4]],
  },
  "which embedding model do we use": {
    semantic: [["embed:1", 0.92], ["embed:0", 0.89], ["vector:3", 0.7], ["vector:0", 0.62]],
    vector: [["embed:1", 0.92], ["embed:0", 0.89], ["vector:3", 0.7], ["vector:0", 0.62]],
    keyword: [["embed:0", 9.4], ["embed:1", 8.9], ["vector:0", 3.0]],
  },
  "how are entities connected": {
    semantic: [["kg:0", 0.9], ["kg:1", 0.86], ["kg:2", 0.74], ["kg:3", 0.7]],
    vector: [["kg:0", 0.9], ["kg:1", 0.86], ["kg:2", 0.74], ["kg:3", 0.7]],
    keyword: [["kg:0", 6.1], ["kg:1", 5.7]],
  },
};

export const EXAMPLE_QUERIES = Object.keys(PRECOMPUTED);
