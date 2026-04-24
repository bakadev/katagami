import type { Editor } from "@tiptap/core";

export function buildMarkdownFromEditor(editor: Editor): string {
  return editor.getText({ blockSeparator: "\n\n" });
}

export function buildFilename(title: string | null | undefined, docId: string): string {
  if (title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);
    if (slug) return `${slug}.md`;
  }
  return `document-${docId.slice(0, 8)}.md`;
}

export function downloadAsMarkdown(
  editor: Editor,
  title: string | null | undefined,
  docId: string,
): void {
  const md = buildMarkdownFromEditor(editor);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(title, docId);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
