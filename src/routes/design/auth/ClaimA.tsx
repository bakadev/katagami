import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";

/**
 * Claim a project, option A: a modal-style sheet over a blurred document.
 *
 * The person has just signed in, and this browser holds the creator token
 * for a few documents they made without an account. The sheet offers to
 * attach them to the new workspace. Behind it, faked with a few lines of
 * Markdown on a notched card, is the document they were on, so it's clear
 * they can carry on where they left off either way.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const WORKSPACE = "Acme";

const FOUND = [
  { title: "Checkout redesign · PRD", edited: "Today, 4:12 PM" },
  { title: "Onboarding email sequence", edited: "Tue, 11:30 AM" },
  { title: "Pricing page copy, draft 2", edited: "Sep 18" },
];

export default function ClaimA() {
  usePageMeta({
    title: "Claim your documents",
    description: "Move documents from this browser into your workspace.",
  });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      <ExplorationBar round="auth" current="claim-a" />

      <main className="relative min-h-[calc(100vh-2.25rem)] overflow-hidden">
        {/* The document behind, blurred */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none blur-[3px]"
        >
          <div className="mx-auto max-w-3xl px-6 pt-10">
            <p className="text-xs text-muted-foreground">Checkout redesign · PRD · v3</p>
            <div style={{ clipPath: NOTCH }} className="mt-4 border border-border bg-card p-8">
              <pre style={{ fontFamily: SERIF }} className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/80">
{`# Guest checkout

Shoppers can complete a purchase without creating an account.
We ask for an email for the receipt and offer account creation
on the confirmation screen.

## Success metric

Checkout completion rate for first-time visitors over the four
weeks after launch.

## Out of scope

- Saved payment methods
- Loyalty points
- Phone number collection (legal wanted it for fraud checks)`}
              </pre>
            </div>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-background/60" />

        {/* The sheet */}
        <div className="relative mx-auto max-w-lg px-6 py-14 sm:py-20">
          <div className="relative">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <section
              role="dialog"
              aria-labelledby="claim-title"
              style={{ clipPath: NOTCH }}
              className="border border-[var(--indigo)] bg-card p-6 shadow-lg sm:p-8 dark:border-blue-300/60"
            >
              <div className="flex items-center gap-2.5">
                <StencilMark />
                <p className="text-xs text-muted-foreground">Found in this browser</p>
              </div>
              <h1 id="claim-title" style={{ fontFamily: SERIF }} className="mt-3 text-2xl leading-tight sm:text-3xl">
                Bring these documents with you?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You made these before you had an account. Move them into {WORKSPACE} and
                they get named history and seats like everything else there.
              </p>

              <ul className="mt-6 divide-y divide-border border-y border-border">
                {FOUND.map((d) => (
                  <li key={d.title} className="flex items-center gap-3 py-3 text-sm">
                    <DocGlyph />
                    <span className="min-w-0 flex-1 truncate">{d.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{d.edited}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  style={{ clipPath: NOTCH }}
                  className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Move these into {WORKSPACE}
                </button>
                <Link
                  to="/"
                  style={{ clipPath: NOTCH }}
                  className="group inline-block bg-border p-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    style={{ clipPath: NOTCH_IN }}
                    className="flex h-[42px] items-center bg-card px-5 text-sm font-medium group-hover:bg-muted/60"
                  >
                    Not now
                  </span>
                </Link>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Share links keep working either way. Anyone who has one can still open the
                document at the same address.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function DocGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-[var(--indigo)] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M3.5 1.5h6l3 3v10h-9z" />
      <path d="M9.5 1.5v3h3M5.5 7.5h5M5.5 10h5M5.5 12.5h3" />
    </svg>
  );
}

function RegMark({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`absolute size-4 text-[var(--indigo)] opacity-60 dark:text-blue-300 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="8" cy="8" r="4" />
      <path d="M8 0v16M0 8h16" />
    </svg>
  );
}

function StencilMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 text-[var(--indigo)] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
