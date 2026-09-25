import type { Editor } from "@tiptap/core";

/**
 * The Markdown source as it currently stands: one editor paragraph per
 * line, blank lines preserved, pending suggestions resolved the way the
 * document reads today (proposed insertions hidden, proposed deletions
 * still present). Used by Preview and by Markdown export.
 */
export function getSourceText(editor: Editor): string {
  const lines: string[] = [];
  editor.state.doc.forEach((block) => {
    let line = "";
    block.descendants((node) => {
      if (node.type.name === "hardBreak") {
        line += "\n";
        return false;
      }
      if (!node.isText) return true;
      if (node.marks.some((m) => m.type.name === "insertion")) return true;
      line += node.text ?? "";
      return true;
    });
    lines.push(line);
  });
  return lines.join("\n");
}
