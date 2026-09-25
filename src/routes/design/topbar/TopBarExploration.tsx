import { useState } from "react";
import { Link, useParams } from "react-router";
import { Moon, Sun, X } from "lucide-react";
import { ExplorationBar } from "../DesignIndex";
import { useTheme } from "~/lib/theme/useTheme";
import Home from "~/routes/Home";
import Developers from "~/routes/Developers";

/**
 * Round 4 — a top bar that switches audience (teams / developers) so the
 * cross-link can leave the main nav. Three treatments, each shown on the
 * real homepage and developer page:
 *
 *   A. Utility bar: solid indigo, a notched audience switch, live status,
 *      and a "log in" slot that will matter once accounts exist.
 *   B. Announcement bar: indigo with a faint seigaiha ground, plain audience
 *      links, one dismissible message about the pilot.
 *   C. Hairline bar: no fill, tiny text, audience links plus status, theme
 *      toggle and the 型紙 mark. The quiet version.
 *   D. Hairline v2: C's content and size on B's indigo seigaiha ground.
 *
 * Routes: /design/topbar/:variant and /design/topbar/:variant/developers.
 */

const INDIGO = "#274b8f";

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH_SM =
  "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)";

type Audience = "teams" | "developers";
type Variant = "a" | "b" | "c" | "d";

export default function TopBarExploration() {
  const { variant = "a", audience } = useParams();
  const v = (["a", "b", "c", "d"].includes(variant) ? variant : "a") as Variant;
  const aud: Audience = audience === "developers" ? "developers" : "teams";
  const to = (a: Audience) => `/design/topbar/${v}${a === "developers" ? "/developers" : ""}`;

  return (
    <div style={{ ["--indigo" as string]: INDIGO }}>
      <ExplorationBar round="topbar" current={v} />
      {v === "a" && <BarA audience={aud} to={to} />}
      {v === "b" && <BarB audience={aud} to={to} />}
      {v === "c" && <BarC audience={aud} to={to} />}
      {v === "d" && <BarD audience={aud} to={to} />}
      {aud === "developers" ? (
        <Developers audienceLink={false} />
      ) : (
        <Home audienceLink={false} />
      )}
    </div>
  );
}

type BarProps = { audience: Audience; to: (a: Audience) => string };

/* ---- A. Utility bar ------------------------------------------------------ */

function BarA({ audience, to }: BarProps) {
  return (
    <div className="bg-[var(--indigo)] text-white">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-6 text-xs md:px-10">
        <div
          role="tablist"
          aria-label="Katagami for"
          className="flex items-center gap-1 bg-white/10 p-0.5"
          style={{ clipPath: NOTCH_SM }}
        >
          {(["teams", "developers"] as Audience[]).map((a) => {
            const active = a === audience;
            return (
              <Link
                key={a}
                to={to(a)}
                role="tab"
                aria-selected={active}
                style={{ clipPath: NOTCH_SM }}
                className={
                  "px-3 py-1 font-medium " +
                  (active ? "bg-white text-[var(--indigo)]" : "text-white/85 hover:text-white")
                }
              >
                {a === "teams" ? "For teams" : "For developers"}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-emerald-300" />
            All systems normal
          </span>
          <span className="hidden text-white/70 sm:inline">Pilot: every plan is free while billing is built</span>
          <span className="text-white/70" title="Accounts arrive with the Team plan">
            Log in · soon
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- B. Announcement bar ------------------------------------------------- */

function BarB({ audience, to }: BarProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative bg-[var(--indigo)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-white opacity-[0.12]"
        style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
      />
      <div className="relative mx-auto flex h-9 max-w-6xl items-center justify-between gap-6 px-6 text-xs md:px-10">
        <nav aria-label="Katagami for" className="flex items-center gap-4">
          {(["teams", "developers"] as Audience[]).map((a) => {
            const active = a === audience;
            return (
              <Link
                key={a}
                to={to(a)}
                aria-current={active ? "page" : undefined}
                className={
                  "py-1 " +
                  (active
                    ? "border-b border-white font-medium"
                    : "text-white/75 hover:text-white")
                }
              >
                {a === "teams" ? "For teams" : "For developers"}
              </Link>
            );
          })}
        </nav>
        {open ? (
          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate">
              <span className="hidden sm:inline">Now in pilot: </span>
              every plan is free while billing is built.{" "}
              <Link to="/pricing" className="underline underline-offset-4">
                See what's coming
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss"
              className="text-white/70 hover:text-white"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <span className="text-white/70">型紙</span>
        )}
      </div>
    </div>
  );
}

/* ---- C. Hairline bar ------------------------------------------------------ */

function BarC({ audience, to }: BarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <div className="border-b border-border bg-background text-[11px] text-muted-foreground">
      <div className="mx-auto flex h-8 max-w-6xl items-center justify-between px-6 md:px-10">
        <nav aria-label="Katagami for" className="flex items-center gap-3">
          <span>Katagami for</span>
          {(["teams", "developers"] as Audience[]).map((a, i) => {
            const active = a === audience;
            return (
              <span key={a} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>·</span>}
                <Link
                  to={to(a)}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "font-medium text-[var(--indigo)] dark:text-blue-300"
                      : "hover:text-foreground"
                  }
                >
                  {a === "teams" ? "Teams" : "Developers"}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Operational
          </span>
          <span className="hidden sm:inline" title="Accounts arrive with the Team plan">
            Log in · soon
          </span>
          <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} mode`}
            className="inline-flex size-6 items-center justify-center hover:text-foreground"
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

/* ---- D. Hairline v2: C on B's ground ------------------------------------- */

function BarD({ audience, to }: BarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <div className="relative bg-[var(--indigo)] text-[11px] text-white/80">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-white opacity-[0.12]"
        style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
      />
      <div className="relative mx-auto flex h-8 max-w-6xl items-center justify-between px-6 md:px-10">
        <nav aria-label="Katagami for" className="flex items-center gap-3">
          <span>Katagami for</span>
          {(["teams", "developers"] as Audience[]).map((a, i) => {
            const active = a === audience;
            return (
              <span key={a} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>·</span>}
                <Link
                  to={to(a)}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "border-b border-white font-medium text-white"
                      : "hover:text-white"
                  }
                >
                  {a === "teams" ? "Teams" : "Developers"}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-emerald-300" />
            Operational
          </span>
          <span className="hidden sm:inline" title="Accounts arrive with the Team plan">
            Log in · soon
          </span>
          <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} mode`}
            className="inline-flex size-6 items-center justify-center hover:text-white"
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
