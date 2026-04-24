# Mist Research Notes

**Source:** https://interconnected.org/home/2026/02/12/mist  
**Repo:** https://github.com/inanimate-tech/mist  
**Researched:** 2026-04-23

---

## 1. What Mist Is

Mist is a browser-based, real-time collaborative Markdown editor built by Matt Webb (blog: Interconnected). It sits in the gap between GitHub Gist (static, single-user) and Google Docs (collaborative, but not Markdown-native). Documents are public by URL, require no account, and auto-delete after 99 hours.

**Author's stated goals and philosophy:**

- Markdown is becoming a first-class format for AI prompts, engineering docs, and content — it deserves Google Docs-style collaboration.
- Tools don't need huge audiences to justify building them. Mist was built over a weekend using Claude Code with ~50 commits.
- The source of truth for a document should remain in users' own systems (blogs, repos, note apps). Mist is a temporary collaboration layer, not a platform.
- Everything important stays in the `.md` file itself. Comments and suggested changes are encoded using [CriticMarkup](https://criticmarkup.com/) syntax so the file is self-contained — no separate comment database.
- Ephemeral by design: the 99-hour expiry is a feature, not a limitation, emphasizing quick collaboration over permanent storage.

---

## 2. Architecture at a Glance

```
Browser (React + TipTap + Yjs)
    |
    | WebSocket  (/agents/document-agent/:docId)
    |
Cloudflare Worker (workers/app.ts)
    |-- React Router 7 SSR request handler  (page renders)
    |-- routeAgentRequest()                 (WebSocket upgrade + agent routing)
         |
         DocumentAgent (agents/document.ts)
             -- extends Cloudflare Agents SDK Agent class
             -- one instance per document ID (Durable Object under the hood)
             -- holds in-memory Y.Doc (Yjs document)
             -- persists Y.Doc binary state to built-in SQLite (Durable Object storage)
             -- relays Yjs sync messages between connected clients
             -- stores comment threads as JSON strings in a Y.Map (replicated to all clients)
             -- schedules its own deletion alarm for TTL expiry
```

**Data flow for a new edit:**
1. User types → TipTap intercepts → Yjs records the change as a CRDT update.
2. `YjsProvider` (custom WebSocket bridge in `app/lib/yjs-provider.ts`) sends binary sync message to the Worker.
3. `DocumentAgent.onMessage()` decodes the message, applies it to the server-side `Y.Doc`, persists to SQLite, and broadcasts to all other connected clients.
4. Other clients' `YjsProvider` receives the broadcast and applies it to their local `Y.Doc` → TipTap re-renders.

**Where things run:**
| Concern | Where |
|---|---|
| Page HTML | Cloudflare Worker (SSR via React Router) |
| Real-time sync | Cloudflare Durable Object (`DocumentAgent`) |
| Document state | In-memory Y.Doc + SQLite inside the Durable Object |
| Comment threads | Y.Map inside the same Y.Doc (synced to all clients) |
| Static assets | Cloudflare Workers / Pages asset serving |
| Analytics | Fathom (optional, external) |

---

## 3. Tech Stack Inventory

### Frontend

| Dependency | Version | What it is | Role in Mist | Replaceable? |
|---|---|---|---|---|
| `react` | 19.1.1 | UI library | All UI components | Yes — Vue, Svelte, etc. |
| `react-dom` | 19.1.1 | React DOM renderer | Browser rendering | Paired with React |
| `react-router` | 7.10.0 | Full-stack React framework (formerly Remix) | SSR, routing, form actions | Yes — Next.js, SvelteKit, plain Vite |
| `@tiptap/*` | 3.0.0 | Headless rich-text editor built on ProseMirror | The entire editing surface; collaboration, marks, extensions | Yes — CodeMirror 6, Milkdown, Lexical |
| `yjs` | 13.6.29 | CRDT library for collaborative data structures | The conflict-free shared document model — single source of truth for editor state and threads | Yes — Automerge, but deep replacement |
| `y-protocols` | 1.0.7 | Yjs wire protocol helpers | Encodes/decodes sync and awareness messages over WebSocket | No (paired with Yjs) |
| `@radix-ui/*` | various | Unstyled, accessible UI primitives | Dropdowns, toggles, dialogs in the UI | Yes — Headless UI, Ark UI |
| `tailwindcss` | 4.1.13 | Utility-first CSS framework | All styling | Yes |
| `marked` | 17.0.1 | Markdown-to-HTML parser | Renders the live preview pane | Yes — markdown-it, remark |
| `dompurify` | 3.3.3 | HTML sanitizer | Sanitizes `marked` output before injecting into DOM | Strongly recommended regardless |
| `yaml` | 2.8.2 | YAML parser/serializer | Reads and writes YAML frontmatter for thread serialization | Yes — js-yaml |
| `fathom-client` | 3.7.2 | Privacy-friendly analytics SDK | Optional page-view tracking | Yes — Plausible, PostHog, or omit entirely |

### Backend / Infra

| Dependency | What it is | Role in Mist | Category | Replaceable? |
|---|---|---|---|---|
| `wrangler` | Cloudflare's CLI and build tool — think "the deployment toolchain for everything Cloudflare" | Builds, previews, and deploys the Worker; generates TypeScript types for bindings | Infra tooling | Only if you leave Cloudflare entirely |
| `@cloudflare/workers-types` | TypeScript types for Cloudflare Worker APIs | Type safety for `env`, `DurableObjectStub`, `ExecutionContext`, etc. | DevDep / infra | Only if you leave Cloudflare |
| `@cloudflare/vite-plugin` | Vite plugin that makes local dev emulate the Cloudflare Workers runtime | Enables `npm run dev` with full Durable Object + SSR emulation | Infra tooling | Only if you leave Cloudflare |
| `agents` (Cloudflare Agents SDK) | Cloudflare's higher-level SDK wrapping Durable Objects with WebSocket lifecycle hooks (`onConnect`, `onMessage`, `onClose`) and SQLite access | `DocumentAgent` extends `Agent` from this package — it handles all WebSocket connection management and provides the SQLite API | Backend library | Replaceable with raw Durable Object code + a WebSocket framework like PartyKit, or a Node.js WebSocket server |

### Dev tooling

| Tool | Role |
|---|---|
| `vite` 7.1.7 | Build tool / dev server |
| `vitest` 4.0.18 | Test runner (unit + integration) |
| `@testing-library/react` | Component testing utilities |
| `eslint` 9.39.2 + `typescript-eslint` | Linting |
| `typescript` 5.9.2 | Type checking (strict mode) |
| `vite-tsconfig-paths` | `~` import alias resolution |

---

## 4. Cloudflare Footprint

Mist uses **two Cloudflare products**. It is a lean Cloudflare setup — no R2, no D1, no KV, no Pages, no CDN configuration beyond what Workers provides by default.

### 4.1 Cloudflare Workers

**What it is:** A serverless edge-compute platform that runs JavaScript/TypeScript in V8 isolates globally, without a traditional server.

**Why Mist uses it:** It is the entire server. The Worker (entry point `workers/app.ts`) handles all HTTP requests — SSR page rendering via React Router and WebSocket upgrades for collaboration. There is no separate API server, no Node.js process, no container.

**What it would take to replace with non-Cloudflare:**

You would need a Node.js (or Bun/Deno) server running React Router in SSR mode. React Router 7 supports Node.js out of the box — you'd swap the `@cloudflare/vite-plugin` for a standard Vite setup and run the server on any host (Fly.io, Railway, a VPS, AWS Lambda, Vercel). The `@cloudflare/vite-plugin` and `wrangler` toolchain get removed. The `cloudflare.server.ts` context bridge (which passes `env` and `ctx` into the React Router context) would be replaced with a standard `process.env` / Express-style request context. Estimated effort: **medium** — mostly build config changes, plus the Durable Object replacement below.

### 4.2 Cloudflare Durable Objects (via Agents SDK)

**What it is:** Durable Objects are Cloudflare's strongly-consistent, stateful compute units. Each object has a unique ID, runs in a single location globally, and has its own persistent SQLite storage. They are the only way to hold mutable shared state at the edge without an external database.

**Why Mist uses them:** `DocumentAgent` (one instance per document) is a Durable Object. It holds the canonical in-memory Yjs document, handles all WebSocket connections for a given doc, persists Yjs state to built-in SQLite, and schedules its own expiry alarm. The Cloudflare Agents SDK (`agents` package) wraps the Durable Object API with convenient `onConnect`/`onMessage`/`onClose`/`alarm` hooks.

**What it would take to replace:**

This is the most significant Cloudflare dependency. The Durable Object provides three things that all need alternatives:

| Durable Object capability | Non-Cloudflare alternative |
|---|---|
| Single-writer stateful process per document (prevents sync conflicts) | A Node.js WebSocket server with in-memory state per room — e.g., [PartyKit](https://partykit.io) (hosted), [y-websocket](https://github.com/yjs/y-websocket) server (self-hosted), or a custom WebSocket server on Fly.io/Railway |
| SQLite persistence built into the object | A regular database: PostgreSQL, SQLite via Turso/LibSQL, Redis. Yjs state is just a binary blob — one row per document. |
| Scheduled alarm for document expiry | A cron job, a database TTL, or a background worker using `pg_cron` / Redis `EXPIRE` / Upstash QStash |

The `agents` SDK package is tightly coupled to Cloudflare — you cannot use it outside Workers. All the `Agent` base class methods (`this.sql`, `this.ctx.getWebSockets()`, `this.ctx.setAlarm()`) are Cloudflare-specific APIs. Replacing the Durable Object means rewriting `agents/document.ts` as a room-based WebSocket server. The Yjs protocol logic itself is portable and can be reused directly.

**Estimated effort to go fully non-Cloudflare:** **Large** for the Durable Object replacement, **medium** for the Worker → Node.js migration. The frontend code is completely independent of Cloudflare.

---

## 5. Auto-Expire Behavior

### Where it is implemented

**File:** `agents/document.ts` — `DocumentAgent` class

**Mechanism:** Cloudflare Durable Object alarms. When a document is created (via the HTTP POST handler in `DocumentAgent`), the code calls `this.ctx.storage.setAlarm(Date.now() + DOCUMENT_TTL_MS)`. When the alarm fires, the Durable Object runtime calls `DocumentAgent.alarm()`.

**The `alarm()` method:**
1. Deletes all rows from the SQLite `document_state` table.
2. Closes all open WebSocket connections with code 1000.
3. Destroys the in-memory Yjs document and awareness instance.

**The TTL constant:** `DOCUMENT_TTL_MS` is defined in `app/shared/constants.ts` (shared between client and server). Based on the stated 99-hour expiry, this is `99 * 60 * 60 * 1000` ms.

The client-side countdown display is in `app/routes/docs.$id.tsx` — function `formatRemainingTime(createdAt: number)` calculates remaining time using the same `DOCUMENT_TTL_MS` constant and renders it in the document header.

### Is it easily removable?

**Yes — it is well-isolated.** To remove auto-expiry:

1. **`agents/document.ts`:** Delete the `alarm()` method entirely. Remove the `this.ctx.storage.setAlarm(...)` call from the POST handler.
2. **`app/routes/docs.$id.tsx`:** Remove the `formatRemainingTime()` function and the expiry countdown from the header UI.
3. **`app/shared/constants.ts`:** Remove `DOCUMENT_TTL_MS`.

No other code depends on the alarm mechanism. The Yjs persistence, WebSocket handling, and comment storage are all unaffected. This is a 3-file change with no architectural consequences.

---

## 6. Collaboration Mechanism

### CRDT Library

**Yjs** (`yjs` v13.6.29) is the CRDT library. Yjs implements a CRDT called YATA (Yet Another Transformation Approach). Documents are represented as shared data structures — in Mist, the editor content is a `Y.XmlFragment` (manipulated by TipTap's Collaboration extension) and threads are a `Y.Map<string>`.

### How sync works end-to-end

1. Client connects via WebSocket to `/agents/document-agent/:docId`.
2. Custom `YjsProvider` (`app/lib/yjs-provider.ts`) sends Yjs sync step 1 (a state vector).
3. `DocumentAgent.onConnect()` responds with sync step 1 + step 2 (the full document diff) plus current awareness states.
4. On each subsequent edit, `YjsProvider` sends binary-encoded Yjs update messages.
5. `DocumentAgent.onMessage()` decodes with `y-protocols/sync`, applies the update to the server Y.Doc, persists the new state to SQLite, and calls `broadcastBinary()` to relay to all other connections.

**Important caveat:** The `YjsProvider` has **no reconnection logic**. If the WebSocket drops, the client does not automatically reconnect. This is a notable gap for production use.

### Presence / Cursor Sync

Presence uses **`y-protocols/awareness`**. Each client creates a local `Awareness` instance. User metadata (a randomly generated name like "User 342" and a color) is stored in the awareness state. On connect, `DocumentAgent` broadcasts all current awareness states. The TipTap editor renders remote cursors via the `CollaborationCaret` extension, configured with the awareness instance. There is no persistent identity — users are anonymous with random names per session.

### Comment Storage

Comments use a **two-layer approach**:

1. **In the document text:** Comment anchors are stored as CriticMarkup syntax (`{>>comment text<<}` and `{==highlight text==}`) directly in the TipTap/Yjs document as custom marks (`CriticComment`, `CriticHighlight`). This means comment anchors are part of the collaborative document content and sync via Yjs like any other edit.

2. **Thread metadata** (author, timestamp, replies, resolved status): Stored in a `Y.Map<string>` named `"threads"` inside the same Yjs document (`app/lib/useThreads.ts`). Each entry is a JSON-stringified `ThreadData` object. This also syncs in real-time to all clients via Yjs.

3. **On file export:** Threads are serialized into YAML frontmatter at the top of the `.md` file (`app/lib/thread-serialization.ts`), under `fm.mist.threads`. On import, `deserializeThreads()` extracts them back. This makes the `.md` file self-contained.

Comments are **not stored in the Cloudflare SQLite** separately — they live in the Yjs document binary blob that gets persisted to SQLite as a single binary update.

---

## 7. Features Present

- [x] Real-time multiplayer editing (Yjs CRDT, no conflict resolution needed manually)
- [x] Live Markdown preview (via `marked` + `dompurify`, toggled by click/hover/keypress)
- [x] Inline Markdown decorations (formatting characters shown greyed-out, not stripped)
- [x] Suggest mode / tracked changes (CriticMarkup: additions, deletions, substitutions)
- [x] Accept / reject individual suggestions
- [x] Accept all / reject all suggestions
- [x] Threaded comments with text highlighting anchors
- [x] Comment replies
- [x] Comment resolution (mark resolved/unresolved)
- [x] Collaborative presence / remote cursors (anonymous, random usernames and colors)
- [x] Connection status indicator
- [x] URL-based sharing (no account required)
- [x] Document creation with demo content
- [x] Drag-and-drop `.md` file upload
- [x] `curl /new -T file.md` CLI upload
- [x] Thread round-trip via YAML frontmatter (export/import with comments intact)
- [x] Dark / light / auto theme
- [x] Auto-expiry countdown in UI
- [x] Onboarding banner (synced across clients via Yjs shared state)
- [x] Mobile-responsive layout (separate `MobilePanel` component)
- [x] Optional Fathom analytics integration
- [x] MIT license

---

## 8. Features Missing

For a production collaborative editor with commenting, you would need to add:

- **Authentication / identity** — Mist has zero auth. There are no user accounts, no persistent identity. Random usernames per session. You would need OAuth (Google, GitHub), email magic links, or similar.
- **Persistent documents** — The 99-hour expiry is a design choice, not a limitation of the tech. Removal is straightforward (see §5), but you'd want explicit document management (list, rename, delete, ownership).
- **Document list / dashboard** — No concept of "my documents". Access is purely by knowing the URL.
- **Access control** — All documents are public to anyone with the URL. No private docs, no invite-only, no read-only share links.
- **WebSocket reconnection** — `YjsProvider` has no reconnect logic. A dropped connection silently stops syncing. Production use requires exponential backoff reconnection (standard in `y-websocket`).
- **Offline support** — No offline editing or sync-on-reconnect beyond what Yjs inherently provides.
- **Notifications** — No email or in-app notifications when someone replies to a comment or resolves a thread.
- **Named / colored users tied to identity** — Current awareness uses random "User NNN" names. Real users need persistent names and avatars.
- **Document history / versioning** — No undo history beyond the current session, no named snapshots or version diff view.
- **Search** — No full-text search across documents.
- **Images / file attachments** — Markdown only; no image upload or file embedding.
- **Keyboard shortcuts documentation** — No visible shortcut reference.
- **Rate limiting / abuse protection** — No rate limiting on document creation or uploads.

---

## 9. Code Quality / License

**License:** MIT (Copyright 2026 Matt Webb). Fully open source, commercially usable, forkable without restriction.

**Code organization:** Clean and well-structured for a weekend project.
```
agents/          — DocumentAgent (single file, ~200-300 lines)
app/
  components/    — 16 React UI components (one concern per file)
  lib/           — 17 modules: Yjs provider, CriticMarkup system (5 files), 
                   thread management, document context, Cloudflare bridge
  routes/        — 4 routes (home, new, docs.$id, demo)
  shared/        — constants.ts, types.ts (shared client/server)
workers/         — app.ts (entry point, ~30 lines)
tests/
  unit/          — component + lib unit tests
  integration/   — agents/document-agent.test.ts
```

**Test coverage:** Vitest with v8 coverage. The CLAUDE.md notes that "coverage thresholds increase linearly from 0% to 80% through 2026" — meaning coverage is being ramped up over time, not at 80% today. The integration test for `DocumentAgent` is notably thorough (tests sync protocol, persistence, alarms, edge cases with real Yjs clients through mock sockets). The CriticMarkup system has dedicated unit tests.

**TypeScript:** Strict mode throughout. Three `tsconfig` files: `tsconfig.json` (root), `tsconfig.node.json` (build tooling), `tsconfig.cloudflare.json` (Worker runtime). `worker-configuration.d.ts` is generated by `wrangler cf-typegen` to type the `Env` interface.

**Forkability:** High for the frontend. The entire `app/` directory — TipTap setup, CriticMarkup system, Yjs provider, UI components, thread management — is standard TypeScript/React with no Cloudflare-specific code. The Cloudflare coupling is isolated to `workers/app.ts`, `agents/document.ts`, `app/lib/cloudflare.server.ts`, and the `wrangler.jsonc` config. A motivated developer could port the backend to Node.js/PartyKit in a day or two.

**Complexity warnings:** The CriticMarkup implementation spans 5 files and is the most complex part of the codebase. The `DocumentContext.tsx` exposes 40+ properties — a sign that the context is doing a lot of work and could benefit from splitting.

---

## 10. Key Takeaways

- **The CriticMarkup approach is worth borrowing.** Encoding suggestions and comment anchors directly in the document text (as `{>>..<<}` and `{==..==}` marks) is elegant: the file is self-contained, there is no separate comment database, and comments survive copy-paste. The 5-file implementation in `app/lib/` is reasonably well-isolated and MIT-licensed.

- **The Yjs + TipTap Collaboration extension is the right call for a new editor.** Mist demonstrates that Yjs + TipTap v3's `Collaboration` and `CollaborationCaret` extensions work well together. The custom `YjsProvider` in `yjs-provider.ts` is thin (~100 lines) and shows what a minimal WebSocket bridge looks like. However, use the official `y-websocket` provider instead — Mist's custom version has no reconnection logic.

- **The Cloudflare coupling is real but contained.** If you want to avoid Cloudflare, the work is in `agents/document.ts` (replace Durable Object + Agents SDK with a WebSocket server — `y-websocket` is the obvious drop-in) and `workers/app.ts` (swap for a Node.js/Bun React Router server). The entire `app/` frontend directory is Cloudflare-free. Replacing the `agents` SDK is the hard part because it provides WebSocket lifecycle management, SQLite access, and alarm scheduling in a single API.

- **Expiry removal is trivial.** Three files, delete one method, remove one `setAlarm()` call, remove the UI countdown. Nothing else depends on it.

- **No auth, no access control, no reconnection — these are the three biggest production gaps.** Mist is explicitly designed as a temporary sharing tool. Building on it for production means adding all three from scratch; none of them have any scaffolding in the current code.

- **Thread storage via Y.Map is clever but has tradeoffs.** Storing comment thread metadata in a `Y.Map` inside the Yjs document means threads sync in real-time with zero extra infrastructure. The downside: threads are lost when the document expires (or if the Y.Map diverges from the CriticMarkup anchors in the text). For a production editor, consider a separate persistent store for thread metadata with the Yjs doc as the live sync layer only.

- **The codebase is genuinely forkable and readable.** Built in a weekend with Claude Code, but not sloppy. Strict TypeScript, one-concern-per-file component organization, real integration tests with proper mocking of the Cloudflare runtime. A frontend developer comfortable with React can read and modify the `app/` directory without understanding Cloudflare at all.
