import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Suggestion } from "~/lib/suggestions/types";

function formatRelative(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const KIND_LABEL: Record<Suggestion["kind"], string> = {
  insert: "Add",
  delete: "Remove",
  replace: "Replace",
  modify: "Change",
};

/**
 * One suggestion in the Review panel: who, when, what changes, and
 * Accept / Reject for people who can edit. Deleted text is struck through
 * and inserted text underlined, matching the marks in the editor.
 */
export function SuggestionCard({
  suggestion,
  readOnly,
  onAccept,
  onReject,
  onClick,
}: {
  suggestion: Suggestion;
  readOnly: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const s = suggestion;
  return (
    <div
      className="overflow-hidden rounded-sm border border-border bg-card text-sm"
      data-testid={`suggestion-${s.id}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 pt-2.5 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="notch-sm px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: s.authorColor }}
          >
            {s.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(s.createdAt)}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Accept suggestion"
              title="Accept"
              onClick={() => onAccept(s.id)}
            >
              <Check aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reject suggestion"
              title="Reject"
              onClick={() => onReject(s.id)}
            >
              <X aria-hidden />
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClick(s.id)}
        className="block w-full px-3 py-2.5 text-left leading-relaxed outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
      >
        <span className="mr-1.5 text-xs font-medium text-muted-foreground">
          {KIND_LABEL[s.kind]}:
        </span>
        {s.deletedText && (
          <del className="suggest-del rounded-sm px-0.5">{s.deletedText}</del>
        )}
        {s.deletedText && s.insertedText && " "}
        {s.insertedText && (
          <ins className="suggest-ins rounded-sm px-0.5">{s.insertedText}</ins>
        )}
        {!s.deletedText && !s.insertedText && (
          <span className="text-muted-foreground">formatting</span>
        )}
      </button>
    </div>
  );
}
