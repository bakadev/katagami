import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ThreadCard } from "~/components/comments/ThreadCard";
import type { Thread } from "~/lib/comments/types";

interface CommentsTabProps {
  threads: Thread[];
  currentAuthorName: string;
  readOnly: boolean;
  resolveAnchor: (thread: Thread) => string;
  onReply: (threadId: string, body: string) => void;
  onResolveToggle: (threadId: string, next: boolean) => void;
  onDeleteThreadRoot: (threadId: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  onClickAnchor: (threadId: string) => void;
}

/**
 * CommentsTab — editorial-restrained right-panel tab for review comments.
 *
 * Design vocabulary:
 *
 *   - Sticky top strip with a live-updating count ("3 comments") and a
 *     resolved-toggle when any resolved threads exist. Strip uses
 *     `bg-background/85 backdrop-blur` so threads scrolling underneath
 *     blur through it rather than hard-cutting — this replaces the hard
 *     border the Phase-3 sidebar used.
 *   - Unresolved threads sorted ASCending by creation time come first;
 *     resolved follow (only when the toggle is on). This matches the
 *     marginalia model: fresh notes on top, settled ones dimmed below.
 *     Unresolved sort oldest→newest so replies are contextual, not
 *     clickbaity ("latest first" is newsfeed logic, wrong for spec docs).
 *   - `space-y-2` between cards — the rounded card border is its own
 *     delimiter, so a thin divider would be redundant noise.
 *   - Empty state reuses the Task-14 dual-ring icon badge motif
 *     (bg-primary/10 disc inside a ring-primary/15 ring) with a soft
 *     breathing halo, so CommentsTab reads as a sibling of DocsTab and
 *     AiTab without being a carbon copy — the copy is operational ("select
 *     any text…") rather than aspirational ("coming soon"), distinguishing
 *     "nothing yet" from "not built yet."
 *
 * Accessibility:
 *   - `role="region"` + `aria-label="Comments"` makes the tab a navigable
 *     landmark.
 *   - The sticky strip's count is inside an `aria-live="polite"` region
 *     so screen readers announce changes when threads are added/resolved
 *     but won't interrupt if the user is mid-action.
 *   - The "Show resolved" checkbox is a label+input pair so clicking
 *     either the text or the box toggles, and it's properly associated
 *     for assistive tech.
 */
export function CommentsTab({
  threads,
  currentAuthorName,
  readOnly,
  resolveAnchor,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: CommentsTabProps) {
  const [showResolved, setShowResolved] = useState(false);

  const { unresolved, resolved, total, resolvedCount } = useMemo(() => {
    const u: Thread[] = [];
    const r: Thread[] = [];
    for (const t of threads) (t.resolved ? r : u).push(t);
    // Stable sort: oldest first within each group — new threads appear
    // at the bottom of the unresolved block, so a reviewer reading
    // top-to-bottom moves from "earliest note" to "latest note."
    u.sort((a, b) => a.createdAt - b.createdAt);
    r.sort((a, b) => a.createdAt - b.createdAt);
    return {
      unresolved: u,
      resolved: r,
      total: threads.length,
      resolvedCount: r.length,
    };
  }, [threads]);

  const visible = showResolved ? [...unresolved, ...resolved] : unresolved;

  // --- Empty state ----------------------------------------------------
  // Rendered when there are literally no threads. The `showResolved &&
  // resolvedCount > 0 && unresolved.length === 0` case (all done!) gets
  // a subtly different treatment below inside the list view — we still
  // show the strip so the user can toggle back.
  if (total === 0) {
    return (
      <div
        role="region"
        aria-label="Comments"
        className="relative h-full overflow-hidden"
      >
        {/*
         * Ambient halo — soft primary-tinted orb behind the icon badge.
         * Identical in placement to DocsTab/AiTab so switching tabs
         * doesn't shift the glow. aria-hidden because it's decorative.
         */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-48 -translate-x-1/2 -translate-y-[calc(50%+28px)] rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
        />

        <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
          {/* Dual-ring icon badge — matches DocsTab/AiTab exactly. */}
          <div className="relative mb-5 rounded-full p-3 ring-1 ring-primary/15 ring-inset">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare
                aria-hidden
                className="size-5 text-primary/80"
                strokeWidth={1.75}
              />
            </div>
          </div>

          <h3 className="text-base leading-tight font-semibold text-foreground">
            No comments yet
          </h3>

          <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            Select any text in the editor and click{" "}
            <span className="rounded-sm bg-muted px-1 py-px font-medium text-foreground/80">
              Comment
            </span>{" "}
            to start a thread.
          </p>

          {/*
           * Footer pip — picks up the primary tint so the accent threads
           * all the way to the bottom of the stack. Copy here is
           * operational ("during review…") rather than the
           * "Phase 4b · Multi-doc" roadmap marker — CommentsTab ships NOW,
           * so the footer reframes the emptiness as a workflow note, not
           * a scheduling promise.
           */}
          <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <span aria-hidden className="size-1 rounded-full bg-primary/60" />
            <span>Comments appear here as reviewers add them</span>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ------------------------------------------------------
  const countLabel =
    total === 1 ? "1 comment" : `${total} comments`;

  return (
    <div
      role="region"
      aria-label="Comments"
      className="flex h-full flex-col overflow-hidden"
    >
      {/*
       * Sticky top strip. `bg-background/85 backdrop-blur` layers over
       * scrolling content so cards passing behind it ghost through
       * rather than hard-cut. A hairline bottom rule carries the same
       * border token as the thread cards for visual continuity.
       *
       * Layout: count on the left, "Show resolved" toggle on the right.
       * When there are no resolved threads, the toggle is suppressed
       * entirely (not just disabled) — no UI for a state that can't
       * currently exist.
       */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-3 py-2.5 backdrop-blur">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex items-baseline gap-1.5 text-sm"
        >
          <span className="font-medium tabular-nums text-foreground">
            {total}
          </span>
          <span className="text-muted-foreground">
            {total === 1 ? "comment" : "comments"}
          </span>
          {/* Screen-reader-only longform so the live region announces
              "3 comments" rather than just "3". */}
          <span className="sr-only">{countLabel}</span>
        </div>

        {resolvedCount > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              data-testid="show-resolved"
              className="size-3.5 cursor-pointer accent-primary"
            />
            <span>
              Show resolved{" "}
              <span className="tabular-nums">({resolvedCount})</span>
            </span>
          </label>
        )}
      </div>

      {/*
       * List region. Scrolls independently of the sticky strip. The
       * "all done" micro-empty-state appears inline here when the user
       * has threads but none are unresolved AND they haven't toggled
       * resolved-view — a whisper rather than the full empty-state
       * treatment, because the global state is "working," not "fresh."
       */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare
                aria-hidden
                className="size-4"
                strokeWidth={1.75}
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              All caught up
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
              {resolvedCount === 1
                ? "1 comment is resolved."
                : `${resolvedCount} comments are resolved.`}{" "}
              Toggle &ldquo;Show resolved&rdquo; to review them.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 p-3">
            {visible.map((thread) => (
              <li
                key={thread.id}
                className={`transition-opacity duration-200 ${
                  thread.resolved ? "opacity-60 hover:opacity-100" : ""
                }`}
              >
                <ThreadCard
                  thread={thread}
                  currentAuthorName={currentAuthorName}
                  readOnly={readOnly}
                  anchorText={resolveAnchor(thread)}
                  onReply={(body) => onReply(thread.id, body)}
                  onResolveToggle={() =>
                    onResolveToggle(thread.id, !thread.resolved)
                  }
                  onDeleteThreadRoot={() => onDeleteThreadRoot(thread.id)}
                  onDeleteReply={(replyId) =>
                    onDeleteReply(thread.id, replyId)
                  }
                  onClickAnchor={() => onClickAnchor(thread.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
