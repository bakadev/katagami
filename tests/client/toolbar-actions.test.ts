// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from "vitest";
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
    editor.commands.setTextSelection({ from: 7, to: 12 });
    wrapSelection(editor, "**", "**");
    expect(docText(editor)).toBe("hello **world**");
  });

  it("unwraps if the selection is already wrapped", () => {
    editor = makeEditor("hello **world**");
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
