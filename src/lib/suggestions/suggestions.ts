import * as Y from "yjs";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Suggestion, SuggestionRecord } from "./types";

/**
 * Suggestion records live in a Y.Map beside the comment threads, keyed by
 * suggestion id, JSON-stringified like threads. The document's marks are
 * the source of truth for what a suggestion changes; the record only adds
 * who and when. A record whose id no longer appears in the document (the
 * suggestion was accepted or rejected) is ignored and pruned lazily.
 */

const MAP_NAME = "suggestions";

export function getSuggestionsMap(ydoc: Y.Doc): Y.Map<string> {
  return ydoc.getMap<string>(MAP_NAME);
}

export function listSuggestionRecords(ydoc: Y.Doc): SuggestionRecord[] {
  const map = getSuggestionsMap(ydoc);
  const out: SuggestionRecord[] = [];
  for (const id of map.keys()) {
    const raw = map.get(id);
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw) as SuggestionRecord);
    } catch {
      // ignore a corrupt entry
    }
  }
  return out;
}

export function createSuggestionRecords(
  ydoc: Y.Doc,
  ids: string[],
  author: { authorName: string; authorColor: string },
  createdAt = Date.now(),
): void {
  const map = getSuggestionsMap(ydoc);
  ydoc.transact(() => {
    for (const id of ids) {
      if (map.has(id)) continue;
      const rec: SuggestionRecord = { id, ...author, createdAt };
      map.set(id, JSON.stringify(rec));
    }
  });
}

export function removeSuggestionRecords(ydoc: Y.Doc, ids: string[]): void {
  const map = getSuggestionsMap(ydoc);
  ydoc.transact(() => {
    for (const id of ids) map.delete(id);
  });
}

const MARKS = new Set(["insertion", "deletion", "modification"]);

/**
 * Join records with the document: for every suggestion id present in the
 * doc, gather its inserted and deleted text and its first position. Ids
 * with marks but no record (a peer's record hasn't synced yet) still show,
 * attributed to "Someone". Sorted by document position.
 */
export function summarizeSuggestions(
  doc: PMNode,
  records: SuggestionRecord[],
): Suggestion[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const found = new Map<
    string,
    { inserted: string; deleted: string; modified: boolean; from: number }
  >();

  doc.descendants((node, pos) => {
    for (const mark of node.marks) {
      if (!MARKS.has(mark.type.name) || mark.attrs.id == null) continue;
      const id = String(mark.attrs.id);
      let entry = found.get(id);
      if (!entry) {
        entry = { inserted: "", deleted: "", modified: false, from: pos };
        found.set(id, entry);
      }
      const text = node.isText ? (node.text ?? "") : node.isBlock ? "¶" : "";
      if (mark.type.name === "insertion") entry.inserted += text;
      else if (mark.type.name === "deletion") entry.deleted += text;
      else entry.modified = true;
    }
    return true;
  });

  const out: Suggestion[] = [];
  for (const [id, e] of found) {
    const rec = byId.get(id) ?? {
      id,
      authorName: "Someone",
      authorColor: "#6b7280",
      createdAt: 0,
    };
    const kind =
      e.inserted && e.deleted
        ? "replace"
        : e.inserted
          ? "insert"
          : e.deleted
            ? "delete"
            : "modify";
    out.push({
      ...rec,
      kind,
      insertedText: e.inserted,
      deletedText: e.deleted,
      from: e.from,
    });
  }
  out.sort((a, b) => a.from - b.from);
  return out;
}
