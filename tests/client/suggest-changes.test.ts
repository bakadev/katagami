// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  SuggestChanges,
  SuggestionMarks,
  SuggestableDocument,
} from "../../src/lib/editor/suggest-changes";
import { getSourceText } from "../../src/lib/editor/source-text";

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: () => ({
        matches: false,
        media: "",
        onchange: null,
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

function makeEditor(onNewSuggestions = vi.fn()) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const editor = new Editor({
    element: host,
    extensions: [
      StarterKit.configure({
        document: false,
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
      SuggestableDocument,
      ...SuggestionMarks,
      SuggestChanges.configure({ onNewSuggestions }),
    ],
    content: "<p>Hello world</p>",
  });
  return { editor, host, onNewSuggestions };
}

/** Collect [text, markName, id] triples for every text node. */
function inspect(editor: Editor) {
  const out: { text: string; mark: string | null; id: string | null }[] = [];
  editor.state.doc.descendants((node) => {
    if (!node.isText) return true;
    const m = node.marks.find((mk) =>
      ["insertion", "deletion", "modification"].includes(mk.type.name),
    );
    out.push({
      text: node.text ?? "",
      mark: m ? m.type.name : null,
      id: m ? String(m.attrs.id) : null,
    });
    return true;
  });
  return out;
}

describe("SuggestChanges extension", () => {
  it("edits directly when suggesting is off", () => {
    const { editor } = makeEditor();
    editor.commands.insertContentAt(6, " big");
    expect(inspect(editor)).toEqual([{ text: "Hello big world", mark: null, id: null }]);
    editor.destroy();
  });

  it("wraps inserted text in an insertion mark with a string id and reports it", () => {
    const { editor, onNewSuggestions } = makeEditor();
    editor.commands.enableSuggesting();
    expect(editor.storage.suggestChanges.enabled).toBe(true);
    editor.commands.insertContentAt(6, " big");
    const parts = inspect(editor);
    const ins = parts.find((p) => p.mark === "insertion");
    expect(ins?.text).toBe(" big");
    expect(typeof ins?.id).toBe("string");
    expect(ins?.id?.length).toBeGreaterThan(6);
    expect(onNewSuggestions).toHaveBeenCalledWith([ins?.id]);
    editor.destroy();
  });

  it("marks deleted text instead of removing it", () => {
    const { editor } = makeEditor();
    editor.commands.enableSuggesting();
    // delete "world" (positions 7..12 inside the paragraph)
    editor.commands.deleteRange({ from: 7, to: 12 });
    const parts = inspect(editor);
    expect(parts.map((p) => p.text).join("")).toBe("Hello world");
    expect(parts.find((p) => p.text === "world")?.mark).toBe("deletion");
    editor.destroy();
  });

  it("accepts a deletion by removing the text, and an insertion by keeping it", () => {
    const { editor } = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.deleteRange({ from: 7, to: 12 });
    const delId = inspect(editor).find((p) => p.mark === "deletion")!.id!;
    editor.commands.insertContentAt(7, "there");
    const insId = inspect(editor).find((p) => p.mark === "insertion")!.id!;

    editor.commands.acceptSuggestion(delId);
    expect(editor.getText()).not.toContain("world");
    editor.commands.acceptSuggestion(insId);
    expect(inspect(editor)).toEqual([{ text: "Hello there", mark: null, id: null }]);
    editor.destroy();
  });

  it("rejects an insertion by removing it, and a deletion by unmarking it", () => {
    const { editor } = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.deleteRange({ from: 7, to: 12 });
    const delId = inspect(editor).find((p) => p.mark === "deletion")!.id!;
    editor.commands.insertContentAt(7, "there");
    const insId = inspect(editor).find((p) => p.mark === "insertion")!.id!;

    editor.commands.rejectSuggestion(insId);
    expect(editor.getText()).not.toContain("there");
    editor.commands.rejectSuggestion(delId);
    expect(inspect(editor)).toEqual([{ text: "Hello world", mark: null, id: null }]);
    editor.destroy();
  });

  it("goes back to direct editing when suggesting is disabled", () => {
    const { editor } = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.disableSuggesting();
    editor.commands.insertContentAt(6, "!");
    expect(inspect(editor).every((p) => p.mark === null)).toBe(true);
    editor.destroy();
  });
});

describe("getSourceText", () => {
  it("renders the document as it stands: insertions hidden, deletions kept", () => {
    const { editor } = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.deleteRange({ from: 7, to: 12 });
    editor.commands.insertContentAt(7, "there");
    expect(getSourceText(editor)).toBe("Hello world");
    editor.destroy();
  });

  it("joins paragraphs with single newlines", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = new Editor({
      element: host,
      extensions: [
        StarterKit.configure({ document: false, undoRedo: false }),
        SuggestableDocument,
        ...SuggestionMarks,
        SuggestChanges,
      ],
      content: "<p># Title</p><p></p><p>Body</p>",
    });
    expect(getSourceText(editor)).toBe("# Title\n\nBody");
    editor.destroy();
  });
});
