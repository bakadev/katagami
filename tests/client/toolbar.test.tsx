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
        { type: "paragraph", content: content ? [{ type: "text", text: content }] : [] },
      ],
    },
  });
  const origDestroy = editor.destroy.bind(editor);
  editor.destroy = () => {
    origDestroy();
    host.remove();
  };
  return editor;
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
