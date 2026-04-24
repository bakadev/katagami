# Katagami — MVP Spec

> **Product name:** Katagami (Japanese: 型紙 — stencil/pattern template)
> **Repo:** `git@github-bakadev:bakadev/katagami.git`
> **Status:** Approved design — implementation planning complete
> **Date:** 2026-04-23
> **Audience:** Travis (frontend dev) + future collaborators
> **Supersedes:** `tech-proposal.md` (kept as exploratory history)
> **Research basis:** [`research/mist-research.md`](./research/mist-research.md), [`research/hackmd-research.md`](./research/hackmd-research.md)

---

## 1. What We're Building

A browser-based collaborative Markdown editor for **cross-functional spec-writing teams** — UX, content, design, strategy, BA, PM — to author spec documents together and comment on them in real time.

**The job-to-be-done:** A mixed-discipline team needs a shared place to draft and discuss spec docs that downstream engineering consumers (frontend, backend, AI integration) will eventually implement from. Today, these teams scatter across Google Docs, Notion, Slack, Figma comments, and file-share links, and the source of truth gets lost.

**Explicitly NOT in scope:** Direct handoff to coding agents (HackMD-style dev workflow). This tool lives in the "reach consensus on a spec" phase, not the "spec → code" phase.

**Deferred-but-architecturally-planned:** AI-powered text operations — select a paragraph or heading, query an LLM to revise it in place. MVP won't ship this, but the text-selection + contextual-action plumbing will be MVP-clean so it bolts on later.

---

## 2. MVP Feature Set

The baseline for a credible v1. If any of these is missing, users will churn back to Google Docs.

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Name-entry session** | No accounts. User types a display name on first visit; stored in localStorage. Name shows on cursor + comments. |
| 2 | **Create new doc** | Lands on root → "Create new doc" → URL of the new doc. Creates an implicit project; doc is the first doc in it. |
| 3 | **TipTap editor with inline Markdown decorations** | Markdown syntax stays visible but faded; formatted elements render inline (bold is bold, headers look like headers). Mist's approach. |
| 4 | **Edit / Preview toggle** | Two modes only. Edit = inline-decorated editing. Preview = pure rendered, no syntax marks. |
| 5 | **Real-time co-editing + cursor presence** | Yjs CRDT via official `y-websocket`. Labeled colored cursors, awareness states. Conflict-free. |
| 6 | **WebSocket reconnection** | Exponential backoff, offline-queue edits, resync on reconnect. Handled by `y-websocket`. |
| 7 | **CommonMark + GFM** | Tables, task lists, fenced code blocks (syntax highlighting via highlight.js), inline code, headings, emphasis, links, blockquotes, horizontal rules. |
| 8 | **Text-anchored commenting** | Select text → floating toolbar → "Comment" → sidebar thread with highlight in doc. CriticMarkup-backed. |
| 9 | **Comment replies + resolve** | Threaded replies; resolve flag. Resolved threads hide from sidebar but persist in the doc. |
| 10 | **Version history (auto-snapshot + restore)** | Periodic snapshots (debounced, every ~2 min of idle). Keep last 20. Permalink per snapshot. View and restore. |
| 11 | **Permissions by link type** | Each doc has an edit URL and a view-only URL. Which URL you arrive on determines what you can do. No auth, no comment-only link. |
| 12 | **Project → documents hierarchy (data model only)** | Every doc belongs to a project. MVP UI shows one doc per project; data model supports adding more later without migration. |
| 13 | **Markdown export** | One-click `.md` download. Comments round-trip as YAML frontmatter (Mist's approach). |
| 14 | **Dark mode + light mode** | Toggle in UI. Persists in localStorage. |

### Text-selection architecture note (for future AI)

The comment flow (select → contextual action) must be built as an extensible text-range action framework, not a comment-specific hack. A single text selection dispatches to whatever actions are registered. MVP registers one action: "Add comment." The AI feature will later register additional actions: "Revise with AI," "Summarize," etc. Designing this once saves a refactor.

---

## 3. Out of Scope for MVP (Roadmap)

Ordered by rough priority:

1. **OAuth login + user accounts** (GitHub, Google) — unlocks dashboards, doc claim, notifications.
2. **Image paste / upload** — needs S3-compatible blob storage (Cloudflare R2 or Backblaze B2). Design-oriented users will want this soon.
3. **AI text-range operations** — select text → query AI → replace. Core differentiator.
4. **Multiple docs per project (UI)** — sidebar / tree view within a project. Data model is already ready.
5. **Mermaid diagrams** — lazy-loaded, ~400KB when used.
6. **Comment-only permission link** — third link type for external reviewers.
7. **Comment storage migration** (Yjs-only → hybrid Yjs + Postgres) — enables cross-doc comment queries, email notifications.
8. **Full-text search** — start with Postgres `tsvector`; graduate to Meilisearch if needed.
9. **Team workspaces** — shared namespace with team-owned projects; requires OAuth.
10. **SaaS-ification** — billing, plans, rate limits, abuse prevention.
11. **Self-hosted deploy** — Docker Compose + configurable auth (OIDC/SAML).
12. **LaTeX / KaTeX math** — niche for this audience but cheap.
13. **PDF export** — server-side via Puppeteer.
14. **GitHub sync** — bidirectional spec-to-Git.
15. **Offline editing** — service worker + local Y.Doc persistence.
16. **Slide/presentation mode** — Reveal.js.
17. **MCP server** — let Claude/other agents read/write docs.
18. **Explicit lifecycle states** (Draft → Review → Approved) — only if users request it; otherwise version links suffice.

---

## 4. Tech Stack

Non-frontend tools include a plain-English "what is this / why we need it" note.

### 4.1 Frontend

| Dependency | Role |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool + dev server (fast HMR) |
| **TypeScript 5** (strict) | Type safety |
| **TailwindCSS 4** | Utility-first styling |
| **shadcn/ui** (latest, MCP-enabled) | Component library — copies components into the codebase rather than depending on an npm package. Built on Radix primitives. |
| **TipTap 3** | Headless rich-text editor on top of ProseMirror. `Collaboration` + `CollaborationCaret` extensions integrate Yjs. |
| **Yjs 13** | CRDT — the shared data layer for collaborative editing |
| **y-websocket** (client) | Official Yjs WebSocket provider. Handles reconnection, offline queue, awareness sync. |
| **markdown-it** + plugins | Markdown → HTML for Preview mode |
| **DOMPurify** | HTML sanitizer — **non-negotiable** (user Markdown flows into DOM) |
| **highlight.js** | Syntax highlighting for fenced code blocks |

### 4.2 Backend — the parts outside the frontend comfort zone

Each item explained from scratch.

| Dependency | What it is (plain English) | Why we need it |
|---|---|---|
| **Node.js** | The runtime that executes TypeScript/JavaScript on a server (not in a browser). | We need a server process to accept WebSocket connections, serve REST endpoints, and talk to the database. |
| **Fastify** | A web framework for Node.js — turns "server, please reply to HTTP requests" into structured code. Modern alternative to Express. | Serves the REST API (`POST /api/projects`, `GET /api/docs/:id`, etc.) and mounts the WebSocket handler on the same port. |
| **y-websocket server** | A small Node.js WebSocket server that speaks the Yjs sync protocol. Clients connect to it, it relays CRDT updates between them and persists the document blob. | This is what makes real-time collaboration actually work — the thing between browsers. Replaces Mist's Cloudflare Durable Object. |
| **PostgreSQL** | A relational database. Stores structured data (users' display names are per-session, but projects, docs, permissions, snapshots, Yjs binary state all live here). | Durable storage for everything that needs to outlive a WebSocket connection. |
| **Prisma** | A TypeScript ORM — lets you write database queries with autocomplete instead of raw SQL, and generates types from your schema. | Keeps the database layer type-safe; feels "frontend-ish" for CRUD work. |

### 4.3 Explicitly NOT in the MVP stack

- ~~Lucia / Auth.js~~ — no auth at MVP; adds in roadmap phase 1.
- ~~Redis~~ — single Node instance handles MVP scale; add when we scale horizontally.
- ~~S3 / R2 / B2 blob storage~~ — no images at MVP; add with the image-upload roadmap item.
- ~~Mermaid~~ — moved to roadmap.
- ~~Playwright~~ — no e2e at MVP; unit + component tests via Vitest + Testing Library only.

### 4.4 Infrastructure

| Item | Role |
|---|---|
| **Fly.io** (MVP deployment target) | Hosts the Node server with persistent WebSocket support. Can be revisited when we deploy. Managed Postgres bundled. |
| **Managed Postgres** | Via Fly or any S3-compatible host. One less thing to run. |

### 4.5 Dev tooling

- `vitest` — test runner (unit + integration)
- `@testing-library/react` — component tests
- `eslint` + `typescript-eslint` — linting
- `prettier` — formatting

---

## 5. Architecture

```
Browser                                        Server (Fly.io)
  |                                                |
  |-- React SPA (TipTap + Yjs + shadcn/ui)         |
  |     |                                          |
  |     |-- REST API calls ----------------> Fastify HTTP server (single Node process)
  |     |                                          |-- REST endpoints
  |     |                                          |-- Prisma ----> PostgreSQL
  |     |
  |     `-- WebSocket --------------------> y-websocket handler (same process, same port)
  |                                                |-- One Y.Doc room per document
  |                                                `-- Persists Y.Doc binary to Postgres (debounced)
```

### Data flow for a text edit

1. User types → TipTap records change → Yjs encodes a CRDT update.
2. `y-websocket` client sends the update over WebSocket.
3. Server applies to the room's `Y.Doc`, broadcasts to other connected clients, and debounce-persists the binary state to Postgres (~2s idle window).
4. Other clients receive, apply to their local `Y.Doc`, TipTap re-renders.

### Single-process deploy

For MVP, one Node process hosts the REST API and the WebSocket handler on the same port. We do **not** split into microservices. Horizontal scaling (when needed) adds Redis as a pub/sub bus between server instances — noted as a roadmap item.

### What we borrow from Mist (MIT-licensed, code-level)

- **CriticMarkup implementation** (5 files in `app/lib/`) — encodes comment anchors and tracked changes directly in the document text. The file stays self-contained.
- **TipTap + Yjs integration pattern** — Collaboration extension, CollaborationCaret setup.
- **YAML-frontmatter thread serialization** — comments round-trip through `.md` export/import.
- **Project file organization** — the `app/` structure is clean and forkable.

### What we borrow from HackMD (UX patterns, not code — HackMD is closed source)

- **Floating selection toolbar** — select text, see contextual actions above the selection.
- **Comment sidebar with synchronized scroll** — comments in a right panel, click to jump to anchor.
- **Overlapping-highlight stacking** — progressively darker shade when multiple threads anchor the same text.

### What we explicitly avoid

- **Auto-expiring docs** (Mist) — docs persist until explicitly deleted.
- **Cloudflare-only infra** (Mist) — portable Node + Postgres; no Durable Objects, no Workers, no `agents` SDK.
- **Anonymous-only access model** (Mist) — MVP is name-only, but the architecture accommodates real auth without a rewrite.
- **Dev-centric UI density** (HackMD) — audience is content/strategy/design, not developers.

---

## 6. Data Model (MVP)

```
Project
  id             uuid                primary key
  creator_token  text                opaque token stored in creator's localStorage
  created_at     timestamptz
  updated_at     timestamptz
  name           text                nullable; defaults to first doc's title

Document
  id             uuid                primary key
  project_id     uuid                fk → Project.id
  title          text                nullable; derived from first H1 if null
  yjs_state      bytea               current Y.Doc binary state
  created_at     timestamptz
  updated_at     timestamptz

Snapshot
  id             uuid                primary key
  document_id    uuid                fk → Document.id
  yjs_state      bytea               Y.Doc binary at snapshot time
  taken_at       timestamptz
  taken_by_name  text                display name of whoever was active when taken

Permission
  document_id    uuid                fk → Document.id
  level          text                'edit' | 'view' (MVP limits to these two)
  token          text                URL-safe random token embedded in the share URL
  -- URLs look like: /d/:docId?key=:token
```

### Creator token mechanics

- When a new project/doc is created, the server mints a random `creator_token`, stores it on the Project row, and returns it to the client, which persists it in `localStorage`.
- Admin actions (rename project, delete doc, rotate share URLs, delete project) require the creator token in the request header. Server verifies.
- If the creator clears localStorage, admin access is lost *from that browser*, but the doc and its share URLs still work normally.
- **Roadmap:** when OAuth ships, "claim this project" logs in, verifies the creator token, and associates the project with the authenticated user.

### Permission mechanics

- Each document has exactly two tokens: one for the `edit` URL, one for the `view` URL.
- Tokens are opaque random strings; knowing the URL = having the permission.
- Roadmap adds a third level (`comment`) and OAuth-gated links.

---

## 7. URL Structure

```
/                                        →  "Create new doc" landing page
/p/:projectId                            →  Project home (MVP: auto-redirects to the single doc)
/p/:projectId/d/:docId?key=<token>       →  Document editor; permission inferred from the key token
/api/*                                   →  REST endpoints
/ws/:docId                               →  WebSocket endpoint for Yjs sync (key passed as subprotocol or query)
```

The `key` query parameter carries the permission token (edit or view). The server validates the token against the `Permission` table on every load and on every WebSocket upgrade. The creator token is never in a URL — it lives only in the creator's localStorage and is sent as an HTTP header for admin actions.

---

## 8. MVP Permissions Matrix

| Action | Edit URL holder | View URL holder | Creator token holder |
|---|---|---|---|
| View document | ✅ | ✅ | ✅ |
| Edit document | ✅ | ❌ | ✅ |
| Add/resolve comments | ✅ | ❌ | ✅ |
| See collaborator cursors | ✅ | ✅ | ✅ |
| View version history | ✅ | ✅ | ✅ |
| Restore a version | ✅ | ❌ | ✅ |
| Delete document | ❌ | ❌ | ✅ |
| Rename project | ❌ | ❌ | ✅ |
| Rotate share URLs | ❌ | ❌ | ✅ |

---

## 9. Suggested Implementation Order

Spike the risk first. In order:

1. **Spike: real-time sync works.** Two browsers edit the same doc over Node + `y-websocket`. No UI polish, no auth, no DB persistence. Weekend.
2. **Persist to Postgres.** Debounced writes of Yjs binary state, rehydrate on server restart.
3. **Project + Document data model** via Prisma migrations.
4. **Creator token + permission tokens + URL routing.**
5. **TipTap integration with inline Markdown decorations** (port Mist's pattern).
6. **Preview mode** (markdown-it + DOMPurify + highlight.js).
7. **Text-selection action framework** — built for extensibility from day one.
8. **Commenting** (port Mist's CriticMarkup system + thread storage in Y.Map).
9. **Comment sidebar UI + synchronized scroll.**
10. **Version history** — snapshot triggered by idle detection in the y-websocket handler (no active edits for ~2 min) + restore flow.
11. **Markdown export** with YAML frontmatter comments.
12. **Dark/light mode toggle.**
13. **Polish, empty states, error states, reconnection UX.**

---

## 10. Appendix: Files in This Docs Folder

- `mvp-spec.md` — **this file**, the authoritative MVP design spec
- `tech-proposal.md` — exploratory proposal (kept for history; superseded by this doc)
- `research/mist-research.md` — research findings on Mist
- `research/hackmd-research.md` — research findings on HackMD
