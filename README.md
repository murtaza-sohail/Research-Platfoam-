# 🔬 DeepResearch AI — Autonomous Multi-Agent Academic & Web Research Platform

> Autonomous multi-stage AI research engine that queries Google Scholar, arXiv, Semantic Scholar, OpenAlex, and the open web, extracts and embeds text into vector chunks, and synthesizes 2-3 page publication-grade research monographs with numbered academic citations.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/LLM-Gemini%202.0%20Flash-orange.svg)](https://ai.google.dev)

---

## 📑 Complete Documentation & Architecture Guides

Detailed implementation plans and architecture deep dives are maintained separately in the `docs/` folder:

- 📖 **[Implementation Plan 1 — Quick Start & Project Guide](docs/IMPLEMENTATION_PLAN_1.md)**: Prerequisites, execution instructions, API endpoints, and component breakdowns.
- 🔬 **[Implementation Plan 2 — Architecture & Data Flow Deep Dive](docs/IMPLEMENTATION_PLAN_2.md)**: Complete 4-stage pipeline analysis, scraping logic, vector similarity ranking, and offline resilience strategies.

---

## 🌟 Key Features

- 🧠 **Autonomous Planning Worker**: Splits complex research prompts into 3 focused sub-investigations.
- 📚 **Dual Academic + Web Search Track**:
  - **Academic**: Google Scholar, Semantic Scholar Graph API, arXiv Preprints API, OpenAlex Catalog.
  - **Web**: DuckDuckGo Scraper, Wikipedia Knowledge Graph, and Tavily Search API.
- 📐 **Dense Vector Embeddings & Cosine Ranking**: Scrapes text, chunks into overlapping passages (600 chars / 100 char overlap), computes dense vector embeddings, and performs cosine similarity retrieval.
- 📄 **2-to-3 Page Publication-Grade Synthesis**: Synthesizes 1,600–2,500 word structured reports with methodology tables, benchmark matrices, contradictory evidence analysis, strategic roadmaps, and numbered citations (`[1]`, `[2]`).
- 🖥️ **Interactive Modern UI**:
  - 2-3 Page Paginated Monograph View (A4 Print-Ready)
  - Continuous Reading Mode
  - Sticky Table of Contents (TOC) with smooth scrolling
  - Full Academic Source Explorer with real-time search and filter tabs
  - Export to PDF (`@media print`) and Download as Markdown (`.md`)
- 🛡️ **100% Zero-Crash Architecture**: Built-in in-memory database (`MongoMemoryServer`) and in-memory queue fallback — works immediately out of the box without local MongoDB or Redis.

---

## 🏗️ System Architecture

```
User Topic Input
       │
       ▼
[Stage 1: Planning Worker] ──► Breaks query into 3 sub-investigations (Gemini 2.0 Flash)
       │
       ▼
[Stage 2: Search Worker]   ──► Parallel Scrapers & APIs (Scholar, arXiv, Semantic Scholar, DDG, Wiki)
       │                       (Discovers 20-40 verified sources)
       │
       ▼
[Stage 3: Process Worker]  ──► Content extraction, SHA-256 deduplication, 600-char chunking,
       │                       768-dim dense vector embedding (Gemini text-embedding-004)
       │
       ▼
[Stage 4: Synthesis Worker]──► Cosine similarity top-18 chunk retrieval & Gemini synthesis
       │                       (Generates 8-section report with numbered citations)
       │
       ▼
[Frontend UI]              ──► Real-time telemetry, 2-3 page document view, export to PDF/Markdown
```

---

## ⚡ Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
node index.js
```

Backend will run on **http://localhost:5000**.

### 2. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on **http://localhost:5173**.

---

## ⚙️ Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (Optional - auto falls back to in-memory MongoDB)
MONGO_URI=

# AI Provider (Strongly Recommended)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Web Search API Key
SEARCH_API_KEY=your_tavily_key_here
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/research` | Submit research prompt `{ "query": "string" }` |
| `GET` | `/api/research/:id` | Poll research run status, progress, and completed report |
| `GET` | `/api/research/:id/sources` | Fetch discovered sources (`?type=scholar` or `?type=web`) |
| `GET` | `/api/projects` | List research workspaces |

---

## 📄 License

This project is licensed under the MIT License.
