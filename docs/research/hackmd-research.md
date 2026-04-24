# HackMD Research Report

> Research date: April 2026  
> Purpose: Inform scope and design for a new collaborative markdown editor

---

## 1. What HackMD Is

HackMD is a real-time collaborative Markdown workspace. Users create, edit, and publish Markdown documents from a browser, with no install required. The pitch is "Google Docs for developers" — frictionless sharing, live co-editing, but with full Markdown and a rich set of technical extensions (math, diagrams, code).

**Target users:**
- Developer teams writing specs, RFCs, runbooks, and post-mortems
- Open-source communities drafting docs collaboratively
- Researchers and academics (math/LaTeX support)
- Web3 / crypto communities (heavy historical user base)
- Students and educators

**Scale (self-reported):** 1M+ users, 30K teams, 170 countries, 7.7M notes created.

**Business model:** Freemium SaaS. Free tier is genuinely capable (unlimited notes, real-time co-editing). Revenue comes from Prime (individual/team) and Enterprise tiers gating power features.

**Lineage:** HackMD is proprietary. Its founders also maintain **CodiMD**, which was later community-forked as **HedgeDoc** (AGPL-3.0 open source). The OSS lineage shares architectural DNA — notably the same CRDT sync approach.

---

## 2. Core Editor Features

### Editor Modes

HackMD offers four distinct view states accessible from a toolbar:

| Mode | What the user sees |
|------|--------------------|
| **Edit** | Raw Markdown source only |
| **View** | Rendered preview only |
| **Both** (split view) | Editor left, rendered preview right, synchronized scroll |
| **Mobile** | Separate edit/view tabs optimized for small screens |

The split view is the default and signature experience. The divider between editor and preview panes is draggable.

### Markdown Extensions

Beyond CommonMark, HackMD renders:

- **Tables** — GFM-style with column alignment
- **Task lists** — `- [x]` checkboxes
- **Footnotes, definition lists, abbreviations** — via markdown-it plugins
- **Superscript / subscript** — `^sup^`, `~sub~`
- **Inserted / marked text** — `++ins++`, `==mark==`
- **Syntax-highlighted code blocks** — with optional line numbers and custom start offset
- **LaTeX / math expressions** — block `$$...$$` and inline `$...$` rendered via KaTeX (confirmed from HedgeDoc frontend deps: `katex: 0.16.33`)
- **Mermaid diagrams** — flowcharts, sequence diagrams, Gantt charts, class diagrams (confirmed: `mermaid: 11.12.3`)
- **Graphviz / Viz.js** — directed graphs via `d3-graphviz` (confirmed: `d3-graphviz: 5.6.0`)
- **PlantUML** — via `markdown-it-plantuml`
- **Vega / Vega-Lite** — data visualization (confirmed: `vega: 5.30.0`, `vega-embed`, `vega-lite`)
- **ABC notation** — sheet music rendering via `abcjs`
- **Flowchart.js** — simple flowcharts via `flowchart.js: 1.18.0`
- **CSV → table** — paste CSV and it renders as a table
- **Emoji** — `:emoji_name:` syntax, with an emoji picker (`emoji-picker-element`)
- **Fretboard** — guitar chord diagrams
- **Blockquote metadata / tags**

### WYSIWYG / Source Toggle

HackMD is primarily a source-markdown editor, not a WYSIWYG block editor. The "Both" split view is the closest analog — you write raw Markdown on the left and see the formatted output live on the right. There is no hidden-markup WYSIWYG mode (unlike Notion or Typora). This is a deliberate design choice aligned with the developer-first audience.

### Floating Toolbar (2024)

When text is selected in the editor, a floating toolbar appears above the selection. It offers quick access to: comment, suggest edit, copy paragraph link, and basic formatting shortcuts. On mobile it pins to the bottom of the screen.

### Shortcuts

HackMD offers keyboard shortcuts for common formatting (bold, italic, headers, code, etc.) as well as navigation shortcuts in the comment panel (`h` to hide a comment, `Shift+R` to resolve, `p` to pin).

### Auto-complete

The editor provides auto-complete for: emojis, code block language specifiers, headers, links, and images.

---

## 3. Collaboration Features

### Real-Time Co-Editing

Multiple users can edit the same document simultaneously. Changes from all participants are reflected in real-time with no perceptible lag under normal conditions. Conflict resolution is handled at the CRDT layer (see Section 9 for tech details) — users never see a "merge conflict" dialog.

### Cursor Presence

Collaborators' avatars appear in the top-right of the editor. Active cursors from other editors are visible inline in the editor (labeled with user avatar/name), so you can see exactly where others are typing in real time.

### Simultaneous Editors

HackMD does not publicly state a hard cap on simultaneous editors per note. The architecture (Yjs CRDT + Redis horizontal scaling) is designed to handle many concurrent users without coordination bottlenecks. Community reports suggest documents remain responsive with dozens of simultaneous editors.

### Conflict Resolution

Because HackMD (and HedgeDoc) use **Yjs** (a CRDT library), edits from multiple users are automatically merged without conflicts. There is no "last write wins" or manual conflict resolution required. Operational transforms or lock-based editing are not used.

### Built-In Chat

Each document has an in-document chat panel, allowing real-time discussion without leaving the editor or switching to Slack/Discord.

### Suggest Edit (2024)

A "suggest edit" mode lets non-owners propose changes directly in the document. Suggestions are tracked separately and can be accepted or rejected by the document owner, similar to Google Docs "suggest mode."

---

## 4. Commenting System

### How Comments Are Created

Users select text in the document and click the Comment button in the floating toolbar (or the comment icon in the sidebar). Comments can also be added without a text selection, in which case they are attached to the document-level context.

### Anchoring

Comments are **text-anchored**: the selected text is stored with the comment and displayed as a highlighted quote on the comment card in the sidebar. The corresponding text in the document receives a highlighted background. Overlapping comments on the same text create progressively darker highlight shades.

### Where Comments Appear

Comments appear in a **dedicated side panel** (right side), organized **chronologically** (newest at the bottom). The side panel is separate from the document, not inline or margin-floating. Clicking a comment in the panel automatically scrolls the document to the anchored text, and vice versa.

### Threading / Replies

Each comment is a thread root. Users can reply to any comment. Replies notify the original commenter. Multiple comments on the same highlighted text can be cycled through with repeated clicks on the highlight.

### Resolvable Comments

Yes. The Hide / Resolve system (shipped 2024):

- **Hide**: Removes comment from the visible panel but preserves it for transparency. Requires Writer role or above. Keyboard shortcut: `h`. A reason can optionally be attached.
- **Resolve**: Shortcut for hiding with the "Resolved" designation. Keyboard shortcut: `Shift+R`. Resolved comments can be reverted.
- **Unhide**: Restores a hidden comment to normal visibility.
- **Pin**: Marks a comment for follow-up. Keyboard shortcut: `p`.

Hidden/resolved comments are not deleted — they remain in the system for audit purposes.

### Guided Comments (2025)

Document owners can add a **custom prompt and quick-reply options** to their note's comment avatar. When visitors click the creator's avatar, they see the prompt and can reply with pre-set options. Comment types include: suggestion, question, encouragement. This structures async feedback without requiring free-form discussion.

### Notifications

Users receive notifications for new comments on their notes, replies to their comments, and activity on notes from teams and followed users.

### Permissions

Note admins control who can comment via the Sharing menu. Options: disabled, forbidden, owners only, signed-in users, or everyone. Disabling comments makes all existing threads invisible and blocks new ones.

### Convert to Note

Any comment can be converted to a standalone HackMD note, with the comment content, attribution, timestamp, and a reference back to the source note automatically populated.

---

## 5. Permissions / Sharing Model

### Per-Note Permissions

Each note has independent read and write access levels:

| Level | Who can access |
|-------|---------------|
| **Owner** | Only the creator |
| **Signed-in users** | Any logged-in HackMD user |
| **Everyone** | Public — no login required |

Read and write can be set independently (e.g., public read / signed-in write).

### Link Sharing

- **Secret links**: Notes can be shared via a private URL. Anyone with the link can access based on the configured permission level.
- **Expiring links** (Prime): Links can have an expiration date and usage limit.
- **Paragraph / section links**: The Copy Link floating toolbar button generates a link to a specific highlighted passage. Recipients land directly on that section.
- **Version links**: Each saved version has a permanent link that snapshots the document at that point in time.

### Team Workspaces

Teams have shared workspaces where notes are collectively owned. Team-level permissions layer on top of note-level permissions. Free tier: up to 3 team members. Prime: unlimited.

### Read-Only Publishing

Notes can be published with a custom URL for public read-only viewing — suitable for documentation sites, blog posts, or public reference documents.

---

## 6. Auth & Accounts

### Login Providers

HackMD supports multiple OAuth and password-based login options (confirmed from CodiMD/HedgeDoc OSS lineage and HackMD documentation):

- Email + password (with OTP/2FA support added in 2024)
- GitHub OAuth
- Google OAuth
- Twitter/X OAuth
- Facebook OAuth
- SAML (Enterprise only, for SSO with Okta, Azure AD, etc.)
- LDAP (available in self-hosted CodiMD / HedgeDoc; Enterprise HackMD)

### Guest Access

Guests (unauthenticated users) can view and edit notes that have been set to "everyone" permission without logging in. Commenting requires a signed-in account.

### Team / Workspace Structure

- **Personal workspace**: Notes owned by the individual account
- **Team workspaces**: Shared namespace for an organization; notes are team-owned
- Enterprise adds role-based access control (RBAC) within team workspaces

---

## 7. Version History

### What Users See

HackMD automatically saves version snapshots. Users access version history via the "Versions and GitHub Sync" panel. The history shows:

- All saved versions with timestamps
- Which users contributed to each version
- A diff view comparing any two versions
- The ability to restore any previous version

### Version Limits by Tier

| Tier | Version History |
|------|----------------|
| Free | Last 10 versions |
| Prime | Unlimited |
| Enterprise | Unlimited |

### Named Snapshots

Users can manually save a named version (checkpoint). These are permanent and persist even for free-tier users past the 10-version rolling window.

### Version Links

Each saved version has a **permanent shareable URL** (shipped April 2025). This lets collaborators reference a specific historical state of a document — useful for "here's what the spec looked like at sign-off" workflows.

### GitHub Sync

Notes can be linked to a GitHub file. Push/pull synchronizes the note with the GitHub file, turning version history into a Git-tracked record. Free tier: 20 pushes/month. Prime: unlimited.

---

## 8. Integrations

### Version Control

- **GitHub**: Bidirectional sync (push note → GitHub file, pull GitHub file → note). Supports branch selection.
- **GitLab**: Enterprise only.
- **GitHub Gist**: Import/export individual Gists.

### Cloud Storage

- **Google Drive**: Import from and export to Drive.
- **Dropbox**: Import from and export to Dropbox.

### Export Formats

| Format | Availability |
|--------|-------------|
| Markdown (.md) | All tiers |
| HTML (rendered) | All tiers |
| Raw HTML | All tiers |
| PDF | Prime and Enterprise only |
| Slide (via Reveal.js) | All tiers (view mode) |

### CLI Tool

`hackmd-cli` — a command-line tool for scripting note creation, updates, and exports. Useful for CI/CD documentation pipelines.

### Browser Extension

**HackMD-it** — available for Chrome and Firefox. Saves web pages, article highlights, and AI chat logs directly to a HackMD workspace without formatting errors.

### REST API

HackMD provides a REST API (Swagger docs at `https://api.hackmd.io/v1/docs`) covering:

- User data
- Note CRUD (create, read, update, delete)
- Team management
- Team note operations
- Rate limits: 2,000 calls/month (free), 20,000/month (Prime), unlimited (Enterprise)

Community SDKs exist in Python, C#/.NET, and Rust.

### MCP Server (2025/2026)

HackMD provides a **Model Context Protocol (MCP) server**, allowing AI agents (e.g., Claude) to interact with notes directly — creation, retrieval, and update via agent tools.

### Webhooks

Not publicly documented as a first-party feature.

### Embeds

Notes can be embedded in other pages via iframe. External media supported: YouTube, Vimeo, and other oEmbed-compatible providers.

---

## 9. Known Tech Stack

> Sources: HedgeDoc GitHub (open-source ancestor, AGPL-3.0), HackMD's public `y-socketio-redis` npm package, and publicly observable browser network behavior. HackMD's private codebase is not accessible — inferences are noted.

### Frontend

| Dependency | What it is + why you'd need it |
|------------|-------------------------------|
| **CodeMirror 6** (`@codemirror/*`) | The Markdown source editor — handles syntax highlighting, cursor, key bindings, and editor state. The core writing surface. |
| `@uiw/react-codemirror` | React wrapper for CodeMirror 6. Integrates the editor into the React component tree. |
| **React 18** | UI framework for the application shell, sidebar, and all interactive panels. |
| **Next.js 14** | React SSR/SSG framework. Handles routing, page rendering, and performance optimization. |
| **Yjs** (`yjs: 13.6.29`) | CRDT library for conflict-free real-time collaborative editing. Every keystroke produces a Yjs operation that merges deterministically with concurrent edits from other users. Non-negotiable for live co-editing without conflicts. |
| **markdown-it** + plugins | The Markdown parser that turns source text into HTML for the preview pane. The plugin ecosystem adds math, diagrams, footnotes, etc. |
| **KaTeX** | Renders LaTeX math expressions in the browser. Fast client-side math typesetting. |
| **Mermaid** | Renders Mermaid diagram syntax (flowcharts, sequences, Gantt, etc.) as SVG in the preview. |
| **Vega / Vega-Lite / vega-embed** | Renders Vega data visualization specs as interactive SVG charts. |
| **d3-graphviz** | Renders Graphviz DOT language graphs as SVG using D3. |
| **flowchart.js** | Renders a simplified flowchart DSL as SVG. |
| **abcjs** | Renders ABC music notation as sheet music in the browser. |
| **highlight.js** | Syntax highlighting for code blocks. |
| **DOMPurify** | Sanitizes rendered HTML before injecting into the DOM. Prevents XSS from untrusted Markdown content. Critical for any user-generated markdown renderer. |
| **Reveal.js** | Powers the slide/presentation mode — renders a note as a full-screen slideshow. |
| **Redux Toolkit** | Client-side state management for editor state, UI panels, and collaborative session state. |
| **i18next** | Internationalization. Supports multiple UI languages. |
| **@orama/orama** | In-browser full-text search engine. Powers client-side note search. |
| **emoji-picker-element** | The emoji picker UI component. |

### Backend (from HedgeDoc OSS, inferred for HackMD)

| Dependency | What it is + why you'd need it |
|------------|-------------------------------|
| **Node.js** | Runtime for the backend server. Handles API requests, WebSocket connections, and document sync. |
| **NestJS** (`@nestjs/*`) | TypeScript backend framework (built on Express/Fastify). Structures the API, WebSocket handlers, auth, and business logic as modules. |
| **Fastify** (`@fastify/*`) | High-performance HTTP server used under NestJS. Faster than Express for API throughput. |
| **Yjs** (`yjs: 13.6.29`) | Also runs on the backend — the server maintains the authoritative Yjs document state for initial sync and persistence. |
| **WebSockets** (`ws`, `@nestjs/websockets`) | The transport layer for real-time document updates between clients and the server. |
| **Redis** (via `y-socketio-redis`) | Acts as the pub/sub distribution channel for Yjs document updates across multiple backend instances. Enables horizontal scaling — many server nodes share state without in-memory coordination. |
| **PostgreSQL** (`pg`) | Primary relational database for persistent storage: users, notes metadata, permissions, comment threads, team memberships. |
| **MySQL** (`mysql2`) | Alternative DB driver — HedgeDoc supports both Postgres and MySQL. |
| **SQLite** (`better-sqlite3`) | Supported for single-node/development deployments. |
| **Knex** | SQL query builder / migration runner. Database-agnostic — supports Postgres, MySQL, SQLite. |
| **MinIO** (`minio`) | S3-compatible object storage client. Stores uploaded images and file attachments. Needed because storing blobs in a relational DB is impractical at scale. |
| **OpenID Connect** (`openid-client`) | Handles OAuth 2.0 / OIDC login flows for GitHub, Google, SAML SSO, etc. |
| **LDAP** (`ldapauth-fork`) | Supports enterprise LDAP/Active Directory authentication. |
| **Argon2** (`@node-rs/argon2`) | Password hashing algorithm. Modern, memory-hard — more secure than bcrypt for storing local account passwords. |
| **Zod + nestjs-zod** | Runtime schema validation for API request bodies. Ensures type safety and gives clean validation error messages. |
| **Swagger** (`@nestjs/swagger`) | Auto-generates the REST API documentation from TypeScript decorators. |

### Real-Time Sync Architecture (Confirmed from public `@hackmd/y-socketio-redis`)

HackMD uses a **Yjs CRDT + Socket.IO + Redis streams** architecture:

1. Each client runs a **Yjs document** locally and sends incremental CRDT updates over **Socket.IO** (not raw WebSockets).
2. The backend **server component** receives updates via Socket.IO and fans them out via **Redis streams** to all other connected clients for that document.
3. The server does **not** keep the full Yjs document in memory after the initial sync — only the Redis stream of incremental updates is live.
4. A separate **worker component** periodically flushes accumulated Yjs updates from Redis to persistent storage (Postgres or S3), then cleans up stale Redis data.
5. This architecture allows **horizontal scaling**: multiple server instances can run in parallel with no state coordination needed — Redis is the shared bus.

This is confirmed from HackMD's own public npm package [`@hackmd/y-socketio-redis`](https://www.npmjs.com/package/@hackmd/y-socketio-redis), which is a fork of `y-redis` replacing the WebSocket layer with Socket.IO.

---

## 10. Pricing Tiers

| Feature | Free | Prime ($5/seat/mo billed annually) | Enterprise (custom) |
|---------|------|-------------------------------------|---------------------|
| Notes | Unlimited | Unlimited | Unlimited |
| Team members | Up to 3 | Unlimited | Unlimited |
| Image upload size | 1 MB/image | 20 MB/image | 20 MB/image |
| Version history | Last 10 | Unlimited | Unlimited |
| Full-text search | No | Yes | Yes |
| PDF export | No | Yes | Yes |
| GitHub pushes | 20/month | Unlimited | Unlimited |
| GitLab integration | No | No | Yes |
| API calls | 2,000/month | 20,000/month | Unlimited |
| Custom templates | 3 | Unlimited | Unlimited |
| Trash retention | 3 days | 30 days | 30 days |
| SSO (SAML) | No | No | Yes |
| Role-based access (RBAC) | No | No | Yes |

**Key insight:** Real-time collaboration, commenting, suggest edit, and the core editor are all available on the free tier. The paid gates are primarily around: storage, search, PDF export, version depth, GitHub sync volume, and enterprise auth.

---

## 11. UX Patterns Worth Borrowing

These are specific, concrete UI/UX behaviors a competitor should study:

1. **Three-mode view toggle (Edit / View / Both)** — A clearly labeled, always-visible three-state toggle in the toolbar. Users know exactly what they are seeing at all times. "Both" is the default and teaches new users that Markdown and preview are the same document. No guessing.

2. **Floating selection toolbar** — Selecting text reveals a contextual mini-toolbar directly above the selection (or pinned to the bottom on mobile). It surfaces the four most relevant actions for selected text: comment, suggest edit, copy link, and format. This avoids cluttering the main toolbar and keeps actions close to the content they affect.

3. **Paragraph-level anchor links** — Any selected text can generate a shareable link that scrolls the reader to that exact passage. This is deeply useful in async review workflows. Teams reference specific paragraphs in Slack, Jira tickets, and PR comments without ambiguity.

4. **Comment side panel with synchronized scroll** — Comments appear in a right sidebar (not inline or in margins), organized chronologically. Clicking a comment scrolls the editor/preview to the corresponding highlighted text. This avoids the document clutter of inline comments while preserving spatial context. The double-scroll sync is a UX detail that takes real engineering.

5. **Text highlight stacking for overlapping comments** — When two comment threads anchor to overlapping text, the highlight shade gets progressively darker. Users can click to cycle through multiple comment threads on the same text. Simple and unambiguous.

6. **Hide vs. Resolve distinction** — Rather than a single "close" action, comments have two distinct end states: "hide" (custom reason, reversible) and "resolve" (semantic shortcut for "done"). Both preserve the comment for audit; neither deletes it. Keyboard shortcuts (`h` and `Shift+R`) make this fast in high-volume review sessions.

7. **Version link permalinks** — Each manually saved version gets a permanent URL. Sharing "the spec as it was on the day we shipped" is a single click. This dramatically reduces "wait, which version were we talking about?" confusion in distributed teams.

8. **Guided comment prompts** — Document owners can customize a prompt and quick-reply options on their note. Instead of an empty comment box, contributors see "What's your main question about Section 3?" with pre-set reply chips. This dramatically lowers the friction for first-time commenters and surfaces structured feedback. Worth implementing on feedback-oriented documents.

9. **Link sharing with expiration and usage limits** — When generating a share link, Prime users can optionally set an expiry date and a view count limit. This single modal turns a plain share link into a controlled, time-boxed access token without requiring account-based permissions. Extremely useful for sending a document to an external reviewer.

10. **GitHub sync as the "save to Git" affordance** — Rather than treating Git integration as an advanced export feature, HackMD surfaces it as a first-class "sync" action alongside the document's version history. This reframes Git not as a developer-only tool but as "reliable backup to a place you trust." Worth considering as an alternative to (or complement of) internal version history.

---

## 12. Must-Have Feature List for MVP

Based on what makes HackMD feel solid and complete, these features are non-negotiable for a collaborative markdown editor to feel credible:

1. **Split-view editor with live preview** — The signature experience. Editor left, rendered preview right, synchronized scroll. Without this, the tool is just a text area.

2. **Real-time co-editing with cursor presence** — Multiple users editing simultaneously with visible labeled cursors. Conflict-free via CRDT (Yjs). Without this, "collaborative" is marketing copy.

3. **View mode toggle** — Distinct Edit-only, Preview-only, and Split-view states. Clean keyboard shortcuts to toggle.

4. **CommonMark + GFM Markdown** — Tables, task lists, fenced code blocks with syntax highlighting, inline code, all standard GFM elements. The baseline users expect.

5. **Mermaid diagram rendering** — Mermaid is the single highest-value diagram extension. Flowcharts, sequence diagrams, and Gantt charts cover 80% of technical documentation needs. Non-negotiable for a developer audience.

6. **Inline / margin commenting anchored to text** — Select text → add comment → comment appears in sidebar linked to the text with a highlight. Replies. This is the async collaboration layer.

7. **Resolve / close comments** — Comments must have a done state. Without this, comment panels fill up with noise and become unusable.

8. **Per-note permission levels** — At minimum: private (owner only), link-accessible (anyone with the link), and public. Read and write should be independently settable.

9. **Version history with restore** — Auto-save snapshots with timestamps. Ability to view a past version and restore it. Even 10 versions on the free tier is enough. This is the safety net.

10. **User accounts + OAuth login** — At minimum GitHub and Google OAuth. Email/password as fallback. Without multi-provider auth, onboarding friction is too high.

11. **Export to Markdown** — One-click download of the note as a `.md` file. Users must never feel locked in. This is table stakes.

12. **Shareable read-only link** — Generate a public URL that renders the document in view-only mode for non-editors. This is how documents escape the walled garden.

---

## 13. Nice-to-Have / Roadmap Candidates

These features add significant value but can ship after the MVP is credible:

- **LaTeX / KaTeX math rendering** — Essential for researchers and academics but not needed for most developer teams in MVP.
- **PDF export** — High user request but complex to implement well (pagination, styling). A natural paid-tier feature.
- **GitHub / GitLab sync** — Extremely powerful for developer workflows; complex to implement robustly. Phase 2.
- **Team workspaces** — Shared namespace with collective note ownership. Required for team use beyond 3 people but adds auth/permission complexity.
- **Full-text search** — Searching across all notes is critical at scale but can be deferred until note volume justifies the index infrastructure.
- **Slide / presentation mode** — Reveal.js integration is beloved but niche. Great roadmap feature for differentiation.
- **Suggest Edit mode** — "Track changes" analog. High value for document review workflows; complex to implement cleanly.
- **Guided comment prompts** — Structured feedback with owner-defined prompts and quick-reply chips. High leverage for feedback-heavy use cases; medium complexity.
- **Browser extension (web clipper)** — Saves web content to the workspace. Adds stickiness; not core to the editor.
- **Offline access** — Service worker + local draft storage. High user satisfaction; non-trivial to implement correctly.
- **Dark mode** — Expected by developer audiences. Medium complexity. Strong roadmap candidate for shortly after MVP.
- **Book mode** — Organize multiple notes into a hierarchical "book" with a sidebar TOC. Excellent for documentation sites; deferred until multi-note navigation exists.
- **Vega / Graphviz / PlantUML / Fretboard** — Additional diagram types beyond Mermaid. Add as the user base diversifies.
- **MCP / AI integration** — Agentic note creation and editing via LLM. Trending in 2025–2026; can be a compelling differentiator post-launch.
- **Version link permalinks** — Permanent URLs per version. Easy to ship once version history exists; high value for external review workflows.
- **Expiring share links** — Share links with expiration dates and usage limits. Useful for controlled external access; a natural Prime-tier gate.
- **Paragraph citation links** — Links that auto-scroll to a specific highlighted passage. Requires some text-anchor bookmarking infrastructure.
- **SAML / SSO / LDAP** — Enterprise auth. Implement only when chasing enterprise deals.

---

## Sources

- [HackMD Homepage](https://hackmd.io/)
- [HackMD Pricing](https://hackmd.io/pricing)
- [HackMD Features](https://hackmd.io/features)
- [HackMD Developers](https://hackmd.io/developers)
- [HackMD Commenting Blog Post (Feb 2024)](https://hackmd.io/blog/2024/02/06/a-new-era-of-commenting)
- [Hide and Resolve Comments Docs](https://hackmd.io/@docs/hide-resolve-comment-en)
- [Guided Comments Blog Post (2025)](https://hackmd.io/@hackmd-blog/guided-comment-2025)
- [Copy Link & Floating Toolbar (Nov 2024)](https://homepage.hackmd.io/blog/2024/11/07/Copy-Link-Floating-Toolbar)
- [Version Link Feature (2025)](https://hackmd.io/@hackmd-blog/version-link-2025)
- [HackMD 2024 Year in Review](https://hackmd.io/blog/2024/12/10/celebrating-2024-hackmds-biggest-moments)
- [HackMD Changelog](https://homepage.hackmd.io/changelog)
- [HackMD API Developer Portal](https://hackmd.io/@hackmd-api/developer-portal)
- [HedgeDoc GitHub Repository](https://github.com/hedgedoc/hedgedoc)
- [HedgeDoc Frontend package.json](https://raw.githubusercontent.com/hedgedoc/hedgedoc/develop/frontend/package.json)
- [HedgeDoc Backend package.json](https://raw.githubusercontent.com/hedgedoc/hedgedoc/develop/backend/package.json)
- [@hackmd/y-socketio-redis npm package](https://www.npmjs.com/package/@hackmd/y-socketio-redis)
- [GitHub: hackmdio/y-socketio-redis](https://github.com/hackmdio/y-socketio-redis)
- [HackMD vs Google Docs blog](https://hackmd.io/@hackmd-blog/hackmd-vs-google-docs-choosing-right-tool-for-your-workflow)
- [HackMD vs Notion blog](https://hackmd.io/@hackmd-blog/hackmd-vs-notion-choosing-right-tool-for-your-workflow)
