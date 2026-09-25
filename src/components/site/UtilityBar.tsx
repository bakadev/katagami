import { Link, useLocation } from "react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "~/lib/theme/useTheme";
import { SEIGAIHA } from "~/components/site/patterns";

/**
 * Site-wide utility bar above every marketing page's header. Chosen from the
 * Round 4 design exploration (option D, hairline v2).
 *
 * Carries the things that don't belong in a page's own nav: the audience
 * switch (teams / developers), service status, the log-in slot that becomes
 * real once accounts ship, and the theme toggle.
 */

const INDIGO = "#274b8f";

export type Audience = "teams" | "developers";

/** The developer page is the only developer-audience route today. */
export function audienceFor(pathname: string): Audience {
  return pathname === "/developers" || pathname.startsWith("/developers/")
    ? "developers"
    : "teams";
}

export function UtilityBar() {
  const { pathname } = useLocation();
  const audience = audienceFor(pathname);
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <div
      className="relative text-[11px] text-white/80"
      style={{ background: INDIGO }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-white opacity-[0.12]"
        style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
      />
      <div className="relative mx-auto flex h-8 max-w-6xl items-center justify-between px-6 md:px-10">
        <nav aria-label="Katagami for" className="flex items-center gap-3">
          <span>Katagami for</span>
          {(
            [
              ["teams", "Teams", "/"],
              ["developers", "Developers", "/developers"],
            ] as [Audience, string, string][]
          ).map(([id, label, to], i) => {
            const active = id === audience;
            return (
              <span key={id} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>·</span>}
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "border-b border-white font-medium text-white"
                      : "hover:text-white"
                  }
                >
                  {label}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span
              aria-hidden
              className="inline-block size-1.5 rounded-full bg-emerald-300"
            />
            Operational
          </span>
          <Link to="/signin" className="hidden hover:text-white sm:inline">
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} mode`}
            className="inline-flex size-6 items-center justify-center hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-3.5" aria-hidden />
            ) : (
              <Moon className="size-3.5" aria-hidden />
            )}
          </button>
          <span aria-hidden>型紙</span>
        </div>
      </div>
    </div>
  );
}
