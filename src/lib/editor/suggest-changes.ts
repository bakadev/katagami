import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import {
  applySuggestion,
  revertSuggestion,
  suggestChanges,
  suggestChangesKey,
  transformToSuggestionTransaction,
} from "@handlewithcare/prosemirror-suggest-changes";

/**
 * Suggesting mode ("Suggest" beside Edit and Preview).
 *
 * Built on @handlewithcare/prosemirror-suggest-changes. While suggesting is
 * on, every user transaction is rewritten before it is applied: inserted
 * text is real text carrying an `insertion` mark, deleted text stays in the
 * document carrying a `deletion` mark. Accepting removes the marks (and the
 * deleted text); rejecting removes inserted text and unmarks deletions.
 *
 * There is no second copy of the document. Marks are ordinary ProseMirror
 * marks, so Yjs syncs them like anything else and the Yjs undo manager
 * undoes a suggestion as a unit. Remote (y-sync) and undo transactions are
 * never rewritten.
 *
 * Suggestion ids are random strings so two people suggesting at once can't
 * collide. Who made a suggestion and when lives in a Yjs map beside the
 * comment threads (see src/lib/suggestions); this extension only reports
 * newly created ids through `onNewSuggestions`.
 */

/* ---- schema --------------------------------------------------------------- */

const ID_ATTR = {
  id: {
    default: null as string | number | null,
    parseHTML: (el: HTMLElement) => {
      const raw = el.getAttribute("data-id");
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as string | number;
      } catch {
        return raw;
      }
    },
    renderHTML: (attrs: Record<string, unknown>) => ({
      "data-id": JSON.stringify(attrs.id),
    }),
  },
};

export const Insertion = Mark.create({
  name: "insertion",
  inclusive: false,
  excludes: "deletion modification insertion",
  addAttributes() {
    return ID_ATTR;
  },
  parseHTML() {
    return [{ tag: "ins[data-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["ins", mergeAttributes(HTMLAttributes, { class: "suggest-ins" }), 0];
  },
});

export const Deletion = Mark.create({
  name: "deletion",
  inclusive: false,
  excludes: "insertion modification deletion",
  addAttributes() {
    return ID_ATTR;
  },
  parseHTML() {
    return [{ tag: "del[data-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["del", mergeAttributes(HTMLAttributes, { class: "suggest-del" }), 0];
  },
});

export const Modification = Mark.create({
  name: "modification",
  inclusive: false,
  excludes: "deletion insertion",
  addAttributes() {
    return {
      ...ID_ATTR,
      type: { default: "" },
      attrName: { default: null },
      previousValue: { default: null },
      newValue: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-type='modification']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "modification",
        class: "suggest-mod",
      }),
      0,
    ];
  },
});

export const SuggestionMarks = [Insertion, Deletion, Modification];

/**
 * The document node must allow the suggestion marks on its block children so
 * a whole inserted or deleted paragraph can be tracked. Replaces TipTap's
 * default Document (configure StarterKit with `document: false`).
 */
export const SuggestableDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "block+",
  marks: "insertion deletion modification",
});

/* ---- extension ------------------------------------------------------------ */

export interface SuggestChangesOptions {
  /** Called with the ids of suggestions a rewritten transaction created. */
  onNewSuggestions?: (ids: string[]) => void;
}

export interface SuggestChangesStorage {
  enabled: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    suggestChanges: {
      enableSuggesting: () => ReturnType;
      disableSuggesting: () => ReturnType;
      acceptSuggestion: (id: string) => ReturnType;
      rejectSuggestion: (id: string) => ReturnType;
    };
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const SUGGESTION_MARK_NAMES = new Set(["insertion", "deletion", "modification"]);

/** Every suggestion id present anywhere in a document. */
export function collectSuggestionIds(doc: Transaction["doc"]): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    for (const mark of node.marks) {
      if (SUGGESTION_MARK_NAMES.has(mark.type.name) && mark.attrs.id != null) {
        ids.add(String(mark.attrs.id));
      }
    }
    return true;
  });
  return ids;
}

/** Mirrors the library's own guard in `withSuggestChanges`. */
function shouldRewrite(tr: Transaction): boolean {
  const ySync = (tr.getMeta("y-sync$") ?? {}) as {
    isUndoRedoOperation?: boolean;
    isChangeOrigin?: boolean;
  };
  const own = (tr.getMeta(suggestChangesKey) ?? {}) as Record<string, unknown>;
  return (
    !tr.getMeta("history$") &&
    !tr.getMeta("collab$") &&
    !ySync.isUndoRedoOperation &&
    !ySync.isChangeOrigin &&
    !("skip" in own) &&
    tr.docChanged
  );
}

export const SuggestChanges = Extension.create<
  SuggestChangesOptions,
  SuggestChangesStorage
>({
  name: "suggestChanges",

  addOptions() {
    return { onNewSuggestions: undefined };
  },

  addStorage() {
    return { enabled: false };
  },

  addProseMirrorPlugins() {
    return [suggestChanges()];
  },

  addCommands() {
    return {
      enableSuggesting:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(suggestChangesKey, { enabled: true });
            this.storage.enabled = true;
          }
          return true;
        },
      disableSuggesting:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(suggestChangesKey, { enabled: false });
            this.storage.enabled = false;
          }
          return true;
        },
      acceptSuggestion:
        (id: string) =>
        ({ state, dispatch }) =>
          applySuggestion(id)(state, dispatch),
      rejectSuggestion:
        (id: string) =>
        ({ state, dispatch }) =>
          revertSuggestion(id)(state, dispatch),
    };
  },

  dispatchTransaction({ transaction, next }) {
    if (!this.storage.enabled || !shouldRewrite(transaction)) {
      next(transaction);
      return;
    }
    const before = collectSuggestionIds(this.editor.state.doc);
    const rewritten = transformToSuggestionTransaction(
      transaction,
      this.editor.state,
      () => randomId(),
    );
    next(rewritten);
    const onNew = this.options.onNewSuggestions;
    if (onNew) {
      const created = [...collectSuggestionIds(rewritten.doc)].filter(
        (id) => !before.has(id),
      );
      if (created.length > 0) onNew(created);
    }
  },
});
