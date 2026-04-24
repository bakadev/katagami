import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface RenameModalProps {
  open: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const MIN_LENGTH = 1;
const MAX_LENGTH = 40;

function validate(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length < MIN_LENGTH) return { ok: false, error: "Name can't be empty." };
  if (trimmed.length > MAX_LENGTH) return { ok: false, error: `Name must be ${MAX_LENGTH} characters or fewer.` };
  return { ok: true, value: trimmed };
}

/**
 * RenameModal — dialog for choosing a display name.
 *
 * Local draft state is reset to `initialName` whenever `open` flips to true, so
 * reopening the dialog always starts from the canonical identity rather than
 * stale keystrokes from a previous session.
 *
 * Validation runs on submit. The dialog only closes on a successful save or
 * an explicit cancel (via the Cancel button, the X close, or Escape).
 */
export function RenameModal({ open, initialName, onSave, onCancel }: RenameModalProps) {
  const [draft, setDraft] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset draft + clear any error whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setDraft(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const result = validate(draft);
    if (!result.ok) {
      setError(result.error);
      // Keep focus in the input so the user can correct inline.
      inputRef.current?.focus();
      return;
    }
    onSave(result.value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Radix fires onOpenChange(false) for Esc, overlay click, or the X.
        // Any of those = cancel.
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename yourself</DialogTitle>
          <DialogDescription>
            Pick a name your collaborators will see on cursors and comments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <label htmlFor="rename-input" className="sr-only">
            Your display name
          </label>
          <input
            id="rename-input"
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              // Clear stale error the moment the user edits.
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "rename-error" : "rename-hint"}
            maxLength={MAX_LENGTH * 2 /* soft cap; real validation on submit */}
            className={cn(
              "flex h-9 w-full rounded-md border bg-background px-3 text-sm",
              "transition-colors outline-none",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "border-border",
            )}
          />
          {error ? (
            <p id="rename-error" className="text-xs text-destructive">
              {error}
            </p>
          ) : (
            <p id="rename-hint" className="text-xs text-muted-foreground">
              1–40 characters
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button variant="default" onClick={() => handleSubmit()} type="button">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
