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
