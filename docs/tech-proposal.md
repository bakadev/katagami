# Collaborative Markdown Editor — Tech Proposal

> **Status:** Draft v1 — for alignment before implementation
> **Audience:** Frontend developer (you) + future collaborators
> **Research basis:** [mist-research.md](./research/mist-research.md) and [hackmd-research.md](./research/hackmd-research.md)

---

## 1. What We're Building

A browser-based collaborative Markdown editor with:

- Live split-view preview
- Real-time multi-user editing with visible cursors
- Text-anchored commenting with threads and resolve state
- Persistent documents (no auto-expiry)
- User accounts with OAuth login
- Shareable links with permission levels

The product sits in the HackMD/Mist space: Markdown-native, developer-friendly, no lock-in (every doc is a real `.md` file), but with production-grade persistence, auth, and access control.

---

## 2. MVP Feature Set

These 12 features are the "feels credible" baseline. Anything less and users will churn to HackMD; anything more can wait for roadmap.

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Split-view editor with live preview** | Editor left, rendered preview right, synchronized scroll. Resizable divider. |
| 2 | **Real-time co-editing + cursor presence** | Multiple users, labeled cursors, conflict-free (via Yjs CRDT). |
| 3 | **Three-mode view toggle** | Edit / Split / Preview. "Split" is default. |
| 4 | **CommonMark + GFM** | Tables, task lists, fenced code blocks with syntax highlighting, inline code. |
| 5 | **Mermaid diagrams** | Highest-value diagram format; covers ~80% of technical docs. |
| 6 | **Text-anchored comments** | Select text → comment → sidebar thread with highlight in document. |
| 7 | **Resolvable comment threads** | Replies, "resolve" state. Resolved stays in history, hidden by default. |
| 8 | **Per-doc permissions** | Private / link-accessible / public. Read and write independently settable. |
| 9 | **Version history** | Auto-snapshots with timestamps, view + restore. Start with last 20 versions. |
| 10 | **OAuth login** | GitHub + Google. Email+password as fallback if needed. |
| 11 | **Markdown export** | One-click `.md` download. Users must never feel locked in. |
| 12 | **Read-only share link** | Public URL that renders the document view-only. |

### Must-haves added beyond HackMD's baseline

Two items that Mist's research flagged as production blockers — these go in MVP, not roadmap:

- **WebSocket reconnection with exponential backoff.** Mist's custom Yjs provider silently fails on disconnect. We'll use the official `y-websocket` provider which handles this.
- **Dark mode.** Our target audience (developers) expects this. It's cheap with Tailwind and the editor libraries we're picking both support theming natively.

---

## 3. Recommended Tech Stack

Explanations for every non-frontend dependency included — you should know what it is and why it's there before we commit to it.

### 3.1 Frontend (your home turf)

| Dependency | Role | Why this one |
|---|---|---|
| **React 19** | UI framework | Best ecosystem for editor libraries below. |
| **Vite** | Build tool / dev server | Fast HMR, zero config. |
| **TypeScript** (strict) | Type safety | Non-negotiable for an app with this many moving parts. |
| **TailwindCSS 4** | Styling | Both Mist and the community standard. |
| **TipTap 3** | Rich-text editor (headless) | Built on ProseMirror. Has first-party `Collaboration` + `CollaborationCaret` extensions for Yjs. Proven in Mist. |
| **Yjs** | CRDT — the shared data layer | Industry standard for real-time collab editing. Used by both HackMD and Mist. |
| **y-websocket** (client) | WebSocket provider for Yjs | Official provider with reconnection, offline queueing. Drop-in replacement for Mist's custom provider. |
| **markdown-it** + plugins | Markdown → HTML for preview | More extensible than `marked` (HackMD uses this). Mermaid, KaTeX, emoji all integrate cleanly. |
| **DOMPurify** | HTML sanitizer | XSS protection for rendered Markdown. **Non-negotiable** — user content flows into the DOM. |
| **Mermaid** | Diagram rendering | Loads lazily; only hits the bundle when a `mermaid` code block appears. |
| **highlight.js** or **Shiki** | Code syntax highlighting | Shiki gives VS Code-accurate themes but is heavier. Start with highlight.js. |
| **Radix UI** | Unstyled accessible primitives | Dialogs, dropdowns, tooltips. Keeps a11y correct without custom work. |

### 3.2 Backend — the parts outside your comfort zone

Each item explained from zero. If you've never touched it, read these.

| Dependency | What it is (plain English) | Why we need it | Category |
|---|---|---|---|
| **Node.js** | The runtime that executes JavaScript on a server (not in a browser). Think "the engine that runs your `.ts` files when they're not in a browser." | We need a server process to handle WebSocket connections, serve API endpoints, and talk to the database. | Runtime |
| **Fastify** | A web framework for Node.js — the thing that turns "server, please reply to HTTP requests" into code. Alternative to Express; faster and more modern. | Serves our REST API (`POST /docs`, `GET /docs/:id`, etc.) and mounts the WebSocket handler. | Web framework |
| **y-websocket server** | A small Node.js server that speaks the Yjs sync protocol over WebSockets. Clients connect to it, it relays CRDT updates between them, and persists the document blob. | This is what makes real-time collaboration actually work — it's the thing between browsers. In Mist, a Cloudflare Durable Object played this role; we're using the open-source equivalent. | Realtime sync |
| **PostgreSQL** | A relational database. Stores structured data: users, documents, comments, permissions, etc. | We need durable storage for document metadata, users, comment threads, and version snapshots. Yjs document *content* also lives here (as a binary blob per document). | Database |
| **Prisma** | A TypeScript ORM — it lets you write database queries in TS with autocomplete instead of raw SQL. Generates types from your schema. | Keeps the database layer type-safe and feels "frontend-ish" for CRUD work. Alternative: Drizzle (lighter, more SQL-y). | ORM |
| **Redis** | An in-memory key-value store. Very fast. Used as a message bus / cache, not as primary storage. | Needed *only if* we want to run multiple backend instances behind a load balancer — Redis is how they coordinate so clients connected to different servers see each other's edits. **Skip for MVP** — a single Node process can easily handle dozens of concurrent docs. Add later if we need to scale horizontally. | Pub/sub (optional) |
| **Lucia** or **Auth.js (NextAuth)** | A library that handles "user logs in with GitHub, we create a session, the session sticks around." | We don't want to build auth from scratch. Lucia is lightweight and framework-agnostic; Auth.js is more opinionated but more batteries-included. | Auth library |

### 3.3 Infrastructure — where it runs

| Item | What it is | Why |
|---|---|---|
| **Fly.io** or **Railway** | Platforms that host Node apps. You push code, they run it with a public URL. Think "Vercel for backends." | We need somewhere to run the Node server + WebSocket server persistently (Vercel can't do long-lived WebSockets cheaply). Both platforms bundle Postgres. Either works; Fly.io has cheaper persistent workloads. |
| **Managed Postgres** (Fly/Railway/Supabase/Neon) | Hosted Postgres so we don't run a database ourselves | One less thing to break. |
| **S3-compatible object storage** (Cloudflare R2, Backblaze B2, or AWS S3) | Blob storage for file uploads — images pasted into documents, etc. | Storing images in Postgres is impractical at scale. **Defer until we add image upload (roadmap).** |

### 3.4 Dev tooling

| Tool | Role |
|---|---|
| `vitest` | Test runner (unit + integration) — same as Mist. |
| `@testing-library/react` | Component tests. |
| `playwright` | End-to-end tests for the critical collab flow. |
| `eslint` + `typescript-eslint` | Linting. |
| `prettier` | Formatting. |

---

## 4. Architecture

```
Browser                                    Server (Fly.io / Railway)
  |                                            |
  |-- React SPA  (TipTap + Yjs)                |
  |     |                                      |
  |     |-- REST API calls ----------> Fastify HTTP server
  |     |                                      |-- Auth (Lucia)
  |     |                                      |-- REST endpoints: /docs, /users, /comments
  |     |                                      |-- Prisma ----> PostgreSQL
  |     |
  |     `-- WebSocket ---------------> y-websocket server (same Node process)
  |                                            |-- Yjs room per document
  |                                            `-- Persists Y.Doc binary to Postgres
  |
```

**Data flow for an edit:**

1. User types → TipTap records the change → Yjs encodes a CRDT update.
2. `y-websocket` client sends the update over WebSocket.
3. Server `y-websocket` handler applies it to the server-side `Y.Doc`, persists the binary state to Postgres (debounced — say every 2s of idle), and broadcasts to all other connected clients.
4. Other clients receive the update, apply it to their local `Y.Doc`, TipTap re-renders.

**Single deploy.** One Node process handles both REST and WebSocket traffic — same port, same process. We don't need microservices at MVP scale.

### 4.1 What we borrow from Mist

- **CriticMarkup approach for suggestions.** Mist encodes tracked-changes (`{++addition++}`, `{--deletion--}`) directly in the Markdown. The file stays self-contained. The CriticMarkup implementation in Mist is MIT-licensed and well-isolated — we can lift the 5 relevant files (`app/lib/critic-*.ts`) as a starting point.
- **TipTap + Yjs integration pattern.** Mist's editor setup (Collaboration extension, CollaborationCaret, custom extensions) is solid. We copy the pattern, not the code verbatim.
- **Thread serialization to YAML frontmatter.** Mist stores thread metadata in YAML frontmatter on export. Lets the `.md` file round-trip through other tools without losing comments. Worth keeping.

### 4.2 What we borrow from HackMD

UX patterns (not code — HackMD is closed source):

- **Three-mode view toggle** in the toolbar, always visible, "Split" default.
- **Floating selection toolbar** — select text, see comment/suggest/copy-link/format buttons directly above the selection.
- **Comment sidebar with synchronized scroll** — comments in a right panel (not inline), clicking jumps to the anchored text.
- **Overlapping-highlight stacking** — darker shade for stacked comment threads on the same text; click to cycle.
- **Hide vs. Resolve** as two distinct end states for a comment, both reversible, both preserved for audit.
- **Paragraph permalinks** — every heading/paragraph gets a stable anchor link.

### 4.3 What we explicitly avoid

- **Auto-expiring documents.** Docs live until deleted by owner. Simpler than Mist; matches user expectation.
- **Cloudflare-only deployment.** We're building portable Node — runs on Fly, Railway, a VPS, your laptop. Cloudflare Pages would still work for the static frontend if we want edge caching, but nothing in the backend depends on Workers, Durable Objects, or the Cloudflare Agents SDK.
- **Anonymous-only access** (Mist's model). Auth from day one. Anonymous link-access is a permission level, not the only mode.

---

## 5. Addressing Your Specific Concerns

### 5.1 "I don't like that Mist docs auto-expire"

Good news: **it's a 3-file change in Mist, and we're not copying that code anyway.** Mist implements expiry via a Cloudflare Durable Object alarm — completely absent in our stack. Documents persist in Postgres indefinitely. Delete is an explicit user action.

See `mist-research.md §5` for the exact files/functions.

### 5.2 "I'm not sure about all the Cloudflare dependencies"

**Mist uses exactly two Cloudflare products:**

1. **Cloudflare Workers** — their entire server runs at Cloudflare's edge. We replace this with a normal Node/Fastify server on Fly.io or Railway.
2. **Cloudflare Durable Objects** (via the `agents` SDK) — state per document, WebSocket lifecycle, built-in SQLite, scheduled alarms. We replace this with a `y-websocket` server backed by Postgres.

**Our stack uses zero Cloudflare products by default.** Optional later: you *could* host the static frontend on Cloudflare Pages for edge caching, but nothing depends on it. The backend is portable Node — runs on any Linux box.

**Why this matters for you:** No vendor lock-in. If Fly.io's pricing changes, we move to Railway in an afternoon. If we want to self-host on a VPS, `docker compose up` works. That's not true of Mist's architecture.

---

## 6. Out of Scope for MVP (Roadmap)

In rough priority order:

1. **LaTeX / KaTeX math** — cheap add, high value for researchers.
2. **PDF export** — high request volume; needs server-side rendering (Puppeteer).
3. **Full-text search** — Postgres `tsvector` gets us surprisingly far before needing Elasticsearch/Meilisearch.
4. **Image upload** — pull in S3-compatible blob storage (R2 or B2).
5. **Team workspaces** — shared namespaces; requires reworking the permissions model.
6. **GitHub sync** — bidirectional Git sync. Popular; complex.
7. **Suggest Edit / tracked changes** — we get this partly for free by borrowing Mist's CriticMarkup system.
8. **Offline editing** — service worker + local IndexedDB Y.Doc persistence. Yjs supports this natively.
9. **Slide/presentation mode** — Reveal.js integration.
10. **MCP server** — let Claude/other agents interact with documents directly. On-trend for 2026.
11. **SSO (SAML/OIDC)** — only when chasing enterprise.

### Scaling concerns (not features, but worth noting)

- **Redis pub/sub** — add when we need >1 backend instance. Single Node handles hundreds of concurrent docs; we won't need this for a long time.
- **Dedicated WebSocket server** — currently the WS and REST servers are one process. If one gets chatty, split them.
- **CDN for static assets** — Cloudflare Pages, Vercel, Fastly — any of them work when we get traffic.

---

## 7. Open Questions

Things I'd want to pin down before implementation starts:

1. **Target audience.** Developers (like HackMD)? General writers? This shifts the diagram-extension priority (Mermaid vs. math vs. neither).
2. **Public signup, invite-only, or self-hosted?** Affects auth scope and rate-limiting priority.
3. **Business model.** Even if it's "free forever for now," knowing whether we might charge later affects architecture (team workspaces as a future concept, usage metering, etc.).
4. **Comment storage strategy.** Mist stores threads in the Yjs doc itself (syncs for free, lost if doc deleted). HackMD stores them separately in Postgres (permanent, needs explicit sync). **I lean toward hybrid: live thread state in Y.Doc for real-time, snapshotted to Postgres on every change for persistence.** Worth discussing.
5. **Editor library commitment.** TipTap is the right call given Mist's precedent and the React ecosystem — but CodeMirror 6 (what HackMD/HedgeDoc uses) is also strong and better for pure Markdown-source editing. TipTap handles the WYSIWYG-ish "inline markdown decorations" experience Mist has, which I think is the better UX. Flagging in case you have a preference.

---

## 8. Suggested First Steps

In order, before writing production code:

1. **Agree on scope.** Pin down the 12 MVP features and any must-haves I missed.
2. **Pick the non-frontend tools** you're comfortable with. Lucia vs Auth.js. Prisma vs Drizzle. Fly vs Railway. These are minor but worth a 10-minute decision each.
3. **Spike the hardest part first.** Build a bare-bones "two browsers edit the same doc over WebSocket" demo with React + TipTap + Yjs + `y-websocket`. This is the ~60% of the risk of the entire project. A weekend should get you there.
4. **Then layer in:** auth → persistence → commenting → permissions → version history. In that order.
5. **Defer UI polish.** Get the mechanics working first. The floating selection toolbar and sidebar are the last 20% of MVP, not the first.

---

## Appendix: Files in This Docs Folder

- `tech-proposal.md` (this file)
- `research/mist-research.md` — full findings on Mist (open source, code review)
- `research/hackmd-research.md` — full findings on HackMD (paid product, feature review)
