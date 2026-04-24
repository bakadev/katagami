# Katagami — Phase 3 Implementation Plan: Toolbar + Commenting

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent formatting toolbar that inserts Markdown syntax characters, extend the decorations plugin to style inner content of `**bold**`/`*italic*`/`~~strike~~`/`` `code` `` inline, and build the complete commenting system (anchored marks, Y.Map-backed threads, right sidebar with resolve + reply).

**Architecture:** Pure-function toolbar actions manipulate TipTap documents via the editor API; extended ProseMirror Decoration plugin adds inner-content styling alongside existing syntax fade; a new `CommentAnchor` mark joins the schema; threads live in `ydoc.getMap("threads")` as JSON-stringified `Thread` objects; a small `SelectionAction` registry lets the floating toolbar take registrations from Phase 3 (Comment) and Phase 4+ (AI). Sidebar is a controlled collapsible panel anchored to the right.

**Tech Stack:** TipTap 3 + ProseMirror (`@tiptap/pm`), Yjs 13, React 19, shadcn Button + Tooltip + Textarea (install as needed via shadcn MCP), `lucide-react` icons, jsdom + `@testing-library/react` for tests.

**Spec:** [`docs/phase-3-spec.md`](../phase-3-spec.md)

**After this plan completes, you can:**
1. Click toolbar buttons to insert/wrap Markdown syntax; see it styled inline.
2. Select text → click floating Comment button → compose → post → see thread appear in sidebar.
3. Reply to threads (flat), resolve them, delete your own entries.
4. Watch edits + comments sync live across two browsers.
5. View-only URL: marks render, but all interactions are disabled.
6. Run `pnpm test` and see all prior tests + ~38 new tests passing.
7. Tag `phase-3-complete`.

---

## shadcn MCP usage

- Task 2 uses `mcp__shadcn__get_add_command_for_items` to install the `tooltip` and `textarea` components (not yet present).
- Task 15 uses `mcp__shadcn__get_audit_checklist` as the final verification gate.

All other components (Button, Alert, Toggle) are already installed.

---

## File Structure

New files:
```
src/
  components/
    editor/
      Toolbar.tsx                     # Persistent top toolbar
      ToolbarButton.tsx               # Icon+tooltip wrapper around shadcn Button
      FloatingCommentButton.tsx       # Selection-triggered
      CommentComposer.tsx             # Textarea + Post/Cancel
    comments/
      CommentChip.tsx                 # Header count chip
      CommentSidebar.tsx              # Collapsible right panel
      ThreadCard.tsx                  # Single thread in sidebar
  lib/
    editor/
      toolbar-actions.ts              # Pure text-insert/wrap logic
      comment-mark.ts                 # CommentAnchor TipTap Extension
      selection-actions.ts            # Pluggable action registry
    comments/
      types.ts                        # Thread/Reply types
      threads.ts                      # Y.Map CRUD helpers
  hooks/
    useThreads.ts                     # Reactive Y.Map subscription
tests/
  client/
    toolbar-actions.test.ts
    threads.test.ts
    use-threads.test.tsx
    selection-actions.test.ts
    toolbar.test.tsx
    comment-sidebar.test.tsx
    commenting-flow.test.tsx
```

Modified files:
- `src/lib/editor/md-decorations.ts` — add inner-content decorations for bold/italic/strike/code
- `src/lib/editor/editor.ts` — register CommentAnchor mark
- `src/routes/Document.tsx` — integrate Toolbar, FloatingCommentButton, CommentSidebar, CommentChip
- `src/styles.css` — new classes: `.comment-anchor`, `.md-bold`, `.md-italic`, `.md-strike`, `.md-code`, `.comment-anchor-flash`
- `tests/client/md-decorations.test.ts` — extend with inner-content styling tests

---

## Prerequisites

- Phase 2 complete (tag `phase-2-complete`); 75 tests passing.
- Docker Postgres running.
- shadcn MCP accessible.

---

## Task 1: Thread types + Y.Map storage helpers

**Goal:** Pure storage layer for threads. Tests verify create/reply/resolve/delete round-trip through Y.Map.

**Files:**
- Create: `/src/lib/comments/types.ts`
- Create: `/src/lib/comments/threads.ts`
- Create: `/tests/client/threads.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/threads.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import * as Y from "yjs";
import {
  getThreadsMap,
  createThread,
  addReply,
  setResolved,
  deleteReply,
  deleteThreadRoot,
  getThread,
  listThreads,
} from "../../src/lib/comments/threads";

describe("threads Y.Map helpers", () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
  });

  it("creates and reads a thread", () => {
    const id = createThread(ydoc, {
      authorName: "Sakura",
      authorColor: "#e11d48",
      body: "Nice doc!",
      createdAt: 1000,
    });
    const thread = getThread(ydoc, id);
    expect(thread).toMatchObject({
      id,
      authorName: "Sakura",
      authorColor: "#e11d48",
      body: "Nice doc!",
      createdAt: 1000,
      resolved: false,
      replies: [],
    });
  });

  it("adds replies", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "root",
      createdAt: 1,
    });
    addReply(ydoc, id, {
      authorName: "B",
      authorColor: "#fff",
      body: "reply",
      createdAt: 2,
    });
    const t = getThread(ydoc, id)!;
    expect(t.replies).toHaveLength(1);
    expect(t.replies[0]).toMatchObject({
      authorName: "B",
      body: "reply",
      createdAt: 2,
    });
    expect(t.replies[0].id).toMatch(/[0-9a-f-]{36}/);
  });

  it("toggles resolved", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    setResolved(ydoc, id, true);
    expect(getThread(ydoc, id)!.resolved).toBe(true);
    setResolved(ydoc, id, false);
    expect(getThread(ydoc, id)!.resolved).toBe(false);
  });

  it("deletes a reply", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    addReply(ydoc, id, { authorName: "C", authorColor: "#222", body: "y", createdAt: 3 });
    const replyId = getThread(ydoc, id)!.replies[0].id;
    deleteReply(ydoc, id, replyId);
    const t = getThread(ydoc, id)!;
    expect(t.replies).toHaveLength(1);
    expect(t.replies[0].body).toBe("y");
  });

  it("deletes a root with no replies → removes whole thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    deleteThreadRoot(ydoc, id);
    expect(getThread(ydoc, id)).toBeNull();
  });

  it("deletes a root with replies → marks rootDeleted, keeps thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    deleteThreadRoot(ydoc, id);
    const t = getThread(ydoc, id);
    expect(t).not.toBeNull();
    expect(t!.rootDeleted).toBe(true);
    expect(t!.body).toBe("");
    expect(t!.replies).toHaveLength(1);
  });

  it("deletes last reply on a rootDeleted thread → removes whole thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    deleteThreadRoot(ydoc, id);
    const replyId = getThread(ydoc, id)!.replies[0].id;
    deleteReply(ydoc, id, replyId);
    expect(getThread(ydoc, id)).toBeNull();
  });

  it("lists threads in insertion order", () => {
    const a = createThread(ydoc, { authorName: "A", authorColor: "#000", body: "1", createdAt: 1 });
    const b = createThread(ydoc, { authorName: "B", authorColor: "#111", body: "2", createdAt: 2 });
    const ids = listThreads(ydoc).map((t) => t.id);
    expect(ids).toEqual([a, b]);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/threads.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement types**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/comments/types.ts`:

```typescript
export interface Reply {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  body: string;
}

export interface Thread {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  body: string;
  resolved: boolean;
  replies: Reply[];
  /** True when the root body has been deleted but replies remain. */
  rootDeleted?: true;
}
```

- [ ] **Step 4: Implement threads helpers**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/comments/threads.ts`:

```typescript
import * as Y from "yjs";
import type { Reply, Thread } from "./types";

const MAP_NAME = "threads";

function randomId(): string {
  // Browser-native UUIDv4 (available in jsdom via @testing-library setup)
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : // Fallback for environments without crypto.randomUUID
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export function getThreadsMap(ydoc: Y.Doc): Y.Map<string> {
  return ydoc.getMap<string>(MAP_NAME);
}

function readThread(map: Y.Map<string>, id: string): Thread | null {
  const raw = map.get(id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Thread;
  } catch {
    return null;
  }
}

function writeThread(map: Y.Map<string>, thread: Thread): void {
  map.set(thread.id, JSON.stringify(thread));
}

export function getThread(ydoc: Y.Doc, id: string): Thread | null {
  return readThread(getThreadsMap(ydoc), id);
}

export function listThreads(ydoc: Y.Doc): Thread[] {
  const map = getThreadsMap(ydoc);
  const threads: Thread[] = [];
  for (const id of map.keys()) {
    const t = readThread(map, id);
    if (t) threads.push(t);
  }
  return threads;
}

export function createThread(
  ydoc: Y.Doc,
  input: Pick<Thread, "authorName" | "authorColor" | "body" | "createdAt">,
): string {
  const id = randomId();
  const thread: Thread = {
    id,
    authorName: input.authorName,
    authorColor: input.authorColor,
    body: input.body,
    createdAt: input.createdAt,
    resolved: false,
    replies: [],
  };
  ydoc.transact(() => {
    writeThread(getThreadsMap(ydoc), thread);
  });
  return id;
}

export function addReply(
  ydoc: Y.Doc,
  threadId: string,
  input: Omit<Reply, "id">,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.replies.push({ id: randomId(), ...input });
  ydoc.transact(() => writeThread(map, thread));
}

export function setResolved(
  ydoc: Y.Doc,
  threadId: string,
  resolved: boolean,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.resolved = resolved;
  ydoc.transact(() => writeThread(map, thread));
}

export function deleteReply(
  ydoc: Y.Doc,
  threadId: string,
  replyId: string,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.replies = thread.replies.filter((r) => r.id !== replyId);
  ydoc.transact(() => {
    // If rootDeleted and no replies remain, remove the whole thread.
    if (thread.rootDeleted && thread.replies.length === 0) {
      map.delete(threadId);
    } else {
      writeThread(map, thread);
    }
  });
}

export function deleteThreadRoot(ydoc: Y.Doc, threadId: string): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  ydoc.transact(() => {
    if (thread.replies.length === 0) {
      map.delete(threadId);
      return;
    }
    thread.body = "";
    thread.rootDeleted = true;
    writeThread(map, thread);
  });
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/client/threads.test.ts
```
Expected: 8 passing.

- [ ] **Step 6: Full suite**

```bash
pnpm test
```
Expected: 83 passing (75 + 8).

- [ ] **Step 7: Commit**

```bash
git add src/lib/comments/ tests/client/threads.test.ts
git commit -m "feat(comments): Y.Map thread storage with CRUD helpers"
```

---

## Task 2: Add shadcn Tooltip + Textarea components

**Goal:** Install the two shadcn primitives needed for the toolbar (Tooltip) and the comment composer (Textarea).

**Files:**
- Create: `/src/components/ui/tooltip.tsx` (via shadcn)
- Create: `/src/components/ui/textarea.tsx` (via shadcn)

- [ ] **Step 1: Get add command via shadcn MCP**

Call:
```
mcp__shadcn__get_add_command_for_items with items: ["@shadcn/tooltip", "@shadcn/textarea"]
```

- [ ] **Step 2: Run the command**

Run the returned command (typically `pnpm dlx shadcn@latest add tooltip textarea`).

- [ ] **Step 3: Verify files exist**

```bash
ls src/components/ui/
```
Expected to include `tooltip.tsx` and `textarea.tsx`.

- [ ] **Step 4: Verify build + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tooltip.tsx src/components/ui/textarea.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn Tooltip and Textarea primitives"
```

---

## Task 3: Toolbar actions — pure text manipulation

**Goal:** Pure functions that, given a TipTap `Editor`, perform wrap/toggle-prefix/insert operations. All tested against a real TipTap editor in jsdom.

**Files:**
- Create: `/src/lib/editor/toolbar-actions.ts`
- Create: `/tests/client/toolbar-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/toolbar-actions.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  wrapSelection,
  toggleLinePrefix,
  toggleHeading,
  insertAtCursor,
  insertHorizontalRule,
} from "../../src/lib/editor/toolbar-actions";

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: () => ({
        matches: false,
        media: "",
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
});

function makeEditor(content: string): Editor {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const editor = new Editor({
    element: host,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        bold: false,
        italic: false,
        strike: false,
      }),
    ],
    content: {
      type: "doc",
      content: content.split("\n").map((line) => ({
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : [],
      })),
    },
  });
  return editor;
}

function docText(editor: Editor): string {
  return editor.getText({ blockSeparator: "\n" });
}

describe("wrapSelection", () => {
  let editor: Editor;
  afterEach(() => editor?.destroy());

  it("wraps a selection with delimiter pair", () => {
    editor = makeEditor("hello world");
    // Select "world" — positions 7..12 (1-indexed with paragraph wrapper).
    editor.commands.setTextSelection({ from: 7, to: 12 });
    wrapSelection(editor, "**", "**");
    expect(docText(editor)).toBe("hello **world**");
  });

  it("unwraps if the selection is already wrapped", () => {
    editor = makeEditor("hello **world**");
    // Select "world"
    editor.commands.setTextSelection({ from: 9, to: 14 });
    wrapSelection(editor, "**", "**");
    expect(docText(editor)).toBe("hello world");
  });

  it("wraps with asymmetric delimiters", () => {
    editor = makeEditor("code");
    editor.commands.setTextSelection({ from: 1, to: 5 });
    wrapSelection(editor, "`", "`");
    expect(docText(editor)).toBe("`code`");
  });
});

describe("toggleLinePrefix", () => {
  let editor: Editor;
  afterEach(() => editor?.destroy());

  it("adds prefix when absent", () => {
    editor = makeEditor("item one");
    editor.commands.setTextSelection({ from: 1, to: 1 });
    toggleLinePrefix(editor, "- ");
    expect(docText(editor)).toBe("- item one");
  });

  it("removes prefix when present", () => {
    editor = makeEditor("- item one");
    editor.commands.setTextSelection({ from: 1, to: 1 });
    toggleLinePrefix(editor, "- ");
    expect(docText(editor)).toBe("item one");
  });

  it("applies to all selected lines; if every line has it, removes from all", () => {
    editor = makeEditor("- one\n- two");
    editor.commands.setTextSelection({ from: 1, to: 12 });
    toggleLinePrefix(editor, "- ");
    expect(docText(editor)).toBe("one\ntwo");
  });

  it("applies to lines that don't have the prefix when any line lacks it", () => {
    editor = makeEditor("- one\ntwo");
    editor.commands.setTextSelection({ from: 1, to: 10 });
    toggleLinePrefix(editor, "- ");
    expect(docText(editor)).toBe("- one\n- two");
  });
});

describe("toggleHeading", () => {
  let editor: Editor;
  afterEach(() => editor?.destroy());

  it("adds H1 prefix when line is plain", () => {
    editor = makeEditor("Title");
    editor.commands.setTextSelection({ from: 1, to: 1 });
    toggleHeading(editor, 1);
    expect(docText(editor)).toBe("# Title");
  });

  it("removes H1 prefix when line already has it", () => {
    editor = makeEditor("# Title");
    editor.commands.setTextSelection({ from: 1, to: 1 });
    toggleHeading(editor, 1);
    expect(docText(editor)).toBe("Title");
  });

  it("replaces H2 with H3 when clicking H3 on an H2 line", () => {
    editor = makeEditor("## Subtitle");
    editor.commands.setTextSelection({ from: 1, to: 1 });
    toggleHeading(editor, 3);
    expect(docText(editor)).toBe("### Subtitle");
  });
});

describe("insertAtCursor + insertHorizontalRule", () => {
  let editor: Editor;
  afterEach(() => editor?.destroy());

  it("insertAtCursor drops text at caret", () => {
    editor = makeEditor("ab");
    editor.commands.setTextSelection({ from: 2, to: 2 });
    insertAtCursor(editor, "X");
    expect(docText(editor)).toBe("aXb");
  });

  it("insertHorizontalRule inserts an HR line between paragraphs", () => {
    editor = makeEditor("before\nafter");
    editor.commands.setTextSelection({ from: 7, to: 7 });
    insertHorizontalRule(editor);
    expect(docText(editor)).toBe("before\n\n---\n\nafter");
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/toolbar-actions.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement toolbar-actions**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/toolbar-actions.ts`:

```typescript
import type { Editor } from "@tiptap/core";

/**
 * Wrap the current selection with `left` and `right`. If the selection is
 * already wrapped with this exact delimiter pair, unwrap it.
 */
export function wrapSelection(editor: Editor, left: string, right: string): void {
  const { state } = editor;
  const { from, to } = state.selection;
  if (from === to) return;

  const selected = state.doc.textBetween(from, to, "\n");
  const before = from - left.length >= 0
    ? state.doc.textBetween(Math.max(0, from - left.length), from, "\n")
    : "";
  const after = state.doc.textBetween(to, Math.min(state.doc.content.size, to + right.length), "\n");

  if (before === left && after === right) {
    // Unwrap: delete delimiters on both sides.
    editor
      .chain()
      .focus()
      .deleteRange({ from: to, to: to + right.length })
      .deleteRange({ from: from - left.length, to: from })
      .run();
    return;
  }

  // Wrap: insert delimiters around the selection.
  editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, `${left}${selected}${right}`)
    .setTextSelection({ from: from + left.length, to: from + left.length + selected.length })
    .run();
}

/** Get the start and end document positions of each line intersecting the selection. */
function linesInSelection(editor: Editor): Array<{ from: number; to: number; text: string }> {
  const { state } = editor;
  const { from: selFrom, to: selTo } = state.selection;
  const lines: Array<{ from: number; to: number; text: string }> = [];
  state.doc.descendants((node, pos) => {
    if (!node.isBlock || node.type.name !== "paragraph") return;
    const nodeStart = pos + 1; // inside paragraph
    const nodeEnd = pos + node.nodeSize - 1;
    // Does this paragraph intersect the selection?
    if (nodeEnd < selFrom || nodeStart > selTo) return;
    lines.push({
      from: nodeStart,
      to: nodeEnd,
      text: node.textContent,
    });
  });
  return lines;
}

/**
 * Toggle a line-start prefix across all lines intersecting the selection.
 * If EVERY line already starts with the prefix, remove it from all.
 * Otherwise, add it to all lines that don't have it.
 */
export function toggleLinePrefix(editor: Editor, prefix: string): void {
  const lines = linesInSelection(editor);
  if (lines.length === 0) return;

  const everyHasIt = lines.every((l) => l.text.startsWith(prefix));

  const chain = editor.chain().focus();
  // Apply from last to first to keep positions stable.
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (everyHasIt) {
      chain.deleteRange({ from: line.from, to: line.from + prefix.length });
    } else if (!line.text.startsWith(prefix)) {
      chain.insertContentAt(line.from, prefix);
    }
  }
  chain.run();
}

const HEADING_REGEX = /^(#{1,6}) /;

/**
 * Set heading level on the current line. If the line already starts with this
 * exact heading level's prefix, remove it. If it has a different level, replace.
 */
export function toggleHeading(editor: Editor, level: 1 | 2 | 3 | 4 | 5 | 6): void {
  const lines = linesInSelection(editor);
  if (lines.length === 0) return;

  const target = "#".repeat(level) + " ";
  const line = lines[0]; // operate on the line containing the caret

  const match = line.text.match(HEADING_REGEX);
  const chain = editor.chain().focus();

  if (match && match[1].length === level) {
    // Same level: remove.
    chain.deleteRange({ from: line.from, to: line.from + target.length });
  } else if (match) {
    // Different level: replace the existing prefix.
    const existing = match[0]; // e.g. "## "
    chain.deleteRange({ from: line.from, to: line.from + existing.length });
    chain.insertContentAt(line.from, target);
  } else {
    // No prefix: insert.
    chain.insertContentAt(line.from, target);
  }
  chain.run();
}

export function insertAtCursor(editor: Editor, text: string): void {
  editor.chain().focus().insertContent(text).run();
}

/**
 * Insert an HR as three new paragraphs (empty, "---", empty) right after the
 * current paragraph. Raw "\n\n---\n\n" text insertion doesn't create paragraph
 * breaks — we must emit ProseMirror paragraph JSON explicitly.
 */
export function insertHorizontalRule(editor: Editor): void {
  const { state } = editor;
  const { $from } = state.selection;
  // Position directly after the current paragraph (ancestor at $from.depth).
  const afterParagraph = $from.after($from.depth);
  editor
    .chain()
    .focus()
    .insertContentAt(afterParagraph, [
      { type: "paragraph", content: [] },
      { type: "paragraph", content: [{ type: "text", text: "---" }] },
      { type: "paragraph", content: [] },
    ])
    .run();
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/client/toolbar-actions.test.ts
```
Expected: 13 passing.

- [ ] **Step 5: Full suite**

```bash
pnpm test
```
Expected: 96 passing (83 + 13).

- [ ] **Step 6: Commit**

```bash
git add src/lib/editor/toolbar-actions.ts tests/client/toolbar-actions.test.ts
git commit -m "feat(editor): toolbar-actions pure text manipulation helpers"
```

---

## Task 4: Extend md-decorations plugin for inner-content styling

**Goal:** Add visual styling to the *text between* Markdown syntax pairs. The existing `.md-syntax` (fade the chars) stays; add `.md-bold`, `.md-italic`, `.md-strike`, `.md-code` for the inner content.

**Files:**
- Modify: `/src/lib/editor/md-decorations.ts`
- Modify: `/src/styles.css` (new utility classes)
- Modify: `/tests/client/md-decorations.test.ts`

- [ ] **Step 1: Extend CSS first**

Edit `/Users/traviswilson/Development/markdown-collaboration/src/styles.css`. Find the `.md-syntax` block and add the following rules immediately after it:

```css
/* Inline styling for content between Markdown syntax pairs. Applied by the
   same ProseMirror decoration plugin as .md-syntax. */
.md-bold {
  font-weight: 700;
}
.md-italic {
  font-style: italic;
}
.md-strike {
  text-decoration: line-through;
}
.md-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: var(--muted);
  padding: 0 4px;
  border-radius: 3px;
}
```

- [ ] **Step 2: Update tests**

Replace `/Users/traviswilson/Development/markdown-collaboration/tests/client/md-decorations.test.ts` with:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { schema as basicSchema } from "prosemirror-schema-basic";
import {
  mdDecorationsPlugin,
  MD_DECORATIONS_KEY,
} from "../../src/lib/editor/md-decorations";

function buildState(text: string) {
  const doc = basicSchema.node(
    "doc",
    null,
    basicSchema.node("paragraph", null, text ? basicSchema.text(text) : []),
  );
  return EditorState.create({
    doc,
    schema: basicSchema,
    plugins: [mdDecorationsPlugin()],
  });
}

function decorationsWithClass(state: EditorState, className: string): number {
  const set = MD_DECORATIONS_KEY.getState(state);
  if (!set) return 0;
  return set
    .find()
    .filter((d) => {
      // ProseMirror's Decoration spec exposes attributes under `type.attrs`.
      // We inspect the attrs.class string to count matching decorations.
      const attrs = (d as unknown as { type: { attrs?: { class?: string } } }).type.attrs;
      return attrs && typeof attrs.class === "string" && attrs.class === className;
    }).length;
}

describe("mdDecorationsPlugin — syntax fading", () => {
  it("fades bold asterisks", () => {
    const state = buildState("**hello**");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades italic underscores", () => {
    const state = buildState("_hi_");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades inline code backticks", () => {
    const state = buildState("`code`");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades heading markers at line start", () => {
    const state = buildState("## Heading");
    expect(decorationsWithClass(state, "md-syntax")).toBe(1);
  });

  it("produces zero syntax decorations for plain text", () => {
    const state = buildState("no syntax here");
    expect(decorationsWithClass(state, "md-syntax")).toBe(0);
  });
});

describe("mdDecorationsPlugin — inner-content styling", () => {
  it("applies .md-bold to the inner content of **...**", () => {
    const state = buildState("say **hello** friend");
    expect(decorationsWithClass(state, "md-bold")).toBe(1);
  });

  it("applies .md-italic to the inner content of *...*", () => {
    const state = buildState("this is *italic* text");
    expect(decorationsWithClass(state, "md-italic")).toBe(1);
  });

  it("applies .md-strike to ~~...~~", () => {
    const state = buildState("remove ~~this~~ please");
    expect(decorationsWithClass(state, "md-strike")).toBe(1);
  });

  it("applies .md-code to `...`", () => {
    const state = buildState("use `npm` to install");
    expect(decorationsWithClass(state, "md-code")).toBe(1);
  });
});
```

- [ ] **Step 3: Run test to confirm new assertions fail**

```bash
pnpm test tests/client/md-decorations.test.ts
```
Expected: the 4 new inner-content tests fail (counts are 0 because the plugin doesn't emit those decorations yet).

- [ ] **Step 4: Extend the plugin**

Replace the contents of `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/md-decorations.ts` with:

```typescript
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Exported so tests can read the plugin state via PluginKey.getState().
export const MD_DECORATIONS_KEY = new PluginKey<DecorationSet>("md-decorations");

// Pairs: delimiter regex and the CSS class to apply to the INNER content
// between the delimiters (in addition to `md-syntax` on the delimiters).
const PATTERNS: Array<{ regex: RegExp; innerClass: string }> = [
  { regex: /(\*\*)([^*]+?)(\*\*)/g, innerClass: "md-bold" },
  { regex: /(__)([^_]+?)(__)/g, innerClass: "md-bold" },
  { regex: /(~~)([^~]+?)(~~)/g, innerClass: "md-strike" },
  // Single * and _ must avoid adjacent delimiters so **x** doesn't match *x*.
  { regex: /(?<!\*)(\*)(?!\*)([^*]+?)(?<!\*)(\*)(?!\*)/g, innerClass: "md-italic" },
  { regex: /(?<!_)(_)(?!_)([^_]+?)(?<!_)(_)(?!_)/g, innerClass: "md-italic" },
  { regex: /(`)([^`]+?)(`)/g, innerClass: "md-code" },
];

const HEADING_REGEX = /^(#{1,6})(\s)/gm;
const BLOCKQUOTE_REGEX = /^(>)(\s)/gm;

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    const base = pos;

    for (const { regex, innerClass } of PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const openStart = base + m.index;
        const openEnd = openStart + m[1].length;
        const innerStart = openEnd;
        const innerEnd = innerStart + m[2].length;
        const closeStart = innerEnd;
        const closeEnd = closeStart + m[3].length;

        decorations.push(
          Decoration.inline(openStart, openEnd, { class: "md-syntax" }),
          Decoration.inline(innerStart, innerEnd, { class: innerClass }),
          Decoration.inline(closeStart, closeEnd, { class: "md-syntax" }),
        );
      }
    }

    HEADING_REGEX.lastIndex = 0;
    let h: RegExpExecArray | null;
    while ((h = HEADING_REGEX.exec(text)) !== null) {
      const start = base + h.index;
      const end = start + h[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }

    BLOCKQUOTE_REGEX.lastIndex = 0;
    let b: RegExpExecArray | null;
    while ((b = BLOCKQUOTE_REGEX.exec(text)) !== null) {
      const start = base + b.index;
      const end = start + b[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }
  });

  return DecorationSet.create(state.doc, decorations);
}

export function mdDecorationsPlugin() {
  return new Plugin<DecorationSet>({
    key: MD_DECORATIONS_KEY,
    state: {
      init(_config, state) {
        return buildDecorations(state);
      },
      apply(tr, oldSet, _oldState, newState) {
        if (!tr.docChanged) return oldSet;
        return buildDecorations(newState);
      },
    },
    props: {
      decorations(state) {
        return MD_DECORATIONS_KEY.getState(state);
      },
    },
  });
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/client/md-decorations.test.ts
```
Expected: 9 passing (5 syntax + 4 inner-content).

- [ ] **Step 6: Full suite + build**

```bash
pnpm test
pnpm build:client
```
Expected: 100 passing (96 + 4 new); build clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/editor/md-decorations.ts src/styles.css tests/client/md-decorations.test.ts
git commit -m "feat(editor): decorations plugin styles inner content of wrapped Markdown"
```

---

## Task 5: CommentAnchor mark + register in editor

**Goal:** Add a `commentAnchor` ProseMirror mark with a `threadId` attribute to the TipTap schema. Highlighted ranges get a subtle background via `.comment-anchor` CSS.

**Files:**
- Create: `/src/lib/editor/comment-mark.ts`
- Modify: `/src/lib/editor/editor.ts`
- Modify: `/src/styles.css`

- [ ] **Step 1: Implement the mark**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/comment-mark.ts`:

```typescript
import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentAnchorOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentAnchor: {
      setCommentAnchor: (threadId: string) => ReturnType;
      unsetCommentAnchor: () => ReturnType;
    };
  }
}

export const CommentAnchor = Mark.create<CommentAnchorOptions>({
  name: "commentAnchor",
  inclusive: false,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-thread-id"),
        renderHTML: (attrs) => {
          if (!attrs.threadId) return {};
          return { "data-comment-thread-id": attrs.threadId };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-comment-thread-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "comment-anchor",
      }),
      0,
    ];
  },
  addCommands() {
    return {
      setCommentAnchor:
        (threadId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { threadId }),
      unsetCommentAnchor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
```

- [ ] **Step 2: Register in the editor factory**

Edit `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/editor.ts`. Add the import near the top (next to the md-decorations import):

```typescript
import { CommentAnchor } from "./comment-mark";
```

And add `CommentAnchor` to the extensions array, right before `MdSyntaxDecorations`:

```typescript
      CommentAnchor,
      MdSyntaxDecorations,
```

- [ ] **Step 3: Add CSS for the anchor + flash animation**

In `/Users/traviswilson/Development/markdown-collaboration/src/styles.css`, append:

```css
.comment-anchor {
  background: color-mix(in oklch, var(--primary) 18%, transparent);
  border-radius: 2px;
  cursor: pointer;
}

.comment-anchor-flash {
  animation: comment-anchor-flash 900ms ease-out;
}

@keyframes comment-anchor-flash {
  0%   { background: color-mix(in oklch, var(--primary) 45%, transparent); }
  100% { background: color-mix(in oklch, var(--primary) 18%, transparent); }
}
```

- [ ] **Step 4: Verify build + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all green, 100 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/editor/comment-mark.ts src/lib/editor/editor.ts src/styles.css
git commit -m "feat(editor): CommentAnchor mark with threadId attribute"
```

---

## Task 6: Selection action registry

**Goal:** Small pluggable registry: Phase 3 registers `Comment`; Phase 4 will register AI actions. The floating button reads from this registry.

**Files:**
- Create: `/src/lib/editor/selection-actions.ts`
- Create: `/tests/client/selection-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/selection-actions.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerSelectionAction,
  unregisterSelectionAction,
  getSelectionActions,
  clearSelectionActions,
  type SelectionAction,
} from "../../src/lib/editor/selection-actions";

function dummyAction(id: string): SelectionAction {
  return {
    id,
    label: id,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onInvoke: () => {},
  };
}

describe("selection-actions registry", () => {
  beforeEach(() => clearSelectionActions());

  it("returns empty when nothing registered", () => {
    expect(getSelectionActions()).toEqual([]);
  });

  it("registers and returns in insertion order", () => {
    registerSelectionAction(dummyAction("a"));
    registerSelectionAction(dummyAction("b"));
    expect(getSelectionActions().map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("unregisters by id", () => {
    registerSelectionAction(dummyAction("a"));
    registerSelectionAction(dummyAction("b"));
    unregisterSelectionAction("a");
    expect(getSelectionActions().map((a) => a.id)).toEqual(["b"]);
  });

  it("re-registering an existing id replaces it", () => {
    registerSelectionAction({ ...dummyAction("a"), label: "original" });
    registerSelectionAction({ ...dummyAction("a"), label: "updated" });
    const actions = getSelectionActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("updated");
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/selection-actions.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/selection-actions.ts`:

```typescript
import type { Editor } from "@tiptap/core";
import type { ComponentType } from "react";

export interface SelectionActionContext {
  editor: Editor;
  from: number;
  to: number;
  selectedText: string;
}

export interface SelectionAction {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onInvoke: (ctx: SelectionActionContext) => void;
  /** Return false to hide this action for the current selection. */
  visibleWhen?: (ctx: SelectionActionContext) => boolean;
}

const actions = new Map<string, SelectionAction>();

export function registerSelectionAction(action: SelectionAction): void {
  actions.set(action.id, action);
}

export function unregisterSelectionAction(id: string): void {
  actions.delete(id);
}

export function getSelectionActions(): SelectionAction[] {
  return Array.from(actions.values());
}

/** For tests only. */
export function clearSelectionActions(): void {
  actions.clear();
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/client/selection-actions.test.ts
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/editor/selection-actions.ts tests/client/selection-actions.test.ts
git commit -m "feat(editor): selection action registry"
```

---

## Task 7: useThreads hook

**Goal:** React hook that subscribes to the threads Y.Map + the editor's transactions, returns a stable-sorted `Thread[]`.

**Files:**
- Create: `/src/hooks/useThreads.ts`
- Create: `/tests/client/use-threads.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/use-threads.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { useThreads } from "../../src/hooks/useThreads";
import { createThread, setResolved } from "../../src/lib/comments/threads";

describe("useThreads", () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
  });

  it("returns [] when no threads exist", () => {
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toEqual([]);
  });

  it("returns threads created before the hook mounted", () => {
    createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "x",
      createdAt: 1,
    });
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toHaveLength(1);
  });

  it("updates when a thread is added after mount", () => {
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toHaveLength(0);

    act(() => {
      createThread(ydoc, {
        authorName: "B",
        authorColor: "#111",
        body: "y",
        createdAt: 2,
      });
    });

    expect(result.current).toHaveLength(1);
  });

  it("reflects resolved flag updates", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "x",
      createdAt: 1,
    });
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current[0].resolved).toBe(false);

    act(() => {
      setResolved(ydoc, id, true);
    });

    expect(result.current[0].resolved).toBe(true);
  });

  it("returns [] when ydoc is null", () => {
    const { result } = renderHook(() => useThreads(null, null));
    expect(result.current).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/use-threads.test.tsx
```
Expected: module not found.

- [ ] **Step 3: Implement the hook**

Create `/Users/traviswilson/Development/markdown-collaboration/src/hooks/useThreads.ts`:

```typescript
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type * as Y from "yjs";
import { listThreads, getThreadsMap } from "~/lib/comments/threads";
import type { Thread } from "~/lib/comments/types";

/**
 * Subscribe to the shared Y.Doc's threads map (and the editor's transactions
 * so document-order re-sort picks up mark movements). Returns a reactive
 * array. Pass `editor` as null if you only need map updates without re-sorts.
 */
export function useThreads(editor: Editor | null, ydoc: Y.Doc | null): Thread[] {
  const [threads, setThreads] = useState<Thread[]>(() => (ydoc ? listThreads(ydoc) : []));

  useEffect(() => {
    if (!ydoc) {
      setThreads([]);
      return;
    }
    const map = getThreadsMap(ydoc);
    const refresh = () => setThreads(listThreads(ydoc));
    map.observe(refresh);
    refresh();
    return () => map.unobserve(refresh);
  }, [ydoc]);

  useEffect(() => {
    if (!editor || !ydoc) return;
    const refresh = () => setThreads(listThreads(ydoc));
    editor.on("transaction", refresh);
    return () => {
      editor.off("transaction", refresh);
    };
  }, [editor, ydoc]);

  return threads;
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/client/use-threads.test.tsx
```
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useThreads.ts tests/client/use-threads.test.tsx
git commit -m "feat(comments): useThreads hook subscribes to Y.Map and editor transactions"
```

---

## Task 8: Toolbar component

**Goal:** Persistent top toolbar with icon buttons that invoke `toolbar-actions`. Rendered above the editor host in Document route (integration happens in Task 13).

**Files:**
- Create: `/src/components/editor/ToolbarButton.tsx`
- Create: `/src/components/editor/Toolbar.tsx`
- Create: `/tests/client/toolbar.test.tsx`

- [ ] **Step 1: Create ToolbarButton**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/editor/ToolbarButton.tsx`:

```typescript
import type { ComponentType, MouseEvent } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export interface ToolbarButtonProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "data-testid"?: string;
}

export function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  "data-testid": testid,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          data-testid={testid}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Create Toolbar**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/editor/Toolbar.tsx`:

```typescript
import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
} from "lucide-react";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ToolbarButton } from "./ToolbarButton";
import {
  wrapSelection,
  toggleLinePrefix,
  toggleHeading,
  insertHorizontalRule,
} from "~/lib/editor/toolbar-actions";

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function Toolbar({ editor, disabled = false }: ToolbarProps) {
  const noop = () => {};
  const act = (fn: () => void) => (disabled || !editor ? noop : fn);
  const e = editor; // narrowing helper

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="toolbar"
        aria-label="Formatting toolbar"
        className="flex items-center gap-1 border border-b-0 border-border rounded-t bg-background px-2 py-1"
      >
        <ToolbarButton
          label="Heading 1"
          icon={Heading1}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 1))}
          data-testid="tb-h1"
        />
        <ToolbarButton
          label="Heading 2"
          icon={Heading2}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 2))}
          data-testid="tb-h2"
        />
        <ToolbarButton
          label="Heading 3"
          icon={Heading3}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 3))}
          data-testid="tb-h3"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Bold"
          icon={Bold}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "**", "**"))}
          data-testid="tb-bold"
        />
        <ToolbarButton
          label="Italic"
          icon={Italic}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "*", "*"))}
          data-testid="tb-italic"
        />
        <ToolbarButton
          label="Strikethrough"
          icon={Strikethrough}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "~~", "~~"))}
          data-testid="tb-strike"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Bullet list"
          icon={List}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "- "))}
          data-testid="tb-bullet"
        />
        <ToolbarButton
          label="Numbered list"
          icon={ListOrdered}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "1. "))}
          data-testid="tb-numbered"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Code block"
          icon={Code}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "```\n", "\n```"))}
          data-testid="tb-code"
        />
        <ToolbarButton
          label="Blockquote"
          icon={Quote}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "> "))}
          data-testid="tb-quote"
        />
        <ToolbarButton
          label="Horizontal rule"
          icon={Minus}
          disabled={disabled || !e}
          onClick={act(() => insertHorizontalRule(e!))}
          data-testid="tb-hr"
        />
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 3: Write the component test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/toolbar.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "../../src/components/editor/Toolbar";

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: () => ({
        matches: false,
        media: "",
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  class R {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: typeof R }).ResizeObserver = R;
});

function makeEditor(content: string): Editor {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new Editor({
    element: host,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        bold: false,
        italic: false,
        strike: false,
      }),
    ],
    content: {
      type: "doc",
      content: [
        { type: "paragraph", content: content ? [{ type: "text", text: content }] : [] },
      ],
    },
  });
}

describe("Toolbar", () => {
  it("renders 11 buttons (H1/H2/H3, B/I/S, lists, code, quote, HR)", () => {
    const editor = makeEditor("hi");
    render(<Toolbar editor={editor} />);
    const ids = [
      "tb-h1", "tb-h2", "tb-h3",
      "tb-bold", "tb-italic", "tb-strike",
      "tb-bullet", "tb-numbered",
      "tb-code", "tb-quote", "tb-hr",
    ];
    for (const id of ids) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
    editor.destroy();
  });

  it("Bold button wraps the selection with **", () => {
    const editor = makeEditor("hello");
    editor.commands.setTextSelection({ from: 1, to: 6 });
    render(<Toolbar editor={editor} />);
    fireEvent.click(screen.getByTestId("tb-bold"));
    expect(editor.getText({ blockSeparator: "\n" })).toBe("**hello**");
    editor.destroy();
  });

  it("disables buttons when disabled prop is true", () => {
    const editor = makeEditor("x");
    render(<Toolbar editor={editor} disabled />);
    expect(screen.getByTestId("tb-bold").hasAttribute("disabled")).toBe(true);
    editor.destroy();
  });

  it("H1 button on an empty paragraph inserts '# '", () => {
    const editor = makeEditor("Title");
    render(<Toolbar editor={editor} />);
    fireEvent.click(screen.getByTestId("tb-h1"));
    expect(editor.getText({ blockSeparator: "\n" })).toBe("# Title");
    editor.destroy();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/client/toolbar.test.tsx
```
Expected: 4 passing.

- [ ] **Step 5: Full suite**

```bash
pnpm test
```
Expected: 113 passing (100 + 5 use-threads + 4 toolbar + 4 selection-actions).

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/ tests/client/toolbar.test.tsx
git commit -m "feat(client): Toolbar component with 11 formatting buttons"
```

---

## Task 9: CommentComposer component

**Goal:** Simple `<Textarea>` with Post/Cancel buttons, Cmd+Enter to submit, Esc to cancel.

**Files:**
- Create: `/src/components/editor/CommentComposer.tsx`

- [ ] **Step 1: Implement**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/editor/CommentComposer.tsx`:

```typescript
import { useState, useCallback, type KeyboardEvent } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export interface CommentComposerProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (body: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function CommentComposer({
  placeholder = "Write a comment…",
  submitLabel = "Post",
  onSubmit,
  onCancel,
  autoFocus = true,
}: CommentComposerProps) {
  const [body, setBody] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setBody("");
  }, [body, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={body.trim().length === 0}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/CommentComposer.tsx
git commit -m "feat(client): CommentComposer with keyboard shortcuts"
```

---

## Task 10: FloatingCommentButton

**Goal:** Position-absolute button that appears above the current selection and invokes a registered "comment" action. Reads from the selection-actions registry; registration of the `comment` action happens in the Document route (Task 13).

**Files:**
- Create: `/src/components/editor/FloatingCommentButton.tsx`

- [ ] **Step 1: Implement**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/editor/FloatingCommentButton.tsx`:

```typescript
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import { getSelectionActions } from "~/lib/editor/selection-actions";

interface FloatingCommentButtonProps {
  editor: Editor | null;
  /** When true, hide the button entirely (e.g. view-only users). */
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
}

export function FloatingCommentButton({ editor, disabled }: FloatingCommentButtonProps) {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!editor || disabled) {
      setPosition(null);
      return;
    }
    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setPosition(null);
        return;
      }
      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        // Place the button above the middle of the selection.
        const left = (start.left + end.left) / 2;
        const top = Math.min(start.top, end.top) - 48; // 48px above
        setPosition({ top, left });
      } catch {
        setPosition(null);
      }
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    // Initial compute
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor, disabled]);

  if (!editor || !position || disabled) return null;

  const invoke = (id: string) => {
    const actions = getSelectionActions();
    const action = actions.find((a) => a.id === id);
    if (!action) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    action.onInvoke({ editor, from, to, selectedText });
  };

  return (
    <div
      data-testid="floating-selection-bar"
      className="fixed z-50 flex items-center gap-1 rounded border border-border bg-background px-1 py-1 shadow-md"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => invoke("comment")}
        aria-label="Add comment"
      >
        <MessageSquare className="mr-1 h-4 w-4" />
        Comment
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/FloatingCommentButton.tsx
git commit -m "feat(client): FloatingCommentButton positions above selection"
```

---

## Task 11: Sidebar components — CommentChip, ThreadCard, CommentSidebar

**Goal:** Header chip + collapsible sidebar with thread cards. Covered by one test file.

**Files:**
- Create: `/src/components/comments/CommentChip.tsx`
- Create: `/src/components/comments/ThreadCard.tsx`
- Create: `/src/components/comments/CommentSidebar.tsx`
- Create: `/tests/client/comment-sidebar.test.tsx`

- [ ] **Step 1: CommentChip**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/comments/CommentChip.tsx`:

```typescript
import { MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";

interface CommentChipProps {
  count: number;
  onClick: () => void;
  active?: boolean;
}

export function CommentChip({ count, onClick, active }: CommentChipProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      aria-label={`${count} unresolved comments`}
      className="gap-1"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-xs tabular-nums">{count}</span>
    </Button>
  );
}
```

- [ ] **Step 2: ThreadCard**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/comments/ThreadCard.tsx`:

```typescript
import { useState } from "react";
import { Check, Trash2, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CommentComposer } from "~/components/editor/CommentComposer";
import type { Thread } from "~/lib/comments/types";

interface ThreadCardProps {
  thread: Thread;
  currentAuthorName: string;
  readOnly: boolean;
  anchorText: string;
  onReply: (body: string) => void;
  onResolveToggle: () => void;
  onDeleteThreadRoot: () => void;
  onDeleteReply: (replyId: string) => void;
  onClickAnchor: () => void;
}

function formatRelative(createdAt: number): string {
  const diffMs = Date.now() - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString();
}

export function ThreadCard({
  thread,
  currentAuthorName,
  readOnly,
  anchorText,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: ThreadCardProps) {
  const [replying, setReplying] = useState(false);

  return (
    <div
      className="rounded border border-border bg-background p-3 text-sm"
      data-testid={`thread-${thread.id}`}
      data-resolved={thread.resolved ? "true" : "false"}
    >
      <button
        type="button"
        onClick={onClickAnchor}
        className="mb-2 block w-full truncate border-l-2 border-primary/40 pl-2 text-left text-xs italic text-muted-foreground hover:text-foreground"
      >
        “{anchorText || "(deleted anchor)"}”
      </button>

      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: thread.authorColor }}
          >
            {thread.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(thread.createdAt)}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onResolveToggle}
              aria-label={thread.resolved ? "Unresolve" : "Resolve"}
              title={thread.resolved ? "Unresolve" : "Resolve"}
            >
              {thread.resolved ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            {thread.authorName === currentAuthorName && !thread.rootDeleted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteThreadRoot}
                aria-label="Delete comment"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="whitespace-pre-wrap">
        {thread.rootDeleted ? (
          <span className="italic text-muted-foreground">[deleted]</span>
        ) : (
          thread.body
        )}
      </p>

      {thread.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-border pl-3">
          {thread.replies.map((reply) => (
            <div key={reply.id} className="text-xs" data-testid={`reply-${reply.id}`}>
              <div className="mb-0.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: reply.authorColor }}
                  >
                    {reply.authorName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelative(reply.createdAt)}
                  </span>
                </div>
                {!readOnly && reply.authorName === currentAuthorName && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReply(reply.id)}
                    aria-label="Delete reply"
                    title="Delete reply"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-3">
          {replying ? (
            <CommentComposer
              placeholder="Write a reply…"
              submitLabel="Reply"
              onCancel={() => setReplying(false)}
              onSubmit={(body) => {
                onReply(body);
                setReplying(false);
              }}
            />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setReplying(true)}>
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: CommentSidebar**

Create `/Users/traviswilson/Development/markdown-collaboration/src/components/comments/CommentSidebar.tsx`:

```typescript
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThreadCard } from "./ThreadCard";
import type { Thread } from "~/lib/comments/types";

interface CommentSidebarProps {
  threads: Thread[];
  currentAuthorName: string;
  readOnly: boolean;
  onClose: () => void;
  resolveAnchor: (thread: Thread) => string;
  onReply: (threadId: string, body: string) => void;
  onResolveToggle: (threadId: string, next: boolean) => void;
  onDeleteThreadRoot: (threadId: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  onClickAnchor: (threadId: string) => void;
}

export function CommentSidebar({
  threads,
  currentAuthorName,
  readOnly,
  onClose,
  resolveAnchor,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: CommentSidebarProps) {
  const [showResolved, setShowResolved] = useState(false);

  const visible = threads.filter((t) => (showResolved ? true : !t.resolved));
  const resolvedCount = threads.filter((t) => t.resolved).length;

  return (
    <aside
      data-testid="comment-sidebar"
      className="flex w-80 flex-col gap-3 border-l border-border bg-muted/20 p-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-sm font-semibold">Comments ({threads.length})</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {resolvedCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            data-testid="show-resolved"
          />
          Show resolved ({resolvedCount})
        </label>
      )}

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {threads.length === 0
            ? "No comments yet. Select text and click Comment."
            : "No unresolved comments. Toggle “Show resolved” to see them."}
        </p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto">
          {visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentAuthorName={currentAuthorName}
              readOnly={readOnly}
              anchorText={resolveAnchor(thread)}
              onReply={(body) => onReply(thread.id, body)}
              onResolveToggle={() => onResolveToggle(thread.id, !thread.resolved)}
              onDeleteThreadRoot={() => onDeleteThreadRoot(thread.id)}
              onDeleteReply={(replyId) => onDeleteReply(thread.id, replyId)}
              onClickAnchor={() => onClickAnchor(thread.id)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 4: Write component tests**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/comment-sidebar.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentSidebar } from "../../src/components/comments/CommentSidebar";
import type { Thread } from "../../src/lib/comments/types";

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "t1",
    authorName: "Sakura",
    authorColor: "#e11d48",
    body: "Nice",
    createdAt: Date.now(),
    resolved: false,
    replies: [],
    ...overrides,
  };
}

const noop = () => {};
const basicHandlers = {
  onClose: noop,
  onReply: noop,
  onResolveToggle: noop,
  onDeleteThreadRoot: noop,
  onDeleteReply: noop,
  onClickAnchor: noop,
  resolveAnchor: () => "anchor text",
};

describe("CommentSidebar", () => {
  it("shows empty-state when no threads", () => {
    render(
      <CommentSidebar
        threads={[]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText(/No comments yet/i)).toBeTruthy();
  });

  it("renders a thread card", () => {
    render(
      <CommentSidebar
        threads={[makeThread({ body: "Hello world" })]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("hides resolved threads by default", () => {
    render(
      <CommentSidebar
        threads={[
          makeThread({ id: "open", body: "open thread" }),
          makeThread({ id: "done", body: "closed thread", resolved: true }),
        ]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText("open thread")).toBeTruthy();
    expect(screen.queryByText("closed thread")).toBeNull();
  });

  it("toggling Show resolved reveals resolved threads", () => {
    render(
      <CommentSidebar
        threads={[
          makeThread({ id: "done", body: "closed thread", resolved: true }),
        ]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    const toggle = screen.getByTestId("show-resolved") as HTMLInputElement;
    fireEvent.click(toggle);
    expect(screen.getByText("closed thread")).toBeTruthy();
  });

  it("onClose fires when the X button is clicked", () => {
    const onClose = vi.fn();
    render(
      <CommentSidebar
        threads={[]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close sidebar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/client/comment-sidebar.test.tsx
```
Expected: 5 passing.

- [ ] **Step 6: Full suite**

```bash
pnpm test
```
Expected: 118 passing (113 + 5).

- [ ] **Step 7: Commit**

```bash
git add src/components/comments/ tests/client/comment-sidebar.test.tsx
git commit -m "feat(comments): CommentChip + ThreadCard + CommentSidebar with show-resolved toggle"
```

---

## Task 12: Document route — toolbar + sidebar integration

**Goal:** Document.tsx now renders Toolbar above the editor, FloatingCommentButton on selection, CommentChip in the header, and CommentSidebar on the right. Registers the `comment` selection action at mount time.

**Files:**
- Modify: `/src/routes/Document.tsx`

- [ ] **Step 1: Rewrite Document.tsx**

Replace `/Users/traviswilson/Development/markdown-collaboration/src/routes/Document.tsx` with:

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import type { Editor } from "@tiptap/core";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import { createEditor } from "~/lib/editor/editor";
import { renderMarkdown } from "~/lib/preview/render";
import { getOrCreateIdentity } from "~/lib/user/identity";
import { ThemeToggle } from "~/lib/theme/ThemeToggle";
import { useHighlightTheme } from "~/lib/preview/theme";
import { Toolbar } from "~/components/editor/Toolbar";
import { FloatingCommentButton } from "~/components/editor/FloatingCommentButton";
import { CommentComposer } from "~/components/editor/CommentComposer";
import { CommentChip } from "~/components/comments/CommentChip";
import { CommentSidebar } from "~/components/comments/CommentSidebar";
import {
  registerSelectionAction,
  unregisterSelectionAction,
} from "~/lib/editor/selection-actions";
import {
  createThread,
  addReply,
  setResolved,
  deleteThreadRoot,
  deleteReply,
} from "~/lib/comments/threads";
import { useThreads } from "~/hooks/useThreads";
import type { Thread } from "~/lib/comments/types";
import type { PermissionLevel } from "@shared/types";

interface ComposerState {
  from: number;
  to: number;
  selectedText: string;
}

export default function DocumentRoute() {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  const navigate = useNavigate();
  useHighlightTheme();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [markdown, setMarkdown] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerState | null>(null);

  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);
  const identityRef = useRef(getOrCreateIdentity());

  const threads = useThreads(editor, connectionRef.current?.ydoc ?? null);
  const unresolvedCount = threads.filter((t) => !t.resolved).length;
  const readOnly = permissionLevel === "view";

  // Load permission
  useEffect(() => {
    if (!docId || !key) {
      setLoadError("Missing doc id or key");
      return;
    }
    let cancelled = false;
    getDocument(docId, key)
      .then((res) => {
        if (!cancelled) setPermissionLevel(res.permissionLevel);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [docId, key]);

  useEffect(() => {
    if (!loadError) return;
    const t = setTimeout(() => navigate("/", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [loadError, navigate]);

  // Open editor once permission is known
  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const host = editorHostRef.current;
    if (!host) return;

    const conn = connect(docId, key);
    connectionRef.current = conn;

    const identity = identityRef.current;
    const tipTapEditor = createEditor({
      element: host,
      ydoc: conn.ydoc,
      provider: conn.provider,
      identity,
      editable: permissionLevel === "edit",
    });
    setEditor(tipTapEditor);

    const syncMarkdown = () => {
      const md = tipTapEditor.getText({ blockSeparator: "\n\n" });
      setMarkdown(md);
    };
    syncMarkdown();
    tipTapEditor.on("update", syncMarkdown);
    tipTapEditor.on("transaction", syncMarkdown);

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      conn.provider.off("status", handleStatus);
      tipTapEditor.off("update", syncMarkdown);
      tipTapEditor.off("transaction", syncMarkdown);
      tipTapEditor.destroy();
      conn.destroy();
      setEditor(null);
      connectionRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  // Register the Comment selection action
  useEffect(() => {
    if (!editor || readOnly) return;
    registerSelectionAction({
      id: "comment",
      label: "Comment",
      onInvoke: ({ from, to, selectedText }) => {
        setComposer({ from, to, selectedText });
      },
    });
    return () => unregisterSelectionAction("comment");
  }, [editor, readOnly]);

  // Post a new comment
  const handlePostComment = useCallback(
    (body: string) => {
      if (!editor || !connectionRef.current || !composer) return;
      const ydoc = connectionRef.current.ydoc;
      const threadId = createThread(ydoc, {
        authorName: identityRef.current.name,
        authorColor: identityRef.current.color,
        body,
        createdAt: Date.now(),
      });
      // Apply the mark to the original selection range.
      editor
        .chain()
        .focus()
        .setTextSelection({ from: composer.from, to: composer.to })
        .setCommentAnchor(threadId)
        .run();
      setComposer(null);
      setSidebarOpen(true);
    },
    [editor, composer],
  );

  const handleScrollToAnchor = useCallback(
    (threadId: string) => {
      if (!editor) return;
      let foundFrom: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === "commentAnchor" && mark.attrs.threadId === threadId) {
            if (foundFrom === null) foundFrom = pos;
          }
        });
      });
      if (foundFrom === null) return;
      editor.commands.setTextSelection({ from: foundFrom, to: foundFrom });
      const el = editor.view.domAtPos(foundFrom).node as HTMLElement | null;
      if (el && "scrollIntoView" in el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Flash animation
      const spans = editor.view.dom.querySelectorAll<HTMLElement>(
        `[data-comment-thread-id="${threadId}"]`,
      );
      spans.forEach((s) => {
        s.classList.add("comment-anchor-flash");
        setTimeout(() => s.classList.remove("comment-anchor-flash"), 900);
      });
    },
    [editor],
  );

  const resolveAnchor = useCallback(
    (thread: Thread): string => {
      if (!editor) return "";
      let found = "";
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === "commentAnchor" && mark.attrs.threadId === thread.id) {
            if (!found) {
              const text = node.text ?? "";
              found = text.slice(0, 80);
              void pos;
            }
          }
        });
      });
      return found;
    },
    [editor],
  );

  if (loadError) {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold">Can't open this document</h1>
        <p>{loadError}</p>
        <p className="text-xs text-muted-foreground">Redirecting to home…</p>
      </main>
    );
  }

  if (!permissionLevel) {
    return (
      <main className="p-4">
        <p>Loading document…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-screen max-w-[1400px] flex-col px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="m-0 text-lg font-semibold">Document</h1>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {status} · {readOnly ? "view only" : "editing"}
          </span>
          <div role="tablist" aria-label="View mode" className="flex rounded border border-border">
            <button
              role="tab"
              aria-selected={mode === "edit"}
              className={`px-3 py-1 text-sm transition-colors ${
                mode === "edit"
                  ? "bg-foreground text-background font-medium"
                  : "hover:bg-muted"
              }`}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              role="tab"
              aria-selected={mode === "preview"}
              className={`px-3 py-1 text-sm transition-colors ${
                mode === "preview"
                  ? "bg-foreground text-background font-medium"
                  : "hover:bg-muted"
              }`}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
          <CommentChip
            count={unresolvedCount}
            active={sidebarOpen}
            onClick={() => setSidebarOpen((v) => !v)}
          />
          <ThemeToggle />
        </div>
      </header>

      {mode === "edit" && <Toolbar editor={editor} disabled={readOnly} />}

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div
            ref={editorHostRef}
            className={`prose max-w-none border-2 ${mode === "edit" ? "rounded-b" : "rounded"} border-border bg-muted/30 p-4 font-mono text-sm ${
              mode === "edit" ? "" : "hidden"
            }`}
          />
          {mode === "preview" && (
            <div
              className="prose max-w-none rounded border border-border bg-background p-6 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          )}
        </div>

        {sidebarOpen && (
          <CommentSidebar
            threads={threads}
            currentAuthorName={identityRef.current.name}
            readOnly={readOnly}
            onClose={() => setSidebarOpen(false)}
            resolveAnchor={resolveAnchor}
            onReply={(threadId, body) => {
              const ydoc = connectionRef.current?.ydoc;
              if (!ydoc) return;
              addReply(ydoc, threadId, {
                authorName: identityRef.current.name,
                authorColor: identityRef.current.color,
                body,
                createdAt: Date.now(),
              });
            }}
            onResolveToggle={(threadId, next) => {
              const ydoc = connectionRef.current?.ydoc;
              if (!ydoc) return;
              setResolved(ydoc, threadId, next);
            }}
            onDeleteThreadRoot={(threadId) => {
              const ydoc = connectionRef.current?.ydoc;
              if (!ydoc) return;
              deleteThreadRoot(ydoc, threadId);
            }}
            onDeleteReply={(threadId, replyId) => {
              const ydoc = connectionRef.current?.ydoc;
              if (!ydoc) return;
              deleteReply(ydoc, threadId, replyId);
            }}
            onClickAnchor={handleScrollToAnchor}
          />
        )}
      </div>

      <FloatingCommentButton editor={editor} disabled={readOnly} />

      {composer && (
        <div
          className="fixed z-50 w-80 rounded border border-border bg-background p-3 shadow-lg"
          style={{ top: 120, right: 40 }}
          data-testid="inline-comment-composer"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Commenting on: <span className="italic">“{composer.selectedText.slice(0, 60)}”</span>
          </p>
          <CommentComposer
            onSubmit={handlePostComment}
            onCancel={() => setComposer(null)}
          />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify build + typecheck + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all green. Existing component tests for Document may need polyfill adjustments — if `tests/client/document-route.test.tsx` fails due to new mock surface area, add the needed stubs to its yjs-client mock (any new methods Document calls on `provider.awareness`).

- [ ] **Step 3: Commit**

```bash
git add src/routes/Document.tsx
git commit -m "feat(client): Document route integrates toolbar, comments, sidebar, floating button"
```

---

## Task 13: Commenting integration test

**Goal:** One integration test mounts the Document route with mocked api + yjs-client, simulates creating a comment, asserts the thread appears in the sidebar.

**Files:**
- Create: `/tests/client/commenting-flow.test.tsx`

- [ ] **Step 1: Write the test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/commenting-flow.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import * as Y from "yjs";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";
import { createThread } from "~/lib/comments/threads";

vi.mock("~/lib/api", () => ({
  getDocument: vi.fn(async () => ({
    document: {
      id: "doc-1",
      projectId: "proj-1",
      title: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    permissionLevel: "edit" as const,
  })),
}));

// Shared ydoc so the test can create a thread that the route also sees.
const ydoc = new Y.Doc();

vi.mock("~/lib/yjs-client", () => {
  return {
    connect: vi.fn(() => {
      const provider = {
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        awareness: {
          on: vi.fn(),
          off: vi.fn(),
          getStates: () => new Map(),
          states: new Map(),
          setLocalStateField: vi.fn(),
        },
      };
      return { ydoc, provider, destroy: () => {} };
    }),
  };
});

import DocumentRoute from "~/routes/Document";

function renderRoute(url: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/p/:projectId/d/:docId" element={<DocumentRoute />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("commenting flow", () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear any existing threads between tests
    const map = ydoc.getMap("threads");
    for (const key of map.keys()) map.delete(key);
    vi.clearAllMocks();
  });

  it("renders the comment chip with zero when there are no threads", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    expect(chip.textContent).toContain("0");
  });

  it("chip updates count when a thread is added to the Y.Map", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    await act(async () => {
      createThread(ydoc, {
        authorName: "Sakura",
        authorColor: "#e11d48",
        body: "Hey",
        createdAt: Date.now(),
      });
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    expect(chip.textContent).toContain("1");
  });

  it("opens the sidebar when the chip is clicked", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    await act(async () => {
      chip.click();
    });
    expect(screen.getByTestId("comment-sidebar")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm test tests/client/commenting-flow.test.tsx
```
Expected: 3 passing.

- [ ] **Step 3: Full suite**

```bash
pnpm test
```
Expected: 121 passing.

- [ ] **Step 4: Commit**

```bash
git add tests/client/commenting-flow.test.tsx
git commit -m "test(client): commenting-flow integration covers chip + sidebar open"
```

---

## Task 14: Polish — view-only gating + typecheck sweep

**Goal:** Double-check view-only path; fix any residual type issues surfaced by the full integration.

**Files:** Any files surfaced by typecheck.

- [ ] **Step 1: Full typecheck + lint + tests**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build:client
```
Expected: typecheck 0, lint ≤1 warning (pre-existing), 121 tests pass, build clean.

- [ ] **Step 2: Manual verification of view-only gating**

Confirm these conditions in code (no code changes if correct):

1. `src/components/editor/Toolbar.tsx` — `disabled` prop propagates to every ToolbarButton. ✓
2. `src/components/editor/FloatingCommentButton.tsx` — returns null when `disabled` is true. ✓
3. `src/routes/Document.tsx` — passes `disabled={readOnly}` to both. ✓
4. `src/routes/Document.tsx` — `registerSelectionAction` guarded by `if (!editor || readOnly) return;`. ✓
5. `src/components/comments/ThreadCard.tsx` — reply composer and action buttons hidden when `readOnly` is true. ✓

Document any gaps in your report; don't fix them here unless they are blockers (file them as follow-ups if the gating is incomplete in ways that only integration testing revealed).

- [ ] **Step 3: Commit (empty commit if nothing changed)**

Only if code changed:
```bash
git add -A
git commit -m "chore: final view-only gating polish"
```

If nothing changed, skip the commit.

---

## Task 15: shadcn audit + tag phase-3-complete

**Goal:** Final verification + tag.

- [ ] **Step 1: Run shadcn MCP audit**

Call:
```
mcp__shadcn__get_audit_checklist
```
Walk each checklist item. Fix anything flagged; otherwise report clean.

- [ ] **Step 2: Full verification**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build:client
```
Expected: all green.

- [ ] **Step 3: Manual two-browser smoke test**

```bash
docker compose ps
pnpm dev
```

In TWO browser windows:
1. Open the app, click "Create new doc" — lands in Edit mode with toolbar visible.
2. Type `# Hello` — heading appears with dimmed `#`; H1 toolbar button on the line toggles the prefix.
3. Select "Hello" — FloatingCommentButton appears above selection.
4. Click Comment → composer opens → type "Nice heading" → Cmd+Enter → posts. Sidebar opens.
5. Paste the URL in the second browser. The thread appears in its sidebar.
6. Reply to the thread from the second browser; first browser sees the reply.
7. Resolve the thread; it disappears from the default view. "Show resolved" toggle reveals it; unresolve restores.
8. Delete a reply: only the reply is removed. Delete a thread root with a reply present: body becomes "[deleted]".
9. Change the URL's `key` to the view token (query Postgres for it). Reload — toolbar disabled, floating Comment button does NOT appear, sidebar reply composers absent. Marks still highlight.
10. Kill and restart the server: content + threads persist.

- [ ] **Step 4: Tag**

```bash
git tag phase-3-complete
git tag -l | grep phase
```

- [ ] **Step 5: Report final state**

```bash
git log --oneline -25
```

---

## Spec Coverage Audit

| Spec section | Task(s) |
|---|---|
| §3.1 Toolbar | 8 |
| §3.2 Toolbar actions module | 3 |
| §3.3 Decorations extended | 4 |
| §3.4 CommentAnchor mark | 5 |
| §3.5 Thread types + storage | 1 |
| §3.6 useThreads hook | 7 |
| §3.7 FloatingCommentButton | 10 |
| §3.8 Selection action registry | 6 |
| §3.9 CommentComposer | 9 |
| §3.10 CommentSidebar | 11 |
| §3.11 ThreadCard | 11 |
| §3.12 Document integration | 12 |
| §5 Permissions | 8 (toolbar disabled), 10 (FloatingButton hidden), 12 (composer hidden), 14 (audit) |
| §6 Deletion semantics | 1 (tests cover), 11 (UI) |
| §7 Testing | 1, 3, 4, 6, 7, 8, 11, 13 |
| §8 Migration | 5 (forward-compat note in mark) + 1 (first-access creates Y.Map) |
| §9 Acceptance | 15 |

All spec requirements mapped. Total new tests: ~41 (8 threads + 13 toolbar-actions + 4 decorations-inner + 4 selection-actions + 5 use-threads + 4 toolbar + 5 sidebar + 3 flow = 46 actually; accept the number of passing tests over the 38 projection).
