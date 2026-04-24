import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import { mdDecorationsPlugin } from "./md-decorations";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Identity } from "~/lib/user/identity";

const lowlight = createLowlight(common);

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
        // CodeBlockLowlight replaces StarterKit's plain codeBlock.
        codeBlock: false,
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
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({
        html: false,
        breaks: false,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      MdSyntaxDecorations,
    ],
  });
}
