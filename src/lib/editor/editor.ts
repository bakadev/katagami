import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { mdDecorationsPlugin } from "./md-decorations";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Identity } from "~/lib/user/identity";

const MdSyntaxDecorations = Extension.create({
  name: "mdSyntaxDecorations",
  addProseMirrorPlugins() {
    return [mdDecorationsPlugin()];
  },
});

export interface CreateEditorArgs {
  element: HTMLElement;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  identity: Identity;
  editable: boolean;
}

/**
 * Build a TipTap editor bound to the shared Yjs doc (fragment "tiptap").
 * The editor is mounted onto `element` and returned so the caller can
 * call `editor.destroy()` on unmount.
 */
export function createEditor({
  element,
  ydoc,
  provider,
  identity,
  editable,
}: CreateEditorArgs): Editor {
  return new Editor({
    element,
    editable,
    extensions: [
      StarterKit.configure({
        // Yjs owns undo/redo; disabling TipTap's history avoids double-undo.
        undoRedo: false,
        // Block-transforming extensions disabled so Markdown syntax characters
        // stay as literal text (faded by md-decorations plugin) instead of
        // being swallowed by input rules like "# " → H1 node.
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        // Marks that also have input rules
        bold: false,
        italic: false,
        strike: false,
        // Keep: paragraph, text, hardBreak, dropcursor, gapcursor
      }),
      Collaboration.configure({
        document: ydoc,
        field: "tiptap",
      }),
      CollaborationCaret.configure({
        provider,
        user: { name: identity.name, color: identity.color },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: editable ? "Start typing Markdown…" : "(empty document)",
      }),
      MdSyntaxDecorations,
    ],
  });
}
