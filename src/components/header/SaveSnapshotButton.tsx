import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bookmark } from "lucide-react";
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

export interface SaveSnapshotButtonProps {
  disabled: boolean;
  onSave: (name: string) => void | Promise<void>;
}

/**
 * SaveSnapshotButton — trigger + popover form for capturing a named snapshot.
 *
 * The trigger shows "Save" on md+ and collapses to an icon-only button on
 * narrow widths (the tooltip supplies the label in that case). Disabled state
 * keeps the button visible — so the control's presence doesn't surprise the
 * user when snapshots become available — but with a tooltip explaining why.
 *
 * The popover holds a focused little form. Enter submits, Escape (via Radix)
 * closes, and the input is reset every time the popover reopens so we never
 * leak stale drafts across sessions.
 */
export function SaveSnapshotButton({
  disabled,
  onSave,
}: SaveSnapshotButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the field every time the popover opens. Prevents yesterday's
  // half-typed label from reappearing.
  useEffect(() => {
    if (open) {
      setName("");
      setSubmitting(false);
      // Radix already handles autoFocus via `onOpenAutoFocus`, but in case of
      // portal timing on very slow mounts, nudge it once more.
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // Pass through empty string — parent decides the auto-label policy.
      await onSave(name.trim());
      setOpen(false);
      setName("");
    } finally {
      setSubmitting(false);
    }
  };

  // The trigger needs two faces: labeled on md+, icon-only below. Keeping the
  // same button element with a conditionally-hidden label means the Popover
  // anchors consistently across breakpoints.
  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      aria-label="Save snapshot"
      className={cn(
        "gap-1.5",
        // The icon shrinks a touch from the default size-3.5 to match "sm"'s
        // restrained proportions.
        "[&_svg]:size-[14px]",
      )}
    >
      <Bookmark strokeWidth={2} aria-hidden />
      <span className="hidden md:inline">Save</span>
    </Button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            {/*
              When `disabled` is true the Button sets pointer-events:none,
              which breaks tooltip hover detection. Wrapping in a span with
              restored pointer events + tabIndex=-1 lets the tooltip still
              show "Nothing to snapshot yet" on the greyed control.
            */}
            {disabled ? (
              <span
                role="presentation"
                tabIndex={-1}
                className="inline-flex outline-none"
              >
                {triggerButton}
              </span>
            ) : (
              <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            )}
          </TooltipTrigger>

          {/* Tooltip content swaps intent based on enabled state */}
          <TooltipContent side="bottom" sideOffset={6}>
            {disabled ? "Nothing to snapshot yet" : "Save snapshot"}
          </TooltipContent>

          <PopoverContent
            align="end"
            sideOffset={8}
            // Slightly wider than default so the form breathes — matches the
            // AvatarDropdown's 260px horizontally rhyming sibling.
            className="w-80 p-3.5"
            onOpenAutoFocus={(e) => {
              // We'll focus the input ourselves via effect; stop Radix from
              // focusing the popover root first (which can flash a ring).
              e.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Header row echoes the Bookmark icon so the origin of this
                  panel is obvious even after the trigger is out of view. */}
              <div className="flex items-center gap-2">
                <Bookmark
                  aria-hidden
                  className="size-[14px] text-muted-foreground"
                  strokeWidth={2}
                />
                <label
                  htmlFor="snapshot-name-input"
                  className="text-sm font-medium text-foreground"
                >
                  Save snapshot
                </label>
              </div>

              <div className="space-y-1.5">
                <input
                  ref={inputRef}
                  id="snapshot-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Snapshot name"
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm",
                    "transition-colors outline-none",
                    "placeholder:text-muted-foreground",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                />
                <p className="text-xs leading-snug text-muted-foreground">
                  Optional — leave blank for an auto-label.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={submitting}
                >
                  Save
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}
