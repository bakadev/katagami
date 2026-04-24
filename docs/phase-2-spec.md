# Katagami — Phase 2 Spec: Editor UI

> **Status:** Approved design — ready for implementation planning
> **Date:** 2026-04-23
> **Depends on:** Phase 1 foundation (tag `phase-1-complete`)
> **Parent spec:** [`mvp-spec.md`](./mvp-spec.md)
> **Prior implementation plan:** [`plans/2026-04-23-phase-1-foundation.md`](./plans/2026-04-23-phase-1-foundation.md)

---

## 1. Goal

Replace the placeholder textarea from Phase 1 with a real TipTap-based editor that renders Markdown inline, supports Edit/Preview modes, respects light/dark themes, and shows remote collaborator cursors with friendly Japanese-word labels.

**Out of scope:** toolbars (Phase 3), commenting (Phase 3), explicit name-entry UX (Phase 4), version history UI (Phase 4), Markdown export (Phase 4), image upload (roadmap), Mermaid/LaTeX/footnotes (roadmap).

**Backend changes:** none. All Phase 2 work is in `src/`. The Yjs/y-websocket/Postgres plumbing built in Phase 1 is reused unchanged.

---

## 2. Success Criteria

At Phase 2 completion, a user can:

1. Create a new doc (unchanged from Phase 1) and land in the editor.
2. See a TipTap editor instead of a textarea. Type `**hello**` and see `hello` rendered bold inline while the `**` markers stay visible but dimmed.
3. Use keyboard shortcuts — `Cmd+B` bolds, `Cmd+I` italicizes, `Cmd+K` inserts a link, `Cmd+Shift+1/2/3` sets heading levels.
4. Toggle between Edit and Preview modes. Preview renders the full Markdown as styled HTML with syntax-highlighted code blocks and GFM features (tables, task list checkboxes, fenced code, etc.).
5. See other collaborators' cursors with a Japanese name label (e.g., "Sakura") and a stable color. Typing in one browser shows a live cursor in the other.
6. See the app respect the system theme on first visit, and flip themes via a sun/moon icon toggle in the header. Choice persists across reloads.
7. Open the same doc in Edit mode, read it in Preview mode, verify existing behavior: view-only tokens show the editor in `readOnly`, persistent state survives server restart, all 37 Phase 1 tests still pass.

---

## 3. Components

### 3.1 TipTap editor (`src/lib/editor/`)

- **`editor.ts`** — Configures a TipTap `Editor` instance given a `Y.Doc` and `WebsocketProvider`. Extensions:
  - `StarterKit` — headings, paragraphs, lists, bold/italic/strike, blockquote, horizontal rule, code mark. Configure to DISABLE StarterKit's own history extension (Yjs handles undo/redo).
  - `Collaboration` (from `@tiptap/extension-collaboration`) bound to the shared `Y.Doc`.
  - `CollaborationCaret` (from `@tiptap/extension-collaboration-caret`) bound to the provider's `awareness`. Takes a `user: { name, color }` object.
  - `Link` — allow Cmd+K to insert and auto-linkify typed URLs.
  - `Placeholder` — shows empty-state copy when the doc is empty.
  - `TaskList` + `TaskItem` — GFM checkbox task lists.
  - `Table` + `TableRow` + `TableCell` + `TableHeader` — GFM tables.
  - `CodeBlockLowlight` bound to `lowlight` with a small set of languages loaded (JavaScript, TypeScript, JSON, HTML, CSS, Bash, Markdown).
  - Custom: `InlineMarkdownDecorations` plugin (see §3.2).
- **Editable flag** wired to the `permissionLevel === "edit"` gate from Phase 1. View-only sessions get `editable: false`.

### 3.2 Inline Markdown decorations plugin (`src/lib/editor/md-decorations.ts`)

Approach: a ProseMirror plugin that inspects document text and adds `Decoration.inline` entries with a `data-md-syntax` CSS class over the raw Markdown syntax characters (`**`, `*`, `_`, `#`s at heading start, backticks, `>`s at blockquote start, `[]()` parts of links). The decoration applies a muted color via Tailwind (`opacity-40` or a dedicated class). Rewritten from first principles matching Mist's approach but with our own code.

Handles:
- Strong / emphasis / inline code delimiters
- Heading level markers (`#`, `##`, `###` at line start)
- Blockquote `>` markers at line start
- Link syntax brackets + parens (`[text](url)` → fade the brackets/parens but not the text)
- Horizontal rule lines (`---`, `***`)

**Testing:** unit tests in isolation with a ProseMirror test document, asserting decoration count + position. No need to mount TipTap in unit tests.

### 3.3 Preview renderer (`src/lib/preview/`)

- **`render.ts`** — `renderMarkdown(source: string): string` using:
  - `markdown-it` with `html: false`, `linkify: true`, `breaks: false`, `typographer: true`
  - Plugins: `markdown-it-task-lists` (GFM-style task checkboxes)
  - `highlight` function that calls `hljs.highlight(code, { language })` directly on the same registered languages (JavaScript, TypeScript, JSON, HTML, CSS, Bash, Markdown). Falls back to `hljs.highlightAuto` for unknown languages.
  - Output sanitized by `DOMPurify` before returning
- **`theme.ts`** — loads `highlight.js/styles/github.css` in light theme, `github-dark.css` in dark. Implemented via dynamic `<link>` swap in a React effect keyed on active theme.

### 3.4 Theme system (`src/lib/theme/`)

- **`ThemeProvider.tsx`** — React context provider. Detects system preference on mount, reads localStorage override, exposes `{ theme: "light" | "dark", setTheme }` hook. Toggles a `dark` **class** on `<html>` (Tailwind 4's default dark-mode strategy; matches shadcn's canonical setup).
- **`useTheme.ts`** — `useContext(ThemeContext)` convenience hook.
- **`ThemeToggle.tsx`** — small button using shadcn's `Button` + `lucide-react` sun/moon icons. Cycles light ↔ dark on click.

localStorage key: `katagami:theme` (values: `"light"`, `"dark"`, or absent = follow system). Aligns with the `katagami:creator-token:...` prefix from Phase 1.

### 3.5 Cursor identity (`src/lib/user/`)

- **`identity.ts`** — `getOrCreateIdentity(): { name, color }`:
  - On first call, pick a random name from the Japanese pool (see §3.6) and a random hex color from a curated palette (balanced for light + dark backgrounds).
  - Store under `katagami:identity` in localStorage as JSON.
  - Subsequent calls return the same identity.
  - If the user somehow ends up in a room with the same name as another user, the color suffices as disambiguation; we do NOT attempt renaming at MVP.

### 3.6 Japanese name pool

Exported constant in `src/lib/user/names.ts`:

```typescript
export const JAPANESE_NAMES = [
  "Sakura", "Kitsune", "Tanuki", "Mochi", "Neko",
  "Tora", "Ryu", "Kame", "Yuki", "Tsuki",
  "Hoshi", "Hana", "Umi", "Kaze", "Ame",
  "Matcha", "Kumo", "Sora", "Inu", "Sumire",
];
```

Balanced across animals, nature, weather, and familiar words. No overly culture-specific items (no "Samurai", "Ninja", "Sushi").

### 3.7 Document route (`src/routes/Document.tsx`)

Replace the textarea implementation entirely. New structure:

- Header (same two-column layout as Phase 1) now includes:
  - Left: "Document" title (placeholder; Phase 4 adds real title editing)
  - Right: connection status + view-only badge + **ThemeToggle** + **Edit / Preview** toggle (two-button segmented control, Tailwind)
- Body: either `<EditorContent editor={editor} />` (Edit mode) or `<div className="prose" dangerouslySetInnerHTML={{ __html: renderedHtml }} />` (Preview mode), rendered exclusive.
- Same permission validation flow as Phase 1 (REST pre-check → open Yjs connection → mount editor).

### 3.8 Home route (`src/routes/Home.tsx`)

Minimal Tailwind + shadcn refresh (no functional changes):
- Replace inline styles with Tailwind classes
- Replace raw `<button>` with shadcn `Button`
- Replace raw error `<p>` with shadcn `Alert` variant `destructive`
- Render theme toggle in the header

### 3.9 Build / tooling

- Tailwind 4 configured via `@tailwindcss/vite` plugin in `vite.config.ts`; design tokens live in `src/styles.css` via `@theme` (no `tailwind.config.ts` needed in Tailwind 4)
- `src/styles.css` becomes Tailwind entry (`@tailwind base; @tailwind components; @tailwind utilities;`) plus a small custom layer for the `.prose` preview typography and the `data-md-syntax` decoration styles
- `components.json` for shadcn/ui (configured to install into `src/components/ui/`)
- `tsconfig.client.json` verified to allow `"jsx": "react-jsx"` (already set in Phase 1)
- Optional: add `@types/markdown-it` to devDeps if markdown-it doesn't ship its own types

### 3.10 Dependencies to add

Runtime:
- `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-caret`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-code-block-lowlight`
- `lowlight` + `highlight.js`
- `markdown-it` + `markdown-it-task-lists` + `dompurify`
- `tailwindcss` + `@tailwindcss/vite` (Tailwind 4 — no PostCSS/autoprefixer needed; the Vite plugin handles everything)
- `lucide-react` (icons for shadcn)
- `class-variance-authority` + `clsx` + `tailwind-merge` (shadcn companions)

Dev:
- `@types/markdown-it`, `@types/dompurify` (if not bundled)

---

## 4. Architecture

```
Browser (new in Phase 2)
  |
  |-- Home route ──┐
  |                │ (shadcn-styled)
  |-- Document route
  |     |
  |     |-- ThemeProvider (wraps app in main.tsx)
  |     |     |- applies .dark class to <html>
  |     |
  |     |-- Edit mode
  |     |     |-- TipTap editor
  |     |           |- StarterKit (no history)
  |     |           |- Collaboration ──► shared Y.Doc (from Phase 1 yjs-client)
  |     |           |- CollaborationCaret ──► provider.awareness with identity
  |     |           |- InlineMarkdownDecorations plugin (decorates syntax chars)
  |     |           |- Link, Placeholder, TaskList, Table, CodeBlockLowlight
  |     |
  |     |-- Preview mode
  |           |-- markdown-it renders Y.Text.toString() to HTML
  |           |-- highlight.js styles code blocks
  |           |-- DOMPurify sanitizes before injection
  |           |-- dangerouslySetInnerHTML
```

**State ownership:** Y.Doc remains the canonical state. TipTap is a view over it. Preview mode reads `yText.toString()` and renders synchronously on each toggle. No React state mirrors the document content (beyond a tick counter to force re-render on Y.Doc update if needed for Preview mode).

**No new backend flows.** Phase 2 is purely a client-side swap.

---

## 5. Testing Strategy

### 5.1 Preserve Phase 1 coverage

All 37 Phase 1 tests must still pass after Phase 2 changes. Zero tolerance for regressions.

### 5.2 New unit tests

- `src/lib/user/identity.test.ts` — assert name is in pool, color is valid hex, roundtrip through localStorage returns the same identity.
- `src/lib/editor/md-decorations.test.ts` — build a ProseMirror document with known markdown syntax, run the decoration plugin, assert decorations are produced at the expected ranges.
- `src/lib/preview/render.test.ts` — golden tests for GFM features: heading, bold/italic, task list, table, fenced code block. Assert DOMPurify strips `<script>` from hostile Markdown input.
- `src/lib/theme/ThemeProvider.test.tsx` — assert system-preference detection, localStorage persistence, toggle behavior.

### 5.3 Component tests

- `src/routes/Document.test.tsx` — mount with a mocked permission response + mocked Yjs provider; assert Edit mode shows `.ProseMirror` element; assert clicking Preview button hides editor and shows rendered HTML; assert view-only tokens render a disabled editor.

### 5.4 Phase 2 doesn't add new e2e

The existing `tests/e2e/collab-loop.test.ts` continues to exercise the full sync path via the Yjs client harness (it bypasses the React UI entirely — which is the correct layer for it). Phase 2 doesn't change what that test covers.

---

## 6. Migration Notes / Risks

- **StarterKit's history extension clashes with Yjs.** Must pass `history: false` to `StarterKit.configure({})` or TipTap will double-undo. Explicitly tested in component tests.
- **CollaborationCaret requires `y-protocols/awareness`** — already in the bundle; the Phase 1 provider exposes `provider.awareness`.
- **React StrictMode double-invocation** still applies. The editor creation/destruction cycle needs to handle mount → unmount → mount without leaking editor instances. Use `useEditor` hook which handles this, OR manage instance lifecycle explicitly with a ref.
- **Tailwind 4 setup:** uses `@tailwindcss/vite` plugin, simpler than 3. No `tailwind.config.js` for design tokens — we use `@theme` in CSS. shadcn's generator supports Tailwind 4.
- **highlight.js CSS size:** each theme file is ~5KB. Dynamic swap via `<link>` avoids loading both at once.
- **DOMPurify in Vite SSR:** we're client-only for now, so no SSR concern; if Phase 4 adds SSR-rendered preview pages, DOMPurify setup needs to use the isomorphic build.

---

## 7. Acceptance

Phase 2 is done when:

1. All Phase 1 tests pass (37+, no regressions)
2. New Phase 2 unit + component tests pass
3. `pnpm build:client` succeeds
4. `pnpm typecheck` + `pnpm lint` clean (≤1 pre-existing warning)
5. Manual smoke test: open two browsers, type Markdown in one, see styled output in the other with a Japanese-named cursor. Toggle Preview mode, see GFM rendered + code-highlighted. Toggle dark mode. View-only URL renders a disabled editor.
6. Phase 2 implementation plan marked `phase-2-complete` as a git tag.
