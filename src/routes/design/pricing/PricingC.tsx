import { useState } from "react";
import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { ExplorationBar } from "../DesignIndex";

/**
 * Pricing exploration, option C: "Start free, grow".
 *
 * A narrative page rather than a grid. It opens on what you can do right
 * now with no account, then a seat calculator shows what Team costs for a
 * team of your size ($39 with five seats, $8 per seat after that), then the
 * things Team adds over Free, and Enterprise closes the page as a quiet
 * band. For the reader who is asking "what will this cost my team", not
 * "what is the feature matrix". Content is the decided column set from
 * docs/design-explorations/two-tier-proposal.md section 5.
 *
 * Style is Product v2 (src/routes/Home.tsx). Helpers are copied, not
 * shared; the page is throwaway.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const BASE_PRICE = 39;
const INCLUDED_SEATS = 5;
const EXTRA_SEAT = 8;
const MAX_SEATS = 40;

/* ---- stencil tiles ------------------------------------------------------ */

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const ASANOHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/>
<path d='M28 0 L28 64 M0 16 L56 48 M56 16 L0 48'/>
<path d='M28 32 L56 16 M28 32 L0 16 M28 32 L0 48 M28 32 L56 48 M28 32 L28 0 M28 32 L28 64'/>
<path d='M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z' transform='translate(0,-16)'/>
<path d='M0 48 L28 64 M56 48 L28 64'/>
<path d='M0 80 L28 64 L56 80 M28 64 L28 97'/>
</g></svg>`);

const KOMON = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<g fill='currentColor'><circle cx='4' cy='4' r='1.2'/><circle cx='12' cy='12' r='1.2'/></g></svg>`);

const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

/* ---- content ------------------------------------------------------------ */

const TEAM_ADDS: { title: string; body: string; free: string }[] = [
  {
    title: "As many docs as the work needs",
    body: "Projects hold many docs each, with one share setting for the lot. No counting.",
    free: "Free: 10 single docs",
  },
  {
    title: "Everyone in the doc at once",
    body: "Every seat can edit at the same time. Viewers and commenters still cost nothing.",
    free: "Free: 2 editing at once",
  },
  {
    title: "Links that match the audience",
    body: "Comment-only links for reviewers, login-required links for anything sensitive.",
    free: "Free: edit and view links",
  },
  {
    title: "Every sign-off kept",
    body: "Name as many versions as you have decisions. Go back to any of them.",
    free: "Free: 3 named versions",
  },
  {
    title: "PDF alongside Markdown",
    body: "Export the same doc as a PDF for people who want to read it, and Markdown for people who want to build from it.",
    free: "Free: Markdown",
  },
  {
    title: "Images, and later AI text operations",
    body: "Put screenshots and diagrams in the spec. AI rewrites and summaries arrive on Team when they ship.",
    free: "Free: text only",
  },
];

export default function PricingC() {
  const { create, loading, error } = useCreateDoc();
  const [seats, setSeats] = useState(8);

  const extra = Math.max(0, seats - INCLUDED_SEATS);
  const total = BASE_PRICE + extra * EXTRA_SEAT;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <ExplorationBar round="pricing" current="c" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <StencilMark />
          <span style={{ fontFamily: SERIF }} className="text-xl">
            Katagami
          </span>
        </Link>
        <nav className="flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/" className="hidden hover:text-foreground sm:inline">
            For teams
          </Link>
          <Link
            to="/developers"
            className="hidden hover:text-foreground sm:inline"
          >
            For developers
          </Link>
          <span aria-current="page" className="hidden text-foreground sm:inline">
            Pricing
          </span>
          <button
            type="button"
            onClick={create}
            disabled={loading}
            className="bg-[var(--indigo)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            style={{ clipPath: NOTCH }}
          >
            Start a spec
          </button>
        </nav>
      </header>

      <main>
        {/* 1. Start with one doc, no account */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-[6fr_5fr] md:items-center md:px-10 md:pt-16">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Free
              </p>
              <h1
                style={{ fontFamily: SERIF }}
                className="mt-3 text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
              >
                Start with one doc. No account, no card.
              </h1>
              <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-muted-foreground">
                Click the button, get a link, send it to one other person. You
                can both edit at once, comment on any sentence, and keep{" "}
                <mark className="bg-[var(--anchor)] px-0.5 text-foreground">
                  up to ten docs
                </mark>{" "}
                this way for as long as you like.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={create}
                  disabled={loading}
                  style={{ clipPath: NOTCH }}
                  className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {loading ? "Opening…" : "Start a spec"}
                </button>
                <span className="text-sm text-muted-foreground">
                  Free, and it stays free.
                </span>
              </div>
              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  Couldn't create the doc: {error}
                </p>
              )}
            </div>

            <div className="relative">
              <RegMark className="-left-3 -top-3" />
              <RegMark className="-right-3 -top-3" />
              <RegMark className="-bottom-3 -left-3" />
              <RegMark className="-bottom-3 -right-3" />
              <div
                style={{ clipPath: NOTCH }}
                className="border border-border bg-card p-6 shadow-sm sm:p-8"
              >
                <p className="text-xs text-muted-foreground">
                  What Free includes
                </p>
                <ul className="mt-4 divide-y divide-border text-sm">
                  <Line k="Documents" v="Up to 10 single docs" />
                  <Line k="People" v="2 editing at once, any number reading" />
                  <Line k="Sharing" v="Edit and view links" />
                  <Line k="History" v="20 auto-snapshots, 3 named versions" />
                  <Line k="Export" v="Markdown" />
                  <Line k="Support" v="Community" />
                </ul>
              </div>
            </div>
          </div>
        </section>

        <CutEdge />

        {/* 2. Seat calculator on a komon ground */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[5fr_6fr] md:items-center md:px-10">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Team
              </p>
              <h2
                style={{ fontFamily: SERIF }}
                className="mt-3 max-w-[20ch] text-3xl leading-tight sm:text-4xl"
              >
                When the whole team needs to be in it, the price follows the
                team
              </h2>
              <p className="mt-5 max-w-[48ch] leading-relaxed text-muted-foreground">
                Team is ${BASE_PRICE} a month and comes with {INCLUDED_SEATS}{" "}
                seats. Each seat after that is ${EXTRA_SEAT} a month. A seat is
                someone who edits; people who read or comment never need one.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Working figures while billing is built. Nothing is charged
                today.
              </p>
            </div>

            <div className="relative">
              <RegMark className="-left-3 -top-3" />
              <RegMark className="-right-3 -top-3" />
              <RegMark className="-bottom-3 -left-3" />
              <RegMark className="-bottom-3 -right-3" />
              <div
                style={{ clipPath: NOTCH }}
                className="border border-[var(--indigo)] bg-card p-6 shadow-md sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="seats" className="text-sm font-medium">
                    People who edit
                  </label>
                  <div className="flex items-center gap-2">
                    <Stepper
                      label="Fewer seats"
                      onClick={() => setSeats((s) => Math.max(1, s - 1))}
                      disabled={seats <= 1}
                    >
                      –
                    </Stepper>
                    <span
                      style={{ fontFamily: SERIF }}
                      className="w-10 text-center text-2xl tabular-nums"
                    >
                      {seats}
                    </span>
                    <Stepper
                      label="More seats"
                      onClick={() =>
                        setSeats((s) => Math.min(MAX_SEATS, s + 1))
                      }
                      disabled={seats >= MAX_SEATS}
                    >
                      +
                    </Stepper>
                  </div>
                </div>
                <input
                  id="seats"
                  type="range"
                  min={1}
                  max={MAX_SEATS}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="mt-5 w-full accent-[var(--indigo)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>{INCLUDED_SEATS} included</span>
                  <span>{MAX_SEATS}</span>
                </div>

                <dl className="mt-6 divide-y divide-border text-sm">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">
                      Team, {INCLUDED_SEATS} seats included
                    </dt>
                    <dd className="tabular-nums">${BASE_PRICE}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">
                      {extra === 0
                        ? "No extra seats"
                        : `${extra} extra ${extra === 1 ? "seat" : "seats"} × $${EXTRA_SEAT}`}
                    </dt>
                    <dd className="tabular-nums">${extra * EXTRA_SEAT}</dd>
                  </div>
                  <div className="flex items-baseline justify-between py-3">
                    <dt className="font-medium">Per month</dt>
                    <dd
                      style={{ fontFamily: SERIF }}
                      className="text-4xl tabular-nums tracking-tight"
                      aria-live="polite"
                    >
                      ${total}
                    </dd>
                  </div>
                </dl>
                {seats > INCLUDED_SEATS && (
                  <p className="text-xs text-muted-foreground">
                    About ${(total / seats).toFixed(2)} per editor.
                  </p>
                )}
                {seats <= 2 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Two people can edit on Free. Team is worth it for projects,
                    unlimited docs and comment-only links.
                  </p>
                )}
                <button
                  type="button"
                  onClick={create}
                  disabled={loading}
                  style={{ clipPath: NOTCH }}
                  className="mt-6 h-11 w-full bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {loading ? "Opening…" : "Start a spec"}
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Start on Free today. Move to Team when billing opens.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CutEdge />

        {/* 3. What Team adds over Free */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          <h2
            style={{ fontFamily: SERIF }}
            className="max-w-[24ch] text-3xl leading-tight sm:text-4xl"
          >
            What Team adds
          </h2>
          <p className="mt-4 max-w-[52ch] text-muted-foreground">
            Everything Free does, plus the things a group needs once the
            spec is more than one doc and two people.
          </p>
          <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {TEAM_ADDS.map((t, i) => (
              <li key={t.title} className="flex gap-4">
                <span
                  style={{ fontFamily: SERIF, clipPath: NOTCH }}
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[var(--indigo)] text-sm text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    {t.free}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Enterprise, a quiet indigo band */}
        <section className="relative bg-[var(--indigo)] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-white opacity-[0.16]"
            style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[6fr_5fr] md:items-center md:px-10">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Enterprise
              </p>
              <h2
                style={{ fontFamily: SERIF }}
                className="mt-3 max-w-[26ch] text-2xl leading-snug sm:text-3xl"
              >
                For organisations with sign-on, retention and uptime
                requirements
              </h2>
              <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-white/80">
                Everything in Team, plus single sign-on, domain restrictions on
                share links, retention policies for history, custom seat
                agreements, a named support contact and an uptime SLA.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <button
                type="button"
                style={{ clipPath: NOTCH }}
                className="h-11 bg-white px-6 text-sm font-medium text-[var(--indigo)] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Contact us
              </button>
              <span className="text-xs text-white/70">
                Priced per agreement.
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground md:px-10">
        <span className="flex items-center gap-2">
          <StencilMark small />
          <span style={{ fontFamily: SERIF }}>Katagami</span>
        </span>
        <span>型紙 — a stencil the whole team fills in</span>
      </footer>
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Line({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-6 py-2.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </li>
  );
}

function Stepper({
  children,
  label,
  onClick,
  disabled,
}: {
  children: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{ clipPath: NOTCH }}
      className="group size-8 bg-[var(--indigo)] p-px text-lg leading-none text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 dark:bg-blue-300 dark:text-blue-300"
    >
      <span
        style={{ clipPath: NOTCH_IN }}
        className="flex h-full w-full items-center justify-center bg-card group-hover:bg-[var(--indigo-soft)]"
      >
        {children}
      </span>
    </button>
  );
}

function CutEdge() {
  return (
    <div
      aria-hidden
      className="h-3 w-full text-[var(--indigo)] opacity-30 dark:text-blue-300"
      style={{
        backgroundImage: SEIGAIHA,
        backgroundSize: "40px 20px",
        backgroundPosition: "center bottom",
      }}
    />
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

function StencilMark({ small }: { small?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={small ? "size-3.5" : "size-5"}
      fill="none"
      stroke="var(--indigo)"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
