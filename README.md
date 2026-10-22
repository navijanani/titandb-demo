# TitanDB Demo

A standalone, backend-free interactive demo of the **TitanDB** studio UI, built for recruiters and reviewers.
It opens straight into a sample workspace in a fictional organization ("Northwind Labs"): no sign-up, no login, no cold starts.

- Original app (needs a backend + account): https://titan-frontend-kappa.vercel.app
- Frontend source: https://github.com/navijanani/titan-frontend
- Backend source: https://github.com/navijanani/titan-backend
- Architecture overview: click **Architecture** in the demo header

This project is a copy of the original frontend. The pages, components and `styles.css` are the originals; only the data layer was swapped for local sample data. The original repositories were not modified.

## What is real and what is simulated

| Feature | In this demo |
| --- | --- |
| Browsing documents, collections, memories, graph, workspaces | Real UI over an in-memory sample dataset |
| Upload `.txt` / `.csv` | Chunked in your browser (1000 chars, 200 overlap) and searchable immediately |
| Upload `.pdf` / `.docx` | Added to the list with a placeholder body (text extraction needs the backend) |
| Keyword matching and search filters | Real: BM25 ranking, filename / type / date / document filters, run locally |
| Reciprocal Rank Fusion | Real math (k = 60, max 3 chunks per document) over the two rankings |
| Semantic ranking | **Simulated.** The 5 example queries return clearly labelled precomputed results standing in for FAISS. Other queries use a simple concept-similarity approximation. No embedding model runs. |
| Answers on the Search page | **Extractive summaries** of the top passages. No language model is called. The provider shows as `demo/extractive summary (no LLM called)`. |
| Query optimizer / TQL | Rule-based plan and local execution over the sample data |
| Analytics growth charts | Document / memory / entity counts come from the sample data; search volume is generated |
| Metrics page and latency charts | Generated sample numbers, labelled as such on the page |

Changes you make (uploads, new memories, graph edits...) live in memory until the page reloads.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, runs the offline guard, builds to dist/
npm run preview
```

Requires Node 20.19+ (22 recommended).

## Deploy to Vercel

**Dashboard (recommended)**

1. Push this folder to a new GitHub repository (it is independent of the original repos).
2. In Vercel choose **Add New → Project** and import that repository.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output directory `dist`. `vercel.json` already sets these.
4. No environment variables are needed. Click **Deploy**.

**CLI**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

If the project lives inside a larger repository, set **Root Directory** to `titandb-demo` in the Vercel project settings.

Routing is hash-based (`#search`, `#graph`...), so no rewrite rules are needed and deep links such as `https://your-demo.vercel.app/#search` work.

## Verifying there are no backend calls

- `npm run check:offline` fails if `src/` contains `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, axios, `VITE_API*` or `/api/v1` paths. It also runs automatically before every build.
- In the browser: open DevTools → Network, reload and click through the app. The only third-party request is the Figtree font stylesheet from Google Fonts, which is part of the original design. Remove the `@import` at the top of `src/styles.css` to make the demo fully offline (the UI then falls back to system fonts).

## Where things live

```
src/
  api/client.ts          same exports as the production client, answered locally
  api/workspaceApi.ts    same, for workspaces
  auth/                  always-signed-in demo user (no tokens, no login screens)
  demo/seed.ts           all sample data (documents, memories, graph, collections, precomputed searches)
  demo/store.ts          in-memory database built from the seed
  demo/engine.ts         BM25, simulated vector similarity, RRF, planner, TQL parser
  demo/metrics.ts        generated sample metrics
  demo/DemoBar.tsx       "Demo Mode" badge + links
  demo/WelcomeModal.tsx  first-visit modal (shown once, remembered in localStorage)
  demo/ArchitectureModal.tsx
  demo.css               the only new styles; styles.css is untouched
```

To change the sample content edit `src/demo/seed.ts`. To add another precomputed example query, add an entry to `PRECOMPUTED` there.

## Differences from the original frontend

Removed: login, register and password-reset pages, protected routes, token handling, the Vite `/api` proxy, the unused `QueryConsole` page.
Added: demo header bar, welcome modal, "Demo" disclosure notes on Search / Query / Analytics / Metrics, example-query chips on Search.
Small fixes made while wiring things up:
- Analytics page crashed on load (an emoji string was passed as a component); now uses an icon.
- Deep links like `#search` were overwritten on first load; the initial tab is now read from the URL.
- The workspace selector showed "Select Workspace" until opened; it now loads on mount.
- Path Finder opens with two connected sample entities prefilled; the file-type filter gains a CSV option.
- Dependencies are pinned to the versions in the original `package-lock.json` instead of `latest`.
