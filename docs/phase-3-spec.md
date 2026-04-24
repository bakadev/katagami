# Katagami — Phase 3 Spec: Toolbar + Commenting

> **Status:** Approved design — ready for implementation planning
> **Date:** 2026-04-24
> **Depends on:** Phase 2 (tag `phase-2-complete`)
> **Parent spec:** [`mvp-spec.md`](./mvp-spec.md)

---

## 1. Goal

Add two major feature surfaces on top of the Phase 2 editor:

1. **Persistent top toolbar** with formatting buttons that insert Markdown syntax characters (consistent with Phase 2's "Markdown source editor" identity).
2. **Text-anchored commenting system** with threaded replies, resolve, and a collapsible right sidebar.

Also introduces a small **text-selection action framework** that makes it trivial to register future text-range actions (starting with Comment; Phase 4's AI operations hook into the same registry).

**Out of scope:** scroll sync, nested replies, hide-vs-resolve two-state, notifications, comment-only permission URL, AI text operations, guided comments, rich-text in comment bodies.

**Backend changes:** none. Threads live in a `Y.Map` inside the shared `Y.Doc`; comment anchors are a custom ProseMirror mark serialized through the existing Yjs sync.

---

## 2. Success Criteria

At Phase 3 completion, a user can:

1. Select text, see a small floating **Comment** button, click it, compose a comment, and post — the highlighted text gets a subtle tint and a new thread appears in the sidebar.
2. Reply to a thread (flat), resolve a thread, unresolve it, delete their own comments/replies.
3. Use a persistent top toolbar to apply Markdown formatting (H1/H2/H3, Bold, Italic, Strike, Bullet list, Numbered list, Code block, Blockquote, Horizontal rule) — each inserts literal syntax characters that the decoration plugin and Preview pipeline both handle.
4. See `**bold**`, `*italic*`, `~~strike~~`, and `` `code` `` rendered inline with real styling (bold/italic/etc.) while the syntax characters stay dimmed but visible.
5. Collapse the comment sidebar when not needed; a chip in the header shows the unresolved-thread count.
6. See collaborators' comments and formatting edits in real time (Yjs sync).
7. Confirm that all Phase 1 + Phase 2 tests still pass + new Phase 3 tests pass.

---

## 3. Components

### 3.1 Toolbar (`src/components/editor/Toolbar.tsx`)

Persistent, above the editor host. Shadcn-styled icon buttons. Buttons:

| Icon / Label | Command |
|---|---|
| H1 | Set heading level 1: replace any existing `#`/`##`/`###`-prefix with `# `; if line already starts with `# `, remove it |
| H2 | Same semantics, `## ` |
| H3 | Same semantics, `### ` |
| B (Bold) | Wrap selection with `**…**`; if already wrapped with `**`, unwrap |
| I (Italic) | Wrap with `*…*`; unwrap if already wrapped |
| S (Strike) | Wrap with `~~…~~`; unwrap if already wrapped |
| Bullet list | Toggle `- ` at line start — applies per line for multi-line selections; if every selected line starts with `- `, remove from all; otherwise add to lines without it |
| Numbered list | Toggle `1. ` at line start using same per-line semantics |
| `<>` Code block | Wrap the selected lines with a pair of \`\`\` lines on their own (before and after the selection) |
| `""` Blockquote | Toggle `> ` at line start with per-line semantics |
| `—` HR | Insert `\n\n---\n\n` at the caret position |

Each button dispatches via the central `toolbar-actions.ts` module, which manipulates the editor via ProseMirror transactions. Buttons are disabled when the editor is read-only (view token).

### 3.2 Toolbar actions module (`src/lib/editor/toolbar-actions.ts`)

Pure functions (one per action) that accept an `Editor` and perform the text-insert/wrap. Each action is unit-testable against a plain ProseMirror editor state. Example contracts:

```typescript
export function wrapSelection(editor: Editor, left: string, right: string): void;
export function toggleLinePrefix(editor: Editor, prefix: string): void;
export function insertAtCursor(editor: Editor, text: string): void;
```

Toggle-prefix logic: if every selected line already starts with the prefix, remove it from all; otherwise add it to all lines without the prefix. This matches how most editors handle "Bold" on an already-bold selection.

Wrap-selection logic: if the selection is already wrapped with the delimiter pair, unwrap it; otherwise wrap it.

### 3.3 Decorations plugin extended (`src/lib/editor/md-decorations.ts`)

Currently fades syntax characters. Extended to apply visual styling to the *content between* the syntax:

- `**text**` → `.md-bold` class on the inner content (`font-weight: 700`)
- `*text*` / `_text_` → `.md-italic` (`font-style: italic`)
- `~~text~~` → `.md-strike` (`text-decoration: line-through`)
- `` `text` `` → `.md-code` (`font-family: monospace; background: var(--muted); padding: 0 4px; border-radius: 3px`)

Heading prefix decorations stay the same (fade the `#` chars). We do NOT attempt to style the heading text itself (it would require reading the whole line and the results would conflict with monospace edit mode).

Unit tests updated to assert both syntax-fade AND inner-content decorations.

### 3.4 Comment anchor mark (`src/lib/editor/comment-mark.ts`)

Custom TipTap Extension that adds a `commentAnchor` mark to the schema. The mark has one attribute: `threadId: string`. Rendered to the DOM as a `<span>` with `.comment-anchor` class (subtle background tint) and a `data-comment-thread-id` attribute.

The mark is "non-inclusive" — typing at either edge of the marked range does NOT extend the mark, which matches how sticky-highlight comments should behave.

Sketch (final API is TipTap v3 `Mark.create` — implementer confirms option shapes against the installed @tiptap/core):

```typescript
import { Mark, mergeAttributes } from "@tiptap/core";

export const CommentAnchor = Mark.create({
  name: "commentAnchor",
  inclusive: false,
  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-thread-id"),
        renderHTML: (attrs) => ({ "data-comment-thread-id": attrs.threadId }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-comment-thread-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "comment-anchor" }),
      0,
    ];
  },
});
```

Registered in `editor.ts` alongside the existing extensions.

### 3.5 Thread storage (`src/lib/comments/threads.ts`, `src/lib/comments/types.ts`)

Types:

```typescript
export interface Reply {
  id: string;               // uuid
  authorName: string;       // from identity
  authorColor: string;
  createdAt: number;        // Date.now()
  body: string;
  deleted?: true;           // soft-delete marker for replies if root is deleted
}

export interface Thread {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  body: string;
  resolved: boolean;
  replies: Reply[];
  // `deleted: true` on a thread means the root body was deleted; keep for the replies
  rootDeleted?: true;
}
```

Storage: a `Y.Map<string>` named `"threads"` on the shared `Y.Doc`. Keys are thread IDs; values are JSON-stringified `Thread` objects (matches Mist's pattern). Helpers parse/stringify transparently so callers work in terms of typed objects.

Helper module exports:

```typescript
export function getThreadsMap(ydoc: Y.Doc): Y.Map<string>;
export function createThread(ydoc: Y.Doc, input: Omit<Thread, "id" | "replies" | "resolved">): string;
export function addReply(ydoc: Y.Doc, threadId: string, input: Omit<Reply, "id">): void;
export function setResolved(ydoc: Y.Doc, threadId: string, resolved: boolean): void;
export function deleteReply(ydoc: Y.Doc, threadId: string, replyId: string): void;
export function deleteThreadRoot(ydoc: Y.Doc, threadId: string): void;
```

All mutations are performed in a single `ydoc.transact(...)` for atomicity.

### 3.6 `useThreads` hook (`src/hooks/useThreads.ts`)

React hook that subscribes to the threads Y.Map and returns a reactive array of threads (sorted by document-order, which requires asking the editor where each mark sits).

```typescript
export function useThreads(editor: Editor | null, ydoc: Y.Doc | null): Thread[];
```

Implementation detail: subscribes to Y.Map observe events + the editor's `transaction` event (to resort when marks move). Returns an empty array if either arg is null.

### 3.7 Floating comment button (`src/components/editor/FloatingCommentButton.tsx`)

Shows when the editor has a non-empty selection. Positioned via ProseMirror's `coordsAtPos` above the selection. Has ONE button: "Comment" (with a speech-bubble icon). Clicking it opens the composer.

Uses the **text-selection action registry** below — registers itself as one action of type `"comment"`. Designed so Phase 4 can register additional actions (AI) without touching this component.

### 3.8 Selection action registry (`src/lib/editor/selection-actions.ts`)

Small pluggable system:

```typescript
export interface SelectionAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  onInvoke: (ctx: { editor: Editor; from: number; to: number }) => void;
  visibleWhen?: (ctx: { editor: Editor; from: number; to: number }) => boolean;
}

export function registerSelectionAction(action: SelectionAction): void;
export function getSelectionActions(): SelectionAction[];
```

Phase 3 registers `comment`. Phase 4 will register AI actions. The floating button renders buttons for each registered action.

### 3.9 Comment composer (`src/components/editor/CommentComposer.tsx`)

Renders inline near the selection (or inline in the sidebar when replying). Plain `<textarea>` + Post/Cancel buttons. Submits via the thread helpers.

Keyboard shortcuts:
- Cmd/Ctrl+Enter — post
- Esc — cancel

### 3.10 Comment sidebar (`src/components/comments/CommentSidebar.tsx`)

Right-side panel. Collapsed by default. Behavior:

- Header has a **comment chip** (count of unresolved threads) — clicking toggles the sidebar.
- Sidebar animates open to ~320px width.
- Document area shrinks accordingly (layout: flex).
- Sidebar contents:
  - Header: "Comments (N)" + "Show resolved" toggle + close button
  - List of `ThreadCard` components, document-order
  - Empty state when no threads: "No comments yet. Select text and click Comment."

### 3.11 Thread card (`src/components/comments/ThreadCard.tsx`)

One card per thread:
- Quote bar showing the highlighted anchor text
- Author colored-pill + name + relative time
- Body text
- Replies (flat list, each with author/time/body)
- Reply composer (hidden until user clicks "Reply")
- Resolve / Unresolve button (edit-URL holders only)
- "…" menu with Delete (author only)

Clicking anywhere on the card's quote bar scrolls the editor viewport to the marked anchor and flashes the highlight (300ms pulse animation) so the user can see which text the thread refers to.

### 3.12 Document route integration

`src/routes/Document.tsx` grows to wire everything:

- Persistent Toolbar component (above the editor host)
- FloatingCommentButton (absolutely positioned, shown when selection has length)
- CommentSidebar (right column, visible state in a `useState`)
- Header gets a comment chip (count of unresolved threads, clickable to toggle sidebar)

New layout (when sidebar is open):
```
[ Header (title, status, mode, comment-chip, theme-toggle) ]
[ Toolbar                                                  ]
[ Editor (flex: 1) ][ Sidebar (320px, collapsible)         ]
```

---

## 4. Architecture

```
Document route
  ├─ Header
  │   ├─ title, status, Edit/Preview toggle, ThemeToggle
  │   └─ CommentChip (count of unresolved, click → toggle sidebar)
  ├─ Toolbar ──────────────► toolbar-actions.ts → editor.commands.insertContent / transactions
  ├─ Editor host (TipTap)
  │   ├─ extensions from Phase 2
  │   ├─ NEW: CommentAnchor mark
  │   └─ NEW: md-decorations extended (styled inner content)
  │
  ├─ FloatingCommentButton (on selection, reads selection-actions registry)
  │   └─ opens CommentComposer → createThread → Y.Map
  │
  ├─ Preview mode (unchanged)
  │
  └─ CommentSidebar (collapsible)
      ├─ useThreads(editor, ydoc) → reactive Thread[]
      ├─ ThreadCard[] (sorted by document-order via mark position)
      │   ├─ Reply composer
      │   └─ Resolve / Delete actions
      └─ "Show resolved" toggle
```

**State ownership:** Y.Doc remains canonical. Threads are in `ydoc.getMap('threads')`. Mark positions come from ProseMirror state. React state: sidebar open/closed, "show resolved" toggle, composer open state.

**Sync:** Creating a thread is one transaction: (1) apply the `commentAnchor` mark, (2) add the thread to the Y.Map. Both propagate through the existing Yjs WebSocket sync.

---

## 5. Permissions

| Action | Edit URL | View URL |
|---|---|---|
| See comment highlights in doc | ✅ | ✅ |
| Open sidebar / read threads | ✅ | ✅ |
| Create thread | ✅ | ❌ (floating button hidden) |
| Reply to thread | ✅ | ❌ |
| Resolve / unresolve | ✅ | ❌ |
| Delete own comment/reply | ✅ (own only) | ❌ |
| Use formatting toolbar | ✅ | ❌ (buttons disabled) |

The comment-only URL level is still deferred per MVP spec.

---

## 6. Deletion Semantics

- **Reply delete**: remove from `thread.replies`. If the reply is referenced (e.g. "reply to reply" in a future feature), we'd soft-delete; for MVP we hard-delete.
- **Root body delete (thread has replies)**: set `thread.body = ""`, `thread.rootDeleted = true`. UI shows "[deleted]" in place of the body. Replies remain visible. Mark in the doc is kept.
- **Root body delete (thread has no replies)**: entire thread removed from Y.Map; mark removed from the document.
- **Last reply deleted while rootDeleted is true**: entire thread removed from Y.Map; mark removed.
- **Resolve is NOT delete**: resolved threads stay (hidden from default sidebar view unless "Show resolved" is on).

---

## 7. Testing Strategy

### 7.1 Preserve existing

All 75 tests from Phase 1 + 2 must continue to pass.

### 7.2 New unit tests

- `src/lib/editor/toolbar-actions.test.ts` — each action against a plain ProseMirror state: wrap toggles correctly, line-prefix idempotency, code block wraps multi-line, etc. ~15 tests.
- `src/lib/editor/md-decorations.test.ts` — extended with inner-content-styling cases. ~3 new tests on top of existing 5.
- `src/lib/comments/threads.test.ts` — create/reply/resolve/delete roundtrips through Y.Map. ~8 tests.

### 7.3 Component tests

- `tests/client/toolbar.test.tsx` — renders, button clicks dispatch actions. ~4 tests.
- `tests/client/comment-sidebar.test.tsx` — empty state, populated state, resolve toggle, delete. ~5 tests.

### 7.4 Integration

- `tests/client/commenting-flow.test.tsx` — full flow: select text, click comment button, compose, post, see in sidebar, reply, resolve. ~3 tests using mocked yjs-client + editor.

### 7.5 Defer

No new e2e tests (the existing `collab-loop.test.ts` covers the sync substrate; commenting round-trip could be added in a later phase if we want).

---

## 8. Migration / Compatibility

- Phase 1 + 2 existing docs have no `commentAnchor` marks and no `threads` Y.Map. Opening such a doc in Phase 3 gives an empty sidebar and no marks — works cleanly.
- Adding the `commentAnchor` mark to the schema means the Yjs fragment schema changes. Existing docs created before Phase 3 are forward-compatible because the mark is additive — ProseMirror accepts a schema with additional marks. Old doc content just won't have any of the new marks applied. Confirmed by TipTap/ProseMirror's forward-compat behavior.
- Existing Y.Docs created in Phase 2 do not have the `"threads"` Y.Map key. First access creates it.

---

## 9. Acceptance

Phase 3 is done when:

1. All prior tests (75) still pass
2. ~38 new tests pass (~15 toolbar, ~3 decorations, ~8 threads, ~4 toolbar component, ~5 sidebar, ~3 integration)
3. `pnpm typecheck` + `pnpm lint` clean
4. `pnpm build:client` succeeds
5. Manual two-browser smoke test:
   - Toolbar buttons correctly insert/wrap syntax
   - Decorations render bold/italic/strike/code styling inline
   - User A selects text, posts a comment, user B sees the thread appear in the sidebar within ~200ms
   - Reply round-trips
   - Resolve hides the thread from default view; unresolve restores it
   - Deleting a comment removes it (or shows "[deleted]" if replies exist)
   - View-only URL: marks render, floating Comment button does not appear, toolbar buttons are disabled, sidebar reply composers are absent
6. Tag `phase-3-complete` at HEAD
