import { useState } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";

/**
 * After sign-in, option B: a quiet card.
 *
 * No stepper. The provider avatar and name, "You're signed in", one name
 * field prefilled from the email domain, one primary button, and a single
 * line about seats so nobody worries about inviting people right now.
 * Sits on a komon band so the page has a ground without shouting.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const USER = { name: "Priya Raman", email: "priya@acme.co", provider: "GitHub", initials: "PR" };

export default function WelcomeB() {
  usePageMeta({
    title: "Welcome",
    description: "You're signed in. Name your workspace.",
  });
  const [name, setName] = useState("Acme");

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-tint" as string]: `color-mix(in srgb, ${INDIGO} 16%, var(--card))`,
      }}
    >
      <ExplorationBar round="auth" current="welcome-b" />

      <main className="relative">
        <div
          aria-hidden
          className="komon pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
        />

        <div className="relative mx-auto max-w-md px-6 pb-24 pt-16 sm:pt-24">
          <div className="relative">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <form
              style={{ clipPath: NOTCH }}
              className="border border-border bg-card p-6 shadow-sm sm:p-8"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{ fontFamily: SERIF, clipPath: NOTCH }}
                  className="flex size-11 shrink-0 items-center justify-center bg-[var(--indigo-tint)] text-base text-[var(--indigo)] dark:text-blue-300"
                  aria-hidden
                >
                  {USER.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{USER.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    via {USER.provider} · {USER.email}
                  </p>
                </div>
              </div>

              <h1 style={{ fontFamily: SERIF }} className="mt-6 text-3xl leading-tight">
                You're signed in.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                One more thing: what should we call your workspace?
              </p>

              <label className="mt-6 grid gap-1.5 text-sm">
                <span className="font-medium">Workspace name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <button
                type="submit"
                style={{ clipPath: NOTCH }}
                className="mt-5 h-11 w-full bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Create workspace
              </button>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                5 seats included on Team, add people any time.
              </p>

              <div className="mt-5 border-t border-border pt-4 text-sm">
                <Link
                  to="/"
                  className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                >
                  Skip for now
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

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
