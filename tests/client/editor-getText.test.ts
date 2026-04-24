// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

// Polyfills needed for TipTap + ProseMirror in jsdom
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

// Diagnostic: what does editor.getText({ blockSeparator: "\n\n" }) return
// for a multi-paragraph doc that looks like Markdown source?
describe("editor.getText — block separator behavior", () => {
  it("produces \\n\\n between paragraphs", () => {
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
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "# Refactor Roadmap" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Tracking document..." }],
          },
        ],
      },
    });

    const text = editor.getText({ blockSeparator: "\n\n" });
    // eslint-disable-next-line no-console
    console.log("GOT:", JSON.stringify(text));
    expect(text).toBe("# Refactor Roadmap\n\nTracking document...");

    editor.destroy();
    host.remove();
  });

  it("handles single paragraph", () => {
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
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "# Just a heading" }],
          },
        ],
      },
    });

    const text = editor.getText({ blockSeparator: "\n\n" });
    // eslint-disable-next-line no-console
    console.log("GOT:", JSON.stringify(text));
    expect(text).toBe("# Just a heading");

    editor.destroy();
    host.remove();
  });
});
