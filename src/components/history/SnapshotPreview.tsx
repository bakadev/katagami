import type { ReactElement } from "react";

interface SnapshotPreviewProps {
  preview: string;
}

/**
 * SnapshotPreview — the monospace preview block for an expanded SnapshotCard.
 *
 * Rendered as a `<pre>` because the preview is plaintext from the document
 * with whitespace preserved, and we want the visual register to read as
 * "stored content," not "UI chrome." The font-mono + bg-muted/30 combo gives
 * it the same flavor as a terminal transcript or an inline diff — this is
 * the payload, not the label.
 *
 * Constraints:
 *   - `max-h-60 overflow-y-auto` so very long previews scroll inside this
 *     block instead of pushing the action row out of the expanded card.
 *     The parent (SnapshotCard) caps its own max-h-[400px], so without this
 *     inner scroll the tail of a long preview would be invisibly clipped.
 *   - `whitespace-pre-wrap` preserves line breaks and indentation while
 *     still wrapping long lines to the block width. `break-words` handles
 *     the pathological case (a 200-character single word).
 *
 * The empty-preview case ("(empty document)") is italic + muted to mark it
 * as a descriptor of state rather than a literal document contents.
 * role="group" + aria-label makes the block a screen-reader landmark so
 * listeners can tell "this is the snapshot content" from "this is chrome."
 */
export function SnapshotPreview({ preview }: SnapshotPreviewProps): ReactElement {
  const isEmpty = preview.trim().length === 0;

  return (
    <pre
      role="group"
      aria-label="Snapshot preview"
      className={`m-0 max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed ${
        isEmpty ? "italic text-muted-foreground" : "text-foreground/90"
      }`}
    >
      {isEmpty ? "(empty document)" : preview}
    </pre>
  );
}
