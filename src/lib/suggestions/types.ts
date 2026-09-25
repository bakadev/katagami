/** Who made a suggestion and when. The change itself lives in the document as marks. */
export interface SuggestionRecord {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
}

/** A record joined with what the marks currently say about it. */
export interface Suggestion extends SuggestionRecord {
  kind: "insert" | "delete" | "replace" | "modify";
  insertedText: string;
  deletedText: string;
  /** Document position of the first marked range, for ordering and scrolling. */
  from: number;
}
