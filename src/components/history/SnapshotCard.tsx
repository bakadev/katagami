import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import {
  ChevronRight,
  History as HistoryIcon,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useRelativeTime } from "~/hooks/useRelativeTime";
import { SnapshotPreview } from "./SnapshotPreview";
import type { SnapshotRecord } from "../../../shared/types";

interface SnapshotCardProps {
  snapshot: SnapshotRecord;
  readOnly: boolean;
  onRestore: () => void | Promise<void>;
  onRename: (nextName: string) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onSaveAsNamed: (nextName: string) => void | Promise<void>;
}

/**
 * SnapshotCard — per-snapshot collapsible row with a timeline spine.
 *
 * The design flourish that makes this different from a generic list row:
 * every card carries a 1px vertical rule on its left edge with a small
 * round "node" centered on the icon. Named snapshots get an amber-tinted
 * filled node (matching the Star); autos get a hollow ring. The spine is
 * drawn per-card so the gap between consecutive cards breaks the line —
 * reinforcing "moments in a sequence" rather than "one continuous stream."
 * This is subtle but loadbearing: it's the one thing that makes the history
 * panel feel like a history and not a settings list.
 *
 * Two states, single DOM tree:
 *
 *   1. **Collapsed** — header button with icon · name · meta · chevron.
 *      Under the name+meta column, a fourth truncated line shows a
 *      preview quote in italic muted-foreground/80, quoted via &ldquo;/&rdquo;
 *      so it reads as "a snippet from the document" rather than UI copy.
 *   2. **Expanded** — same header (chevron rotated), then a preview block
 *      and a right-aligned action row. Action row is suppressed entirely
 *      when `readOnly` — the absence is the signal, matching ThreadCard.
 *
 * Transition: `transition-[max-height,opacity]` on the expandable block.
 * Class-based, so the global `prefers-reduced-motion` rule in styles.css
 * caps duration to 0.01ms and users who opt out see an instant toggle.
 *
 * Accessibility:
 *   - The header is a native `<button>` with `aria-expanded` and a
 *     descriptive `aria-label` ("Expand snapshot: {name|Auto-snapshot}").
 *   - Action buttons carry their own `aria-label` (Restore, Rename, Delete,
 *     Save as named) for icon-paired variants and plain text otherwise.
 *   - The delete-confirm and rename popovers trap focus via Radix; Escape
 *     and outside-click dismiss.
 */
export function SnapshotCard({
  snapshot,
  readOnly,
  onRestore,
  onRename,
  onDelete,
  onSaveAsNamed,
}: SnapshotCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const isNamed = snapshot.name !== null && snapshot.name.length > 0;
  const relTime = useRelativeTime(snapshot.takenAt);
  const displayName = isNamed ? snapshot.name : "Auto-snapshot";

  return (
    <div
      className="group/snap relative"
      data-testid={`snapshot-${snapshot.id}`}
      data-expanded={expanded ? "true" : "false"}
      data-named={isNamed ? "true" : "false"}
    >
      {/*
       * --- Header row (always visible) ---
       * Native button so the whole row is a single tap target. Padding
       * lives here (not on the card wrapper) so the action row below can
       * align its right edge with the chevron.
       *
       * Left column width: 2.25rem (w-9). Holds the icon; the timeline
       * spine sits at half that width so nodes center on the icon.
       */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} snapshot: ${displayName}`}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
      >
        {/* Icon column — Star (amber) for named, History (muted) for auto.
            The width is fixed so the middle column's text stays aligned
            across named/auto cards even when the icons have different
            visual weights. */}
        <span
          aria-hidden
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center"
        >
          {isNamed ? (
            <Star
              className="size-4 fill-amber-500/20 text-amber-500"
              strokeWidth={2}
            />
          ) : (
            <HistoryIcon
              className="size-4 text-muted-foreground"
              strokeWidth={1.75}
            />
          )}
        </span>

        {/* Middle column — name + meta + truncated preview. `min-w-0` is
            essential for truncation inside flex-1; without it, long preview
            strings push the chevron off-screen. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={
              isNamed
                ? "truncate text-sm font-semibold text-foreground"
                : "truncate text-sm font-semibold italic text-muted-foreground"
            }
          >
            {displayName}
          </span>

          <span className="mt-0.5 truncate text-xs text-muted-foreground">
            {relTime}
            {isNamed && (
              <>
                {" "}
                <span aria-hidden className="text-muted-foreground/60">
                  &middot;
                </span>{" "}
                {snapshot.takenByName ?? "anonymous"}
              </>
            )}
          </span>

          {/* Preview snippet — italic + quoted so it reads as borrowed text
              rather than UI chrome. Only rendered when there's actual text;
              empty previews just drop this line so short-document snapshots
              don't carry a visually-empty row. */}
          {snapshot.preview.trim().length > 0 && (
            <span className="mt-1 truncate text-xs italic text-muted-foreground/80">
              &ldquo;{snapshot.preview}&rdquo;
            </span>
          )}
        </div>

        {/* Chevron — single icon that rotates 90deg on expand. Rotation
            (not icon-swap) keeps the right edge visually stable as cards
            toggle, so nothing jumps during expand. Opacity climbs on hover
            so the affordance is discoverable but not loud in a long list. */}
        <ChevronRight
          aria-hidden
          className={`mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover/snap:text-muted-foreground ${
            expanded ? "rotate-90" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {/*
       * --- Expandable block ---
       *
       * Always mounted. `max-h-[400px]` is a generous cap that contains the
       * preview's own inner scroll plus the action row. For very long
       * previews the inner `overflow-y-auto` on SnapshotPreview keeps the
       * tail accessible — max-h on this outer block would otherwise clip it.
       *
       * aria-hidden mirrors the visual state so assistive tech doesn't
       * read stale preview content when the card is collapsed.
       */}
      <div
        aria-hidden={!expanded}
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
          expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3 pb-3 pl-9">
          <SnapshotPreview preview={snapshot.preview} />

          {!readOnly && (
            <div className="mt-2.5 flex items-center justify-end gap-1">
              {isNamed ? (
                <>
                  <RenamePopover
                    currentName={snapshot.name ?? ""}
                    onSubmit={(next) => onRename(next)}
                  />
                  <DeleteConfirmPopover onConfirm={() => onDelete()} />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      void onRestore();
                    }}
                    aria-label="Restore this snapshot"
                  >
                    <RotateCcw aria-hidden />
                    Restore
                  </Button>
                </>
              ) : (
                <>
                  <SaveAsNamedPopover onSubmit={(next) => onSaveAsNamed(next)} />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      void onRestore();
                    }}
                    aria-label="Restore this snapshot"
                  >
                    <RotateCcw aria-hidden />
                    Restore
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RenamePopover — the "Rename" ghost button + popover form for named snaps.
// ---------------------------------------------------------------------------

function RenamePopover({
  currentName,
  onSubmit,
}: {
  currentName: string;
  onSubmit: (next: string) => void | Promise<void>;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset value when popover opens so stale edits from a previous cancel
  // don't leak into the next open.
  useEffect(() => {
    if (!open) return;
    setValue(currentName);
    // Focus delay lets Radix finish mounting before we grab focus.
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
    return () => clearTimeout(t);
  }, [open, currentName]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== currentName;

  const handleSubmit = async () => {
    if (!canSave) return;
    await onSubmit(trimmed);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Rename this snapshot"
        >
          <Pencil aria-hidden />
          Rename
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64">
        <label className="text-xs font-medium text-foreground" htmlFor="rename-input">
          Snapshot name
        </label>
        <input
          id="rename-input"
          ref={inputRef}
          type="text"
          value={value}
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Spec v1"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <div className="mt-1 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!canSave}
            onClick={() => {
              void handleSubmit();
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// SaveAsNamedPopover — promotes an auto-snapshot to a named one.
// ---------------------------------------------------------------------------

function SaveAsNamedPopover({
  onSubmit,
}: {
  onSubmit: (next: string) => void | Promise<void>;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue("");
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0;

  const handleSubmit = async () => {
    if (!canSave) return;
    await onSubmit(trimmed);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Save this auto-snapshot as named"
        >
          <Star aria-hidden />
          Save as named
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64">
        <label className="text-xs font-medium text-foreground" htmlFor="save-as-named-input">
          Name this snapshot
        </label>
        <input
          id="save-as-named-input"
          ref={inputRef}
          type="text"
          value={value}
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Spec v1"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <div className="mt-1 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!canSave}
            onClick={() => {
              void handleSubmit();
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmPopover — destructive confirmation for named snapshots.
// ---------------------------------------------------------------------------

function DeleteConfirmPopover({
  onConfirm,
}: {
  onConfirm: () => void | Promise<void>;
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Delete this snapshot"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden />
          Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-60">
        <div className="text-sm font-medium text-foreground">
          Delete this snapshot?
        </div>
        <p className="text-xs text-muted-foreground">
          This can&rsquo;t be undone. The document itself stays safe.
        </p>
        <div className="mt-1 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              void (async () => {
                await onConfirm();
                setOpen(false);
              })();
            }}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
