import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { CommentComposer } from "~/components/editor/CommentComposer";
import type { Thread } from "~/lib/comments/types";

interface ThreadCardProps {
  thread: Thread;
  currentAuthorName: string;
  readOnly: boolean;
  anchorText: string;
  onReply: (body: string) => void;
  onResolveToggle: () => void;
  onDeleteThreadRoot: () => void;
  onDeleteReply: (replyId: string) => void;
  onClickAnchor: () => void;
}

function formatRelative(createdAt: number): string {
  const diffMs = Date.now() - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString();
}

function previewText(body: string, rootDeleted: boolean | undefined): string {
  if (rootDeleted) return "[deleted]";
  const stripped = body.replace(/\s+/g, " ").trim();
  if (stripped.length <= 60) return stripped;
  return stripped.slice(0, 60).replace(/\s+\S*$/, "") + "…";
}

/**
 * ThreadCard — per-thread collapsible card.
 *
 * Two visual states, both always mounted (the expanded block is animated
 * via max-height + opacity so screen readers see a single landmark per
 * thread and keyboard nav doesn't jump between two card variants):
 *
 *   1. **Collapsed** (summary row): colored identity dot + author + middle
 *      dot · truncated preview · optional reply-count badge · right chevron.
 *      The whole row is a button; clicking toggles to expanded.
 *   2. **Expanded**: full Phase 3 layout — anchor-quote top, author row with
 *      resolve/delete/collapse actions, body, replies, reply composer.
 *
 * Transition: the expand-only block uses `transition-all` on `max-h` and
 * `opacity` (duration-200 ease-out). When collapsed, the block is
 * `max-h-0 opacity-0 overflow-hidden` so it genuinely occupies zero height.
 * `prefers-reduced-motion` is honored globally via the rule in styles.css
 * that caps `transition-duration` to 0.01ms.
 *
 * The chevron indicator lives in both states but rotates differently:
 *   - Collapsed: ChevronRight, rotated 0deg (points →).
 *   - Expanded: a separate ChevronDown button in the action row (already
 *     points down, indicating "collapse back up" via its rotation-on-click
 *     motion to a ChevronUp visual reading).
 * Using two distinct icons — rather than one icon that rotates 90deg —
 * keeps the collapsed row visually aligned with its siblings (the arrow
 * always sits on the baseline of the author name) and avoids the "floating
 * in dead space" look that a lone rotated chevron produces in empty
 * summary rows.
 */
export function ThreadCard({
  thread,
  currentAuthorName,
  readOnly,
  anchorText,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: ThreadCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [replying, setReplying] = useState(false);
  const replyCount = thread.replies.length;

  return (
    <div
      className="group/thread overflow-hidden rounded-md border border-border bg-card text-sm transition-colors"
      data-testid={`thread-${thread.id}`}
      data-resolved={thread.resolved ? "true" : "false"}
      data-expanded={expanded ? "true" : "false"}
    >
      {/*
       * --- Collapsed-state summary row / always-visible header ---
       *
       * Rendered as a single button so the whole row is a tap target.
       * In the expanded state we still render this row but swap its role:
       * the summary-content is hidden via `sr-only`-equivalent classes and
       * the action row below takes over. Keeping one DOM header per state
       * avoids re-mounting when toggling (preserves hover/focus scroll
       * position, and the browser's native animation of the inner block).
       */}
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label={`Expand comment from ${thread.authorName}`}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          {/* Identity dot — the colored accent carries author-identity in the
              collapsed row. Using a ring-border hairline stops the dot from
              disappearing into very-light author colors on white. */}
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full ring-1 ring-border/60 ring-inset"
            style={{ background: thread.authorColor }}
          />

          <span className="truncate text-sm font-medium text-foreground">
            {thread.authorName}
          </span>

          {/* Middle-dot separator — typographic interpunct, not a bullet.
              Uses muted-foreground/60 so it reads as "punctuation," not
              a discrete glyph competing with the author name. */}
          <span
            aria-hidden
            className="text-muted-foreground/60 shrink-0"
          >
            &middot;
          </span>

          <span className="flex-1 truncate text-sm text-muted-foreground">
            {previewText(thread.body, thread.rootDeleted)}
          </span>

          {/* Resolved pill — sits to the left of the reply count so the eye
              scans: identity → preview → status → replies → chevron. Hidden
              when not resolved so non-resolved threads stay visually quiet. */}
          {thread.resolved && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              aria-label="Resolved"
            >
              <Check aria-hidden className="size-2.5" strokeWidth={2.5} />
              <span>Resolved</span>
            </span>
          )}

          {/* Reply-count badge. Only rendered when > 0 so unreplied threads
              don't carry a "0" visual weight. The MessageSquare 10px icon
              keeps the badge semantic even if a user misreads the number. */}
          {replyCount > 0 && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
              aria-label={`${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
            >
              <MessageSquare aria-hidden className="size-2.5" strokeWidth={2.25} />
              {replyCount}
            </span>
          )}

          {/* ChevronRight — 16px. Opacity climbs on row-hover so the
              affordance is discoverable but doesn't shout in a long list. */}
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground/70 transition-opacity group-hover/thread:text-muted-foreground"
            strokeWidth={2}
          />
        </button>
      ) : (
        // --- Expanded-state header row (author + time + actions) ---
        // Distinct from the collapsed row because the action buttons need
        // independent click targets (resolving shouldn't also collapse).
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-3 pt-2.5 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
              style={{ background: thread.authorColor }}
            >
              {thread.authorName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelative(thread.createdAt)}
            </span>
            {thread.resolved && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                aria-label="Resolved"
              >
                <Check aria-hidden className="size-2.5" strokeWidth={2.5} />
                <span>Resolved</span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onResolveToggle}
                  aria-label={thread.resolved ? "Unresolve" : "Resolve"}
                  title={thread.resolved ? "Unresolve" : "Resolve"}
                  className="size-7"
                >
                  {thread.resolved ? (
                    <RotateCcw className="size-3.5" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </Button>
                {thread.authorName === currentAuthorName && !thread.rootDeleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDeleteThreadRoot}
                    aria-label="Delete comment"
                    title="Delete"
                    className="size-7"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
              aria-label="Collapse comment"
              title="Collapse"
              className="size-7"
            >
              <ChevronDown className="size-3.5" strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {/*
       * --- Expandable content block ---
       *
       * Always mounted; visibility controlled by max-height + opacity so
       * the chevron has something smooth to animate against. When collapsed,
       * max-h-0 + overflow-hidden removes it from layout flow. aria-hidden
       * mirrors the visual state so assistive tech doesn't read stale
       * replies when the thread is tucked away.
       *
       * max-h-[800px] is a generous upper bound — realistic threads rarely
       * exceed this. Long threads naturally scroll inside the sidebar's
       * outer scroll container, not inside this block. The browser clamps
       * to content height when natural height is shorter, so there's no
       * wasted space for short threads.
       *
       * `ease-out` on the way in (200ms) matches the motion vocabulary
       * used elsewhere (PanelTabs width animation). Global styles.css
       * reduces transition-duration to 0.01ms under prefers-reduced-motion.
       */}
      <div
        aria-hidden={!expanded}
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
          expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3 pt-2.5 pb-3">
            {/* Anchor quote — editorial left-rule, italic, clickable.
                Clicking scrolls the editor to the anchor position. */}
            <button
              type="button"
              onClick={onClickAnchor}
              className="mb-2.5 block w-full truncate border-l-2 border-primary/40 pl-2 text-left text-xs italic text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              &ldquo;{anchorText || "(deleted anchor)"}&rdquo;
            </button>

            {/* Body — whitespace-pre-wrap so authors can include paragraph
                breaks; the outer max-h handles extreme overflow gracefully. */}
            <p className="m-0 text-sm whitespace-pre-wrap text-foreground">
              {thread.rootDeleted ? (
                <span className="italic text-muted-foreground">[deleted]</span>
              ) : (
                thread.body
              )}
            </p>

            {/* Replies — indented via a left rule that picks up the same
                primary/20 as the anchor quote, visually threading the two
                together as "related context." */}
            {thread.replies.length > 0 && (
              <div className="mt-3 space-y-2.5 border-l border-border pl-3">
                {thread.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="text-xs"
                    data-testid={`reply-${reply.id}`}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                          style={{ background: reply.authorColor }}
                        >
                          {reply.authorName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelative(reply.createdAt)}
                        </span>
                      </div>
                      {!readOnly && reply.authorName === currentAuthorName && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteReply(reply.id)}
                          aria-label="Delete reply"
                          title="Delete reply"
                          className="size-6"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                    <p className="m-0 whitespace-pre-wrap text-foreground/90">
                      {reply.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply affordance. In read-only mode it's omitted entirely
                (no "you can't reply" tooltip — the absence is the signal). */}
            {!readOnly && (
              <div className="mt-3">
                {replying ? (
                  <CommentComposer
                    placeholder="Write a reply…"
                    submitLabel="Reply"
                    onCancel={() => setReplying(false)}
                    onSubmit={(body) => {
                      onReply(body);
                      setReplying(false);
                    }}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplying(true)}
                    className="-ml-2 h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare aria-hidden className="size-3.5" />
                    Reply
                  </Button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
