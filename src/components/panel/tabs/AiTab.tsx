import { Bell, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

/**
 * AiTab — placeholder tab for the AI text-ops feature that ships in Phase 5.
 *
 * Shares the empty-state vocabulary defined by {@link DocsTab}: dual-ring
 * icon badge on a blurred primary halo, centered editorial stack, disabled
 * outline CTA wrapped in the Task-11 `role="presentation" tabIndex={-1}`
 * span so the tooltip still fires on hover.
 *
 * The only variance from DocsTab is content and the roadmap marker — the
 * structure is intentionally identical so the two tabs feel like siblings
 * rather than two attempts at the same pattern.
 */
export function AiTab() {
  return (
    <div className="relative h-full overflow-hidden">
      {/*
       * Ambient halo — see DocsTab for the rationale. Kept byte-identical so
       * switching between the two tabs does not shift the glow position.
       */}
      <div
        aria-hidden
        className="komon pointer-events-none absolute inset-0 -z-0 text-brand-ink opacity-[0.10] dark:opacity-[0.16]"
      />

      <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="notch relative mb-5 bg-brand/10 p-3">
          <div className="notch-sm flex size-11 items-center justify-center bg-background">
            <Sparkles
              aria-hidden
              className="size-5 text-brand-ink"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <h3 className="text-base leading-tight font-semibold text-foreground">
          AI rewriting is in development
        </h3>

        <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
          Soon you&rsquo;ll be able to select text and ask the assistant to
          rewrite, summarize, or expand it.
        </p>

        <div className="mt-5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="presentation"
                  tabIndex={-1}
                  className="inline-block outline-none"
                >
                  <Button variant="outline" size="sm" disabled>
                    <Bell aria-hidden />
                    Notify me
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Available in Phase 5.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/80">
          <span
            aria-hidden
            className="size-1 rounded-full bg-primary/60"
          />
          <span>Phase 5 · AI text operations</span>
        </div>
      </div>
    </div>
  );
}
