import { FolderOpen, FolderPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

/**
 * DocsTab — placeholder tab for the multi-doc browser that ships in Phase 4b.
 *
 * This is a zero-prop stub. The component establishes the empty-state visual
 * vocabulary shared with {@link AiTab}:
 *
 *   - A dual-ring icon badge (solid tinted disc + hairline outer ring) sitting
 *     on a blurred radial halo. Quiet, editorial — not a "Coming Soon" banner.
 *   - Title + description in a centered editorial stack (max 260px).
 *   - Disabled outline CTA inside a Tooltip. The `role="presentation"
 *     tabIndex={-1}` span wrapper is the pattern hardened in Task 11
 *     (see `src/components/avatar-menu/AvatarDropdown.tsx`) — disabled buttons
 *     drop `pointer-events`, which kills hover detection on the tooltip; the
 *     wrapper restores pointer events for the tooltip only, while staying out
 *     of the tab order so keyboard users aren't led to a dead-end.
 *   - Footer roadmap marker ("Phase 4b · Multi-doc workspaces") reframes the
 *     stub as "scheduled" rather than "absent".
 *
 * All colors flow through shadcn tokens so dark mode tracks automatically.
 * Entrance animation is gated by `motion-safe:` so users with
 * `prefers-reduced-motion` see the stable end-state immediately.
 */
export function DocsTab() {
  return (
    <div className="relative h-full overflow-hidden">
      {/*
       * Ambient halo — a soft, blurred primary-tinted orb anchored behind the
       * icon badge. Purely decorative (aria-hidden) and positioned with
       * negative insets so the blur bleeds cleanly past the badge without
       * creating a visible hard edge. Opacity stays low in light mode and
       * slightly higher in dark so the glow survives the darker canvas.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-48 -translate-x-1/2 -translate-y-[calc(50%+28px)] rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />

      <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        {/*
         * Icon badge — dual-ring "dial" motif. The outer ring is a 1px inset
         * ring tinted with primary/15 so it reads as a hairline, not a
         * stroke. The inner disc uses primary/10 for the fill and a 20px
         * icon centered inside. The gap between rings is the padding of the
         * outer element (p-3 = 12px), so the rings stay concentric across
         * any icon-size tweak.
         */}
        <div className="relative mb-5 rounded-full p-3 ring-1 ring-primary/15 ring-inset">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <FolderOpen
              aria-hidden
              className="size-5 text-primary/80"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <h3 className="text-base leading-tight font-semibold text-foreground">
          Documents are coming soon
        </h3>

        <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
          Organize related specs into folders and navigate between them from
          here.
        </p>

        <div className="mt-5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/*
                 * Disabled-CTA-with-live-tooltip pattern — see component JSDoc
                 * above for the full rationale. The span has no visual effect
                 * (block, no padding) and restores pointer events so the
                 * tooltip fires on hover of the disabled button.
                 */}
                <span
                  role="presentation"
                  tabIndex={-1}
                  className="inline-block outline-none"
                >
                  <Button variant="outline" size="sm" disabled>
                    <FolderPlus aria-hidden />
                    Browse documents
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Available in an upcoming update.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/*
         * Roadmap marker — a small, low-emphasis footer that reframes the
         * empty state as scheduled rather than absent. The pip picks up the
         * primary tint so it threads the badge color all the way to the
         * bottom of the stack, giving the whole layout a single accent.
         */}
        <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/80">
          <span
            aria-hidden
            className="size-1 rounded-full bg-primary/60"
          />
          <span>Phase 4b · Multi-doc workspaces</span>
        </div>
      </div>
    </div>
  );
}
