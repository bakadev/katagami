# Suggesting mode — proposal

> Status: accepted 2026-09-25; steps 1 and 2 shipped the same day (marks, Suggest mode, Review cards with Accept and Reject). Steps 3 (CriticMarkup export and import) and 4 (suggest-and-comment link) are open.

## Summary

Add a third editor mode, **Suggest**, beside Edit and Preview. In Suggest, edits become proposed changes shown inline (insertions highlighted, deletions struck through) and as cards in the panel with Accept and Reject. There is no second copy of the document: suggestions are marks on the one shared Yjs document, the same mechanism comments already use. The MVP spec anticipated this by planning to borrow Mist's CriticMarkup and listing "suggest edit / tracked changes" on the roadmap.

## Mechanism

- Two marks in the editor schema, `suggestInsert` and `suggestDelete`, each carrying a suggestion id. Inserted text is real text with the insert mark. Deleted text stays in the document with the delete mark. A replacement is a delete plus an insert sharing an id.
- A ProseMirror plugin, active only in Suggest mode, rewrites every transaction: insertions become marked insertions, deletions become marks instead of removals. It runs before history so undo undoes the suggestion.
- Each suggestion is a record in a Yjs map beside `threads`: id, author, colour, createdAt, kind (insert / delete / replace), replies, status.
- Accept: remove the marks and, for deletions, the text. Reject: remove inserted text and unmark deletions. Each is one transaction.
- Preview renders the document as it currently stands: insertions hidden, deletions present. A later "show suggestions" toggle can overlay them.

## Markdown

Suggestions serialise as CriticMarkup so the exported `.md` stays self-contained:

```
{++added text++}   {--removed text--}   {~~old~>new~~}
```

Import reads the same syntax back into marks. This keeps the spec's "everything important lives in the file" principle.

## UI

- Mode toggle: Edit / Suggest / Preview, same sliding-thumb control with three slots.
- Comments tab becomes Review: threads and suggestions in document order. Suggestion cards show a diff summary, Accept and Reject (edit-link holders only), and replies. The unread badge counts both.
- Permissions: today a view-link holder cannot suggest. This is the reason to ship the roadmap's comment-only link as a suggest-and-comment link, which is also the Team tier's "comment-only links" line on pricing.

## Risks

- Deletions that cut across Markdown syntax (half of `**bold**`). Work at the text level; the inline decorations will look odd but remain correct.
- Undo ordering: the Suggest plugin must run before the history plugin.
- Existing documents have no suggestion map; create on first access, as threads did.
- Two people suggesting in overlapping ranges is the same shape as overlapping comments, which Yjs marks already handle.

## Build order

1. Marks, suggestion map, Suggest-mode plugin. Unit tests for insert, delete, replace, accept, reject, undo. About the size of the Phase 3 commenting work.
2. Review panel cards with Accept and Reject; three-way mode toggle. Small.
3. CriticMarkup export and import. Small.
4. Suggest-and-comment link type. Server and permissions.

Evaluate `@handlewithcare/prosemirror-suggest-changes` (MIT) for step 1 before writing our own plugin.
