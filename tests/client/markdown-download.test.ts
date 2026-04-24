// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  buildFilename,
  buildMarkdownFromEditor,
} from "~/lib/export/markdown-download";
import type { Editor } from "@tiptap/core";

function stubEditor(text: string): Editor {
  return {
    getText: ({ blockSeparator }: { blockSeparator: string }) =>
      text.split("\n").join(blockSeparator),
  } as unknown as Editor;
}

describe("buildFilename", () => {
  it("slugifies the title with .md extension", () => {
    expect(buildFilename("Hello World", "abcd1234-abcd")).toBe("hello-world.md");
  });

  it("falls back to document-<prefix>.md when title is empty", () => {
    expect(buildFilename("", "abcd1234-abcd")).toBe("document-abcd1234.md");
    expect(buildFilename(null, "abcd1234-abcd")).toBe("document-abcd1234.md");
    expect(buildFilename(undefined, "abcd1234-abcd")).toBe("document-abcd1234.md");
  });

  it("strips punctuation and emoji and collapses whitespace", () => {
    expect(buildFilename("  Spec v1: Ready! 🚀  ", "abcd1234")).toBe("spec-v1-ready.md");
  });

  it("caps slug at 80 chars", () => {
    const longTitle = "a".repeat(200);
    const out = buildFilename(longTitle, "abcd1234");
    // 80 chars + ".md"
    expect(out.length).toBe(83);
    expect(out.endsWith(".md")).toBe(true);
  });

  it("falls back when slug is empty after stripping (all punctuation title)", () => {
    expect(buildFilename("!!!", "abcd1234")).toBe("document-abcd1234.md");
  });
});

describe("buildMarkdownFromEditor", () => {
  it("returns editor text with blank-line block separators", () => {
    const editor = stubEditor("line1\nline2");
    expect(buildMarkdownFromEditor(editor)).toBe("line1\n\nline2");
  });

  it("returns empty string for an empty editor", () => {
    const editor = stubEditor("");
    expect(buildMarkdownFromEditor(editor)).toBe("");
  });
});
