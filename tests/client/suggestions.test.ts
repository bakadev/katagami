// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  createSuggestionRecords,
  listSuggestionRecords,
  removeSuggestionRecords,
  summarizeSuggestions,
} from "../../src/lib/suggestions/suggestions";
import {
  SuggestChanges,
  SuggestionMarks,
  SuggestableDocument,
} from "../../src/lib/editor/suggest-changes";

function makeEditor() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return new Editor({
    element: host,
    extensions: [
      StarterKit.configure({ document: false, undoRedo: false }),
      SuggestableDocument,
      ...SuggestionMarks,
      SuggestChanges,
    ],
    content: "<p>Hello world</p>",
  });
}

describe("suggestion records", () => {
  it("creates, lists and removes records in the Y.Map", () => {
    const ydoc = new Y.Doc();
    createSuggestionRecords(ydoc, ["a", "b"], { authorName: "Ame", authorColor: "#123456" }, 42);
    expect(listSuggestionRecords(ydoc)).toEqual([
      { id: "a", authorName: "Ame", authorColor: "#123456", createdAt: 42 },
      { id: "b", authorName: "Ame", authorColor: "#123456", createdAt: 42 },
    ]);
    // creating again does not overwrite
    createSuggestionRecords(ydoc, ["a"], { authorName: "Other", authorColor: "#000" }, 99);
    expect(listSuggestionRecords(ydoc).find((r) => r.id === "a")?.authorName).toBe("Ame");
    removeSuggestionRecords(ydoc, ["a"]);
    expect(listSuggestionRecords(ydoc).map((r) => r.id)).toEqual(["b"]);
  });
});

describe("summarizeSuggestions", () => {
  it("joins marks in the document with records, in document order", () => {
    const editor = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.deleteRange({ from: 7, to: 12 }); // "world" -> deletion
    editor.commands.insertContentAt(7, "there"); // -> insertion
    editor.commands.insertContentAt(1, "Oh, "); // -> insertion at the start

    const ids = new Set<string>();
    editor.state.doc.descendants((n) => {
      n.marks.forEach((m) => m.attrs.id && ids.add(String(m.attrs.id)));
      return true;
    });
    const records = [...ids].map((id) => ({
      id,
      authorName: "Ame",
      authorColor: "#123456",
      createdAt: 1,
    }));

    // Inserting right beside a deletion joins the two into one replace.
    const out = summarizeSuggestions(editor.state.doc, records);
    expect(out.map((s) => s.kind)).toEqual(["insert", "replace"]);
    expect(out[0].insertedText).toBe("Oh, ");
    expect(out[0].authorName).toBe("Ame");
    expect(out[1].deletedText).toBe("world");
    expect(out[1].insertedText).toBe("there");
    expect(out[0].from).toBeLessThan(out[1].from);
    editor.destroy();
  });

  it("attributes marks without a record to Someone", () => {
    const editor = makeEditor();
    editor.commands.enableSuggesting();
    editor.commands.insertContentAt(6, "!");
    const out = summarizeSuggestions(editor.state.doc, []);
    expect(out).toHaveLength(1);
    expect(out[0].authorName).toBe("Someone");
    editor.destroy();
  });
});
