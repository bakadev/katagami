import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
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
 * TitleEditor — the document's heading + a popover for renaming.
 *
 * The title itself renders as plain heading text. Clicking the title (or the
 * small Pencil icon next to it) opens a Popover with a name input — the same
 * pattern used by `SaveSnapshotButton` and the avatar's rename popover, so
 * every "rename a thing" affordance in the app feels identical.
 *
 * Validation: trim → empty → null clears the title; > 120 chars rejects with
 * inline error and keeps the popover open. Enter submits, Esc closes.
 *
 * `readOnly` strips the affordance entirely — the title becomes static text.
 */
export function TitleEditor({ title, onSave, readOnly }: TitleEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Reset draft + error every time the popover opens, so stale state from a
  // previous cancel doesn't leak in.
  useEffect(() => {
    if (!open) return;
    setDraft(title ?? "");
    setError(null);
  }, [open, title]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > MAX_LENGTH) {
      setError(`Title must be ${MAX_LENGTH} characters or fewer.`);
      inputRef.current?.focus();
      return;
    }
    onSave(trimmed.length === 0 ? null : trimmed);
    setOpen(false);
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const isEmpty = title === null || title === "";
  const typography = "text-[18px] font-semibold leading-tight tracking-[-0.005em]";

  // Static label — used in both readOnly and a few sub-cases below.
  const labelText = isEmpty ? PLACEHOLDER : title;
  const labelClassName = cn(
    typography,
    "max-w-full truncate",
    isEmpty ? "italic text-muted-foreground/80" : "text-foreground",
  );

  if (readOnly) {
    return <span className={labelClassName}>{labelText}</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Rename document"
                className={cn(
                  labelClassName,
                  "rounded-sm bg-transparent px-0 py-0 text-left outline-none",
                  // Dashed underline = "clickable text" affordance. Sits in
                  // the muted-foreground tone at rest, deepens on hover.
                  "underline decoration-muted-foreground/40 decoration-dashed underline-offset-[6px]",
                  "transition-colors hover:decoration-muted-foreground hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                {labelText}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            Click to rename
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[320px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor={inputId} className="text-xs font-medium text-foreground">
            Document title
          </label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Untitled"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
            className={cn(
              "h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/40",
              error
                ? "border-destructive/60 focus-visible:border-destructive"
                : "border-input focus-visible:border-ring",
            )}
            maxLength={MAX_LENGTH * 2}
          />
          {error ? (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="text-xs text-destructive"
            >
              {error}
            </p>
          ) : (
            <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
              Up to {MAX_LENGTH} characters. Leave blank to clear.
            </p>
          )}
          <div className="mt-1 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
