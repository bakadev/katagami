import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export interface TitleEditorProps {
  title: string | null;
  onSave: (next: string | null) => void;
  readOnly: boolean;
}

const MAX_LENGTH = 120;
const PLACEHOLDER = "Untitled";

/**
 * TitleEditor — the document's editable heading.
 *
 * Idle state renders as text (not a button) because the click target IS the
 * text itself — the cursor-text affordance and hover underline tell the user
 * the whole span is the interactive region. Tapping anywhere on the title
 * flips to an `<input>` with the same font size and weight, so the letterforms
 * don't jump a pixel.
 *
 * Validation: empty → `null` (clears the title); `> 120 chars` → rejected with
 * inline error, editor stays open; Esc → cancel; Enter/blur → commit.
 *
 * `readOnly` strips away the hover, tooltip, and click-to-edit — but keeps the
 * idle typography identical so the header's vertical rhythm never shifts
 * between permission states.
 */
export function TitleEditor({ title, onSave, readOnly }: TitleEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When entering edit mode, select all so the user can overwrite without
  // having to manually clear first. Done in an effect rather than inline so
  // we're not racing React's reconciler.
  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [editing]);

  const beginEdit = () => {
    if (readOnly) return;
    setDraft(title ?? "");
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      // Empty clears the title (null == Untitled state).
      onSave(null);
      setEditing(false);
      setError(null);
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Title must be ${MAX_LENGTH} characters or fewer.`);
      // Keep focus so the user can correct in place.
      inputRef.current?.focus();
      return;
    }
    onSave(trimmed);
    setEditing(false);
    setError(null);
  };

  // Shared text-shape — mirrored by input to prevent layout shift between modes.
  const typography = "text-[18px] font-semibold leading-[1.3] tracking-[-0.005em]";

  if (editing) {
    return (
      <span className="relative inline-flex min-w-0 flex-col">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          onBlur={() => {
            // Blur commits UNLESS it's blurring away from an invalid input —
            // in that case leave the user alone so the error stays visible.
            if (error) return;
            commit();
          }}
          aria-label="Document title"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "title-editor-error" : undefined}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            typography,
            // Match idle color so letterforms look identical.
            "text-foreground",
            // Strip native chrome; we're rendering like text, not a form field.
            "m-0 w-full min-w-[8ch] max-w-full bg-transparent p-0 outline-none",
            // A hairline underline stands in for a border — keeps the text
            // feeling like text while signalling edit mode.
            "border-0 border-b border-dashed",
            error
              ? "border-destructive/60 focus:border-destructive"
              : "border-ring/50 focus:border-ring",
            // Narrow caret, no weird browser selection color.
            "selection:bg-primary/20 selection:text-foreground",
          )}
          // Accept up to 2× the valid cap so a user can paste, see the error,
          // and correct in place without the input silently truncating.
          maxLength={MAX_LENGTH * 2}
        />
        {error ? (
          <span
            id="title-editor-error"
            role="alert"
            className="mt-1 text-xs font-normal tracking-normal text-destructive"
          >
            {error}
          </span>
        ) : null}
      </span>
    );
  }

  // ---- Idle state ----
  const isEmpty = title === null || title === "";
  const idleContent = (
    <span
      className={cn(
        typography,
        "inline-block max-w-full truncate align-baseline",
        // Reserve 1px for the dashed underline used in edit mode so clicking
        // the title doesn't nudge the MetaLine by a pixel.
        "border-b border-transparent",
        isEmpty ? "italic text-muted-foreground/80" : "text-foreground",
        !readOnly &&
          // The hover underline grows in from the left via a pseudo-element so
          // it reads as intentional craft rather than a default <u>. Offset-4
          // keeps it clear of descenders.
          "group relative cursor-text after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-muted-foreground/40 after:transition-transform after:duration-150 after:ease-out hover:after:scale-x-100",
      )}
    >
      {isEmpty ? PLACEHOLDER : title}
    </span>
  );

  if (readOnly) {
    // No tooltip, no click target, no hover affordance — just text.
    return <span className="inline-flex min-w-0 max-w-full">{idleContent}</span>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={beginEdit}
            // Behaves like text visually but is a real button for a11y.
            className={cn(
              "inline-flex min-w-0 max-w-full cursor-text items-baseline",
              "rounded-sm bg-transparent px-0 py-0 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Rename document"
          >
            {idleContent}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          Click to rename
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
