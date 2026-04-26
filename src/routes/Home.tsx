import { useState, type ComponentType, type SVGProps } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  History as HistoryIcon,
  MessageSquareText,
  Moon,
  MousePointer2,
  Sun,
} from "lucide-react";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTheme } from "~/lib/theme/useTheme";

/**
 * Home — quiet workshop landing page.
 *
 * "Katagami" (型紙) refers to Japanese paper stencils used in kimono dyeing —
 * exquisite hand-cut templates that get filled in by skilled hands working
 * together. This page leans into that metaphor with editorial-magazine spacing
 * and a small lattice wordmark glyph that nods to stencil work without being
 * literal.
 *
 * The hero's anchor is the headline: "Specs that *collaborate* with you." The
 * word "collaborate" wears the same comment-anchor highlight used in the
 * editor, and a small floating comment pill is pinned next to it as if a
 * teammate just left a remark. The page IS a small live demo of the product's
 * core value, not a description of it.
 */
export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const body = await createProject();
      storeCreatorToken(body.project.id, body.creatorToken);
      setLoading(false);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Ambient halo — same vocabulary as the empty-state motif used inside
          the app's tabs. Sits behind everything; pointer-events disabled. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[42%] size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
      </div>

      {/* Registration marks — quiet katagami detail at the four corners.
          Tiny crosshair glyphs that read as "this is a working surface". */}
      <RegistrationMark className="absolute left-4 top-4" />
      <RegistrationMark className="absolute right-4 top-4" />
      <RegistrationMark className="absolute bottom-4 left-4" />
      <RegistrationMark className="absolute bottom-4 right-4" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 md:px-12">
        <div className="flex items-center gap-2.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
          <KatagamiMark />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground">
            Katagami
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div className="relative flex max-w-[640px] flex-col items-center text-center">
          {/* Eyebrow with rule lines on either side — magazine masthead feel */}
          <div className="mb-6 inline-flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
            <span aria-hidden className="h-px w-6 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              For cross-functional spec teams
            </span>
            <span aria-hidden className="h-px w-6 bg-border" />
          </div>

          {/* Headline — the visual demo lives here.
              "collaborate" wears a comment-anchor highlight and the floating
              comment pill is pinned to its right. */}
          <h1 className="relative text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:delay-150 sm:text-[64px]">
            Specs that{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10">collaborate</span>
              {/* Highlight matches the editor's .comment-anchor color-mix at ~18% */}
              <span
                aria-hidden
                className="absolute inset-x-[-4px] bottom-[6%] z-0 h-[42%] rounded-sm bg-primary/15 dark:bg-primary/20"
              />
              {/* Floating comment pill, pinned just outside the word */}
              <FloatingCommentPill />
            </span>{" "}
            with you.
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-md text-balance text-base leading-relaxed text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000 motion-safe:delay-300">
            Real-time editing, comment threads anchored to text, and named
            version history — all in plain Markdown.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:delay-500">
            <Button
              onClick={handleCreate}
              disabled={loading}
              size="lg"
              className="h-11 gap-2 px-6 text-sm font-medium tracking-tight"
            >
              {loading ? (
                "Creating…"
              ) : (
                <>
                  Start a new spec
                  <ArrowRight aria-hidden className="size-4" />
                </>
              )}
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground/80">
              No account needed. Share a link to invite collaborators.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive" className="mt-4 max-w-sm text-left">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Feature trio — three glanceable signals, not cards */}
          <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000 motion-safe:delay-700">
            <FeatureBadge icon={MousePointer2} label="Live cursors" />
            <Separator />
            <FeatureBadge icon={MessageSquareText} label="Threaded comments" />
            <Separator />
            <FeatureBadge icon={HistoryIcon} label="Version history" />
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-end justify-between px-8 pb-5 md:px-12 font-semibold uppercase tracking-wide text-muted-foreground/60">
        <span className="text-base">型紙</span>
        <span className="text-xs">Phase 4a</span>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// KatagamiMark — 4-cell lattice glyph, a quiet stencil reference.
// ---------------------------------------------------------------------------

function KatagamiMark() {
  return (
    <span
      aria-hidden
      className="inline-grid size-4 grid-cols-2 grid-rows-2 gap-[1.5px]"
    >
      <span className="rounded-[1.5px] bg-foreground" />
      <span className="rounded-[1.5px] bg-foreground/55" />
      <span className="rounded-[1.5px] bg-foreground/55" />
      <span className="rounded-[1.5px] bg-foreground" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// RegistrationMark — small crosshair at the page corners. Pure decoration.
// ---------------------------------------------------------------------------

function RegistrationMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none size-3 ${className ?? ""}`}
    >
      <svg viewBox="0 0 12 12" className="size-full text-border" fill="none">
        <path d="M6 1 V11" stroke="currentColor" strokeWidth="0.75" />
        <path d="M1 6 H11" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="0.75" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ThemeToggle — 2-state flip between resolvedTheme's opposite and current.
// ---------------------------------------------------------------------------

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const NextIcon = isDark ? Sun : Moon;
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={label}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <NextIcon aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// FloatingCommentPill — pinned to the highlighted word in the headline.
//
// Sized small, slightly rotated, on a card surface with a soft shadow so it
// reads as a layer above the page. Hidden below sm so the headline doesn't
// fight for room on narrow viewports.
// ---------------------------------------------------------------------------

function FloatingCommentPill() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-[-200px] top-[-78px] hidden -rotate-20 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 motion-safe:duration-1000 motion-safe:delay-700 lg:inline-block"
    >
      <span className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3 py-2.5 text-left shadow-lg shadow-black/6 ring-1 ring-black/3 dark:bg-card dark:shadow-black/40 dark:ring-white/4">
        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-400 text-[10px] font-semibold leading-none text-white">
          S
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold tracking-tight text-foreground">
              Sakura
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
              2m ago
            </span>
          </span>
          <span className="mt-0.5 text-[12px] leading-snug text-foreground/80 tracking-wide">
            Love this — let&apos;s lock it in for v1.
          </span>
        </span>
      </span>
      {/* Tail — hairline dropping from the pill's bottom-right toward the word */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 top-full inline-block h-[14px] w-px bg-border"
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// FeatureBadge — icon + label, glanceable.
// ---------------------------------------------------------------------------

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-3.5 text-muted-foreground/70" />
      <span className="font-medium tracking-tight">{label}</span>
    </li>
  );
}

function Separator() {
  return (
    <li
      aria-hidden
      className="text-muted-foreground/30 select-none"
    >
      ·
    </li>
  );
}
