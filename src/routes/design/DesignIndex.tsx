import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";
import { useTheme } from "~/lib/theme/useTheme";

/**
 * Design exploration index (`/design`). Public, so external reviewers can
 * open the options directly; not linked from the app's own navigation.
 *
 * Each round takes one surface of the app and shows three alternatives, each
 * aimed at a different persona. Pages under `src/routes/design/` are throwaway
 * by design: one file per option, inline Tailwind, no shared components.
 * See docs/design-explorations/README.md for the persona definitions.
 */

interface Option {
  slug: string;
  persona: string;
  title: string;
  blurb: string;
}

interface Round {
  id: string;
  surface: string;
  date: string;
  options: Option[];
}

const ROUNDS: Round[] = [
  {
    id: "home",
    surface: "Homepage",
    date: "2026-09-24",
    options: [
      {
        slug: "developer",
        persona: "Developer",
        title: "The file is the product",
        blurb:
          "For engineers who create, edit and maintain Markdown docs and want a tool, not a platform.",
      },
      {
        slug: "product",
        persona: "Product / Business",
        title: "Get everyone to yes",
        blurb:
          "For POs, PMs and business users writing specs that the dev team or an AI agent will build from.",
      },
      {
        slug: "enterprise",
        persona: "Enterprise buyer",
        title: "Safe to standardize on",
        blurb:
          "For an IT or ops lead evaluating one tool for every team, with security, hosting and pricing up front.",
      },
    ],
  },
];

export default function DesignIndex() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Katagami</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Design explorations
            </h1>
          </div>
          <ThemeToggleButton />
        </div>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Three alternatives per surface, each built for a different persona so
          the options diverge instead of drifting toward one idea. Nothing here
          is final.
        </p>

        {ROUNDS.map((round) => (
          <section key={round.id} className="mt-12">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-lg font-medium">{round.surface}</h2>
              <span className="text-xs text-muted-foreground">{round.date}</span>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {round.options.map((opt) => (
                <li key={opt.slug}>
                  <Link
                    to={`/design/${round.id}/${opt.slug}`}
                    className="block h-full rounded-lg border border-border p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-xs text-muted-foreground">
                      {opt.persona}
                    </span>
                    <span className="mt-1 block font-medium">{opt.title}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {opt.blurb}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-16 text-sm text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Current homepage
          </Link>
        </p>
      </div>
    </main>
  );
}

/**
 * Thin strip pinned to the top of every option page so you can hop between
 * the three alternatives without going back to the index.
 */
export function ExplorationBar({
  round,
  current,
}: {
  round: string;
  current: string;
}) {
  const r = ROUNDS.find((x) => x.id === round);
  if (!r) return null;
  return (
    <div className="sticky top-0 z-50 flex h-9 items-center justify-between border-b border-border bg-background/95 px-4 text-xs backdrop-blur">
      <Link to="/design" className="text-muted-foreground hover:text-foreground">
        ← Explorations / {r.surface}
      </Link>
      <nav className="flex items-center gap-1">
        {r.options.map((o) => (
          <Link
            key={o.slug}
            to={`/design/${r.id}/${o.slug}`}
            aria-current={o.slug === current ? "page" : undefined}
            className={
              "rounded px-2 py-0.5 " +
              (o.slug === current
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {o.persona}
          </Link>
        ))}
        <ThemeToggleButton />
      </nav>
    </div>
  );
}

/** Light/dark switch so reviewers can check both modes without the avatar menu. */
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="ml-2 inline-flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-3.5" aria-hidden />
      ) : (
        <Moon className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

/** Shared "create a doc" behaviour so each option's primary CTA is real. */
export function useCreateDoc() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const body = await createProject();
      storeCreatorToken(body.project.id, body.creatorToken);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return { create, loading, error };
}
