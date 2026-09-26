import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Pencil } from "lucide-react";
import { cn } from "~/lib/utils";
import { SERIF } from "../serif";

/**
 * A name with a pencil. Click the pencil: an input replaces the text; Enter
 * commits, Escape cancels, blur commits. `editing` can be forced on from
 * outside (a just-created project starts in rename).
 */
export function InlineName({
  value,
  onChange,
  editing,
  onEditingChange,
  className,
  inputClassName,
  label = "Rename project",
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  className?: string;
  inputClassName?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  /* Escape sets this so the blur that follows doesn't commit the draft. */
  const cancelled = useRef(false);
  useEffect(() => {
    if (editing) {
      setDraft(value);
      cancelled.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = () => {
    if (cancelled.current) return;
    const v = draft.trim();
    if (v && v !== value) onChange(v);
    onEditingChange(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      cancelled.current = true;
      onEditingChange(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        aria-label={label}
        maxLength={80}
        style={{ fontFamily: SERIF }}
        className={cn(
          "w-full min-w-0 border-b border-brand-ink bg-transparent leading-tight outline-none",
          className,
          inputClassName,
        )}
      />
    );
  }
  return (
    <span className="group/name inline-flex min-w-0 items-center gap-2">
      <span style={{ fontFamily: SERIF }} className={cn("truncate leading-tight", className)}>
        {value}
      </span>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => onEditingChange(true)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover/name:opacity-100"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}
