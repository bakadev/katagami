import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type * as Y from "yjs";
import { listThreads, getThreadsMap } from "~/lib/comments/threads";
import type { Thread } from "~/lib/comments/types";

/**
 * Subscribe to the shared Y.Doc's threads map (and the editor's transactions
 * so document-order re-sort picks up mark movements). Returns a reactive
 * array. Pass `editor` as null if you only need map updates without re-sorts.
 */
export function useThreads(editor: Editor | null, ydoc: Y.Doc | null): Thread[] {
  const [threads, setThreads] = useState<Thread[]>(() => (ydoc ? listThreads(ydoc) : []));

  useEffect(() => {
    if (!ydoc) {
      setThreads([]);
      return;
    }
    const map = getThreadsMap(ydoc);
    const refresh = () => setThreads(listThreads(ydoc));
    map.observe(refresh);
    refresh();
    return () => map.unobserve(refresh);
  }, [ydoc]);

  useEffect(() => {
    if (!editor || !ydoc) return;
    const refresh = () => setThreads(listThreads(ydoc));
    editor.on("transaction", refresh);
    return () => {
      editor.off("transaction", refresh);
    };
  }, [editor, ydoc]);

  return threads;
}
