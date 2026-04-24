import { useCallback, type ReactElement } from "react";
import { AlertTriangle, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { SnapshotList } from "~/components/history/SnapshotList";
import { useSnapshots } from "~/hooks/useSnapshots";
import {
  createSnapshot,
  deleteSnapshot,
  renameSnapshot,
  restoreSnapshot,
} from "~/lib/api/snapshots";
interface HistoryTabProps {
  docId: string;
  keyToken: string;
  readOnly: boolean;
  enabled: boolean;
  /**
   * Parent-wired restore hook. Returns the pre-restore snapshot id so
   * HistoryTab can thread it into the Undo action of the toast. Task 17
   * supplies the real implementation that also flushes the editor.
   */
  onRestore: (snapId: string) => Promise<{ preRestoreSnapshotId: string }>;
}

/**
 * HistoryTab — version-history panel for the right-side tab strip.
 *
 * Layout:
 *   - Sticky top strip ("History" + count, translucent backdrop-blur)
 *   - Optional error banner (when a refresh fails but we might have stale data)
 *   - Scrollable list area (SnapshotList, SkeletonList, or EmptyState)
 *
 * Data: `useSnapshots(docId, keyToken, enabled)` polls every 30s while
 * mounted + enabled. The parent gates `enabled` on the History tab being
 * the active tab, so we don't poll invisibly.
 *
 * State decisions:
 *   - Skeleton rows render only when `loading && snapshots.length === 0`.
 *     Subsequent polls are silent; the list keeps its content and just
 *     swaps in place. This matches "live" panels in Linear / Notion where
 *     a refresh never causes a skeleton flash over content you were reading.
 *   - Errors do NOT replace the list. They render as an inline banner
 *     above whatever cached snapshots we have — so a transient network
 *     hiccup doesn't erase the user's place. The Retry button re-calls
 *     `refresh()`, which clears the error on success.
 *   - Restore flows through the parent's `onRestore` promise and then
 *     fires a Sonner toast with an Undo action. Rename / delete /
 *     save-as-named stay inside HistoryTab because they don't need the
 *     editor-flush dance.
 *
 * Accessibility:
 *   - `role="region"` + `aria-label="Version history"` makes this a
 *     named landmark.
 *   - Count is inside `aria-live="polite" aria-atomic="true"` so screen
 *     readers announce "3 snapshots" when the number changes, without
 *     interrupting a mid-action user.
 */
export function HistoryTab({
  docId,
  keyToken,
  readOnly,
  enabled,
  onRestore,
}: HistoryTabProps): ReactElement {
  const { snapshots, loading, error, refresh } = useSnapshots(
    docId,
    keyToken,
    enabled,
  );

  // --- Action handlers ---------------------------------------------------

  const handleRestore = useCallback(
    async (snapId: string) => {
      try {
        const { preRestoreSnapshotId } = await onRestore(snapId);
        toast.success("Snapshot restored", {
          description: "Your document was replaced with this version.",
          action: {
            label: "Undo",
            onClick: () => {
              void (async () => {
                try {
                  await restoreSnapshot(docId, preRestoreSnapshotId, keyToken);
                  await refresh();
                  toast.success("Undone");
                } catch (e) {
                  toast.error("Couldn’t undo", {
                    description: e instanceof Error ? e.message : String(e),
                  });
                }
              })();
            },
          },
        });
        await refresh();
      } catch (e) {
        toast.error("Couldn’t restore snapshot", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [docId, keyToken, onRestore, refresh],
  );

  const handleRename = useCallback(
    async (snapId: string, nextName: string) => {
      try {
        await renameSnapshot(docId, snapId, keyToken, nextName);
        await refresh();
      } catch (e) {
        toast.error("Couldn’t rename snapshot", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [docId, keyToken, refresh],
  );

  const handleDelete = useCallback(
    async (snapId: string) => {
      try {
        await deleteSnapshot(docId, snapId, keyToken);
        await refresh();
      } catch (e) {
        toast.error("Couldn’t delete snapshot", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [docId, keyToken, refresh],
  );

  const handleSaveAsNamed = useCallback(
    async (_snapId: string, nextName: string) => {
      // The API doesn't support "promote an auto to named" directly; it
      // just takes a new named snapshot of the current doc state. That's
      // the correct semantic: you can't retroactively name a moment in
      // the past, you can only bookmark the present. The auto-snapshot
      // stays in place; a fresh named one appears at the top on refresh.
      try {
        await createSnapshot(docId, keyToken, nextName);
        await refresh();
        toast.success("Snapshot saved", {
          description: `“${nextName}” is now in your history.`,
        });
      } catch (e) {
        toast.error("Couldn’t save snapshot", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [docId, keyToken, refresh],
  );

  // --- View-level decisions ---------------------------------------------

  const showFirstLoadSkeleton = loading && snapshots.length === 0 && !error;
  const showEmptyState = !loading && !error && snapshots.length === 0;

  return (
    <div
      role="region"
      aria-label="Version history"
      className="relative flex h-full flex-col overflow-hidden"
    >
      {/*
       * Sticky strip — identical backdrop to CommentsTab so tabs feel
       * unified. Left: "History" label + live count. No right-side
       * controls today; the header's "Save" button handles named-save.
       */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-3 py-2.5 backdrop-blur">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex items-baseline gap-1.5 text-sm"
        >
          <span className="font-medium text-foreground">History</span>
          {snapshots.length > 0 && (
            <>
              <span
                aria-hidden
                className="text-muted-foreground/60"
              >
                &middot;
              </span>
              <span className="tabular-nums text-muted-foreground">
                {snapshots.length}{" "}
                {snapshots.length === 1 ? "snapshot" : "snapshots"}
              </span>
            </>
          )}
        </div>
      </div>

      {/*
       * Scroll region. The inline error banner lives inside the scroll
       * region (not above it) so it scrolls with content — avoids the
       * banner pinning above cached cards and disorienting the user
       * about "what's current."
       */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <ErrorBanner
            message="Couldn’t load history"
            onRetry={() => {
              void refresh();
            }}
          />
        )}

        {showFirstLoadSkeleton ? (
          <SkeletonList />
        ) : showEmptyState ? (
          <EmptyState />
        ) : (
          <SnapshotList
            snapshots={snapshots}
            readOnly={readOnly}
            onRestore={handleRestore}
            onRename={handleRename}
            onDelete={handleDelete}
            onSaveAsNamed={handleSaveAsNamed}
          />
        )}

        {/* Footer hint — a subtle note explaining the auto-save cadence,
            pinned below the list so the list itself doesn't carry the
            explainer. Only rendered once there's something in the list;
            the empty state carries its own copy. */}
        {snapshots.length > 0 && (
          <HistoryFooterNote count={snapshots.length} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorBanner — inline destructive banner at the top of the scroll area.
// ---------------------------------------------------------------------------

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <div
      role="alert"
      className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive"
    >
      <AlertTriangle aria-hidden className="size-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={onRetry}
        className="-mr-1 h-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonList — mirrors the real row structure.
// ---------------------------------------------------------------------------

function SkeletonList(): ReactElement {
  // 3 rows is enough to feel like "a list is loading" without implying
  // "there are exactly 3 things." We intentionally stagger widths across
  // rows so the skeleton doesn't read as a regular pattern (which reads
  // as a decorative banner, not content).
  const rows = [
    { title: "w-40", meta: "w-28", preview: "w-64" },
    { title: "w-28", meta: "w-20", preview: "w-52" },
    { title: "w-44", meta: "w-24", preview: "w-60" },
  ];
  return (
    <ul
      aria-hidden
      className="flex flex-col divide-y divide-border"
      data-testid="snapshot-list-skeleton"
    >
      {rows.map((r, i) => (
        <li key={i} className="list-none">
          <div className="flex items-start gap-2 px-3 py-2.5">
            <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className={`h-3.5 animate-pulse rounded bg-muted ${r.title}`} />
              <div className={`h-3 animate-pulse rounded bg-muted/70 ${r.meta}`} />
              <div
                className={`h-2.5 animate-pulse rounded bg-muted/50 ${r.preview} max-w-full`}
              />
            </div>
            <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — shared motif across Docs/Ai/Comments/History tabs.
// ---------------------------------------------------------------------------

function EmptyState(): ReactElement {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden">
      {/*
       * Ambient halo — byte-identical to DocsTab/AiTab/CommentsTab so
       * switching tabs never shifts the glow position.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-48 -translate-x-1/2 -translate-y-[calc(50%+28px)] rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />

      <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-5 rounded-full p-3 ring-1 ring-primary/15 ring-inset">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <HistoryIcon
              aria-hidden
              className="size-5 text-primary/80"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <h3 className="text-base leading-tight font-semibold text-foreground">
          No snapshots yet
        </h3>

        <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
          Saves appear here automatically every 5 minutes of edits. You can
          also click{" "}
          <span className="rounded-sm bg-muted px-1 py-px font-medium text-foreground/80">
            Save
          </span>{" "}
          in the header to create a named snapshot.
        </p>

        <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/80">
          <span aria-hidden className="size-1 rounded-full bg-primary/60" />
          <span>Auto-snapshots &middot; last 20 kept</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HistoryFooterNote — subtle below-list note about auto-snapshot retention.
// ---------------------------------------------------------------------------

function HistoryFooterNote({ count }: { count: number }): ReactElement {
  return (
    <div
      className="flex items-center justify-center gap-1.5 px-3 py-4 text-[11px] text-muted-foreground/70"
      aria-hidden
    >
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>
        {count >= 20
          ? "Auto-snapshots cap at 20; oldest are pruned first"
          : "Auto-snapshots kept for the last 20 saves"}
      </span>
    </div>
  );
}
