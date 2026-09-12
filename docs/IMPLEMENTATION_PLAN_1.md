# ⚡ HOW TO RUN — DeepResearch AI (Quick Start & Documentation)

> [!IMPORTANT]
> Run these commands in **two separate terminal windows** — one for backend, one for frontend.

---

## Terminal 1 — Start Backend (Port 5000)

```bash
cd backend
npm install
node index.js
```

✅ **Success output:**
```
Server running in development mode on port 5000
[DB] Connected to MongoMemoryServer (In-Memory)
[Queue] In-memory job queue ready (zero external dependencies required)
```

---

## Terminal 2 — Start Frontend (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

✅ **Success output:**
```
VITE v8.3.0  ready in ~800 ms
➜  Local:   http://localhost:5173/
```

---

## Open in Browser

👉 **http://localhost:5173**

---

## Verify Backend is Running

```bash
curl http://localhost:5000/api/health
```

Expected: `{"status":"ok","message":"API is running"}`

---

## Test a Research Run via API (Optional)

```bash
curl -X POST http://localhost:5000/api/research \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Latest breakthroughs in solid-state lithium batteries\"}"
```

Returns: `{"message":"Research started","run":{"_id":"...","status":"pending"}}`

Then poll for status:
```bash
curl http://localhost:5000/api/research/<run_id_from_above>
```

---

> [!NOTE]
> No Docker, no Redis, no MongoDB installation needed. The app runs fully standalone using an in-memory database and in-memory queue.

---
---

# DeepResearch AI — Complete Project Documentation & Run Guide

## What This Project Does

**DeepResearch AI** is a fully autonomous multi-agent research platform. You type any question or topic, and it:

1. **Breaks your query** into 3 focused sub-investigation tracks using AI
2. **Searches Google Scholar, arXiv, Semantic Scholar, OpenAlex** for peer-reviewed academic papers
3. **Searches the entire open internet** via DuckDuckGo, Wikipedia, and Tavily
4. **Extracts and embeds** text from all discovered pages/papers into vector chunks
5. **Ranks chunks by semantic similarity** to your original query
6. **Synthesizes a 2-to-3 page publication-grade research report** (~1,600–2,500 words) with numbered citations, comparison tables, and an annotated bibliography
7. **Displays the report** in a paginated 2-3 page document viewer with a Table of Contents, export to PDF/Markdown, and a filterable academic source explorer

---

## Manual Commands to Run

### Prerequisites
- Node.js v18+ installed
- npm installed

### Step 1 — Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2 — Start Backend (Port 5000)
```bash
cd backend
node index.js
```
You should see:
```
Server running in development mode on port 5000
[DB] Connected to MongoMemoryServer (In-Memory)
[Queue] In-memory job queue ready
```

### Step 3 — Install Frontend Dependencies (separate terminal)
```bash
cd frontend
npm install
```

### Step 4 — Start Frontend Dev Server (Port 5173)
```bash
cd frontend
npm run dev
```
You should see:
```
VITE v8.3.0  ready in ~800ms
➜  Local:   http://localhost:5173/
```

### Step 5 — Open the App
Open your browser and go to: **http://localhost:5173**

### Health Check (Verify Backend is Running)
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"API is running"}
```

---

## Full Project File Structure & What Each File Does

```
Research-Platform/
├── backend/
│   ├── .env.example                  ← Example environment variables template
│   ├── index.js                      ← Express server entry point
│   ├── config/
│   │   ├── db.js                     ← MongoDB connection (auto-uses in-memory DB if no MONGO_URI)
│   │   ├── redis.js                  ← Optional Redis connection helper
│   │   └── fakeRedis.js              ← Fallback in-memory cache helper
│   ├── models/
│   │   ├── ResearchRun.js            ← Tracks each research job (status, progress, subQuestions)
│   │   ├── Source.js                 ← Each discovered URL/paper with metadata
│   │   ├── Chunk.js                  ← Text chunks extracted from sources + embeddings
│   │   ├── Report.js                 ← Final synthesized report with citations
│   │   ├── Project.js                ← Research workspace container
│   │   └── User.js                   ← User accounts
│   ├── routes/
│   │   ├── research.js               ← POST /api/research, GET /api/research/:id, GET /api/research/:id/sources
│   │   └── projects.js               ← CRUD for project workspaces
│   ├── workers/
│   │   ├── queue.js                  ← In-memory job queue (no Redis needed to run)
│   │   ├── planningWorker.js         ← Stage 1: AI breaks query into 3 sub-investigations
│   │   ├── searchWorker.js           ← Stage 2: Queries Google Scholar + internet for each sub-investigation
│   │   ├── processWorker.js          ← Stage 3: Scrapes pages, chunks text, generates embeddings
│   │   └── synthesisWorker.js        ← Stage 4: Ranks chunks, calls AI to write 2-3 page report
│   ├── services/
│   │   ├── academicSearchService.js  ← Queries Google Scholar, Semantic Scholar, arXiv, OpenAlex
│   │   ├── universalSearchService.js ← Queries DuckDuckGo, Wikipedia, Tavily for open web results
│   │   └── llmService.js             ← Gemini AI calls for sub-question planning & report synthesis
│   └── utils/
│       └── vectorSimilarity.js       ← Cosine similarity ranking of embedded text chunks
│
├── frontend/
│   ├── index.html                    ← Vite entry HTML
│   ├── vite.config.js                ← Vite config (proxies /api/* to localhost:5000)
│   └── src/
│       ├── main.jsx                  ← React root mount
│       ├── App.jsx                   ← Router + branded header with status badges
│       ├── index.css                 ← All styles: dark glass UI + @media print (PDF layout)
│       ├── pages/
│       │   └── Dashboard.jsx         ← Main workspace: search input, live pipeline tracker, tabs
│       └── components/
│           ├── ReportViewer.jsx      ← 2-3 Page paginated document viewer, TOC, export toolbar
│           └── SourceList.jsx        ← Source explorer with Scholar/Web filter tabs and search
│
├── docs/
│   ├── IMPLEMENTATION_PLAN_1.md      ← Quick start & documentation guide
│   └── IMPLEMENTATION_PLAN_2.md      ← Deep architecture & data flow deep dive
└── docker-compose.yml                ← Optional containerization for MongoDB & Redis
```

---

## How Each Stage Works (Pipeline Detail)

### Stage 1 — Planning (`planningWorker.js`)
- Receives user query
- Sends it to Gemini AI with a prompt to break it into **3 focused sub-questions**
- Falls back to smart topic-based sub-questions if AI is unavailable
- Updates ResearchRun status: `planning → searching`

### Stage 2 — Search (`searchWorker.js`)
For each sub-question, runs in **parallel**:

**Academic Track** (`academicSearchService.js`):
- Google Scholar scraper (extracts title, authors, year, citation count, PDF URL, abstract)
- Semantic Scholar Graph API (free, peer-reviewed papers with open-access PDFs)
- arXiv API (open-access preprints, XML parsed)
- OpenAlex API (free open scholarly catalog)

**Web Track** (`universalSearchService.js`):
- DuckDuckGo HTML scraper (live results from all internet domains)
- Wikipedia API (encyclopedic definitions and summaries)
- Tavily API (premium search if `SEARCH_API_KEY` is set in `.env`)

Saves each unique source to MongoDB with full metadata. Updates status: `collecting → processing`

### Stage 3 — Content Processing (`processWorker.js`)
- Scrapes/fetches actual page content for each URL (with timeout protection)
- Falls back to abstract/snippet metadata if page is blocked/paywalled
- Deduplicates content by SHA-256 hash
- Splits text into overlapping chunks (600 chars, 100 char overlap)
- Generates dense vector embeddings for each chunk (Gemini `text-embedding-004` or pseudo-embedding fallback)
- Saves all chunks to MongoDB. Updates status: `processing → retrieving`

### Stage 4 — Synthesis (`synthesisWorker.js`)
- Generates query embedding
- Ranks all chunks by **cosine similarity** to the original query
- Selects top 18 most relevant evidence passages
- Feeds evidence to Gemini AI with a structured prompt demanding a **publication-grade 2-3 page report**:
  1. Executive Summary & Key Takeaways
  2. Research Methodology & Telemetry Table
  3. Theoretical Foundations & Google Scholar Literature Analysis
  4. Industry Architectures & Comparative Benchmark Matrix Table
  5. Critical Contradictions & Technical Bottlenecks
  6. Strategic 3-Phase Recommendations Roadmap
  7. Conclusion
  8. Annotated Bibliography with numbered citation markers `[1]`, `[2]`...
- Saves the final Report document. Updates status: `completed (100%)`

---

## Environment Variables (`.env`)

| Variable | What It Does | Required? |
|---|---|---|
| `PORT` | Backend port (default: 5000) | Optional |
| `MONGO_URI` | MongoDB connection string | Optional (auto uses in-memory DB if blank) |
| `GEMINI_API_KEY` | Google Gemini AI for planning + synthesis | **Strongly Recommended** |
| `SEARCH_API_KEY` | Tavily API key for premium web search | Optional (DuckDuckGo used as free fallback) |
| `LLM_PROVIDER` | Set to `gemini` | Optional |

---

## API Endpoints

| Method | Endpoint | What It Does |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/research` | Start a new research run — body: `{ "query": "your topic" }` |
| `GET` | `/api/research/:id` | Get run status, progress, sub-questions, and completed report |
| `GET` | `/api/research/:id/sources` | Get all discovered sources (filter with `?type=scholar` or `?type=web`) |
| `GET` | `/api/projects` | List research project workspaces |
| `POST` | `/api/projects` | Create new workspace |

---

## Frontend Features

| Feature | Description |
|---|---|
| **Live Pipeline Tracker** | 7-stage animated progress indicator (Planning → Searching → Ingesting → Synthesizing → Completed) |
| **Real-time Telemetry** | Shows total sources found, Google Scholar count, processing status live |
| **2-3 Page Paginated View** | Simulates a printed document with page headers, footers, and visual page breaks |
| **Continuous Reading View** | Full scrollable markdown document |
| **Table of Contents Sidebar** | Auto-generated from report headers — click to jump to section |
| **Print to PDF** | Native browser print with dedicated `@media print` stylesheet |
| **Download Markdown** | Saves full report as `.md` file |
| **Source Explorer Tab** | Filter by Google Scholar / arXiv / Wikipedia / Web, search by author/domain |
| **Responsive Design** | Works on desktop and mobile |

---

> [!TIP]
> If Gemini API is rate-limited or unavailable, the system has full offline fallbacks — it will still complete the entire pipeline and generate a comprehensive 2-3 page report using its built-in high-quality template engine. No external dependency is strictly required to run.
