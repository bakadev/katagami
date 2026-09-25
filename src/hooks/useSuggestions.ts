import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type * as Y from "yjs";
import {
  getSuggestionsMap,
  listSuggestionRecords,
  summarizeSuggestions,
} from "~/lib/suggestions/suggestions";
import type { Suggestion } from "~/lib/suggestions/types";

/**
 * Live list of suggestions in document order: the records map joined with
 * the marks currently in the editor. Recomputed on map changes and on
 * editor transactions (marks move or disappear as people edit).
 */
export function useSuggestions(
  editor: Editor | null,
  ydoc: Y.Doc | null,
): Suggestion[] {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!editor || !ydoc) {
      setSuggestions([]);
      return;
    }
    const refresh = () =>
      setSuggestions(
        summarizeSuggestions(editor.state.doc, listSuggestionRecords(ydoc)),
      );
    const map = getSuggestionsMap(ydoc);
    map.observe(refresh);
    editor.on("transaction", refresh);
    refresh();
    return () => {
      map.unobserve(refresh);
      editor.off("transaction", refresh);
    };
  }, [editor, ydoc]);

  return suggestions;
}
