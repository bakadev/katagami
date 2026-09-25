import type { ReactNode } from "react";
/** Pricing option D: composite of A (hero, FAQ layout), B (short answers), C (calculator, what Team adds, Enterprise band). */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";
import { ASANOHA, KOMON, SEIGAIHA } from "~/components/site/patterns";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMark } from "~/components/site/RegMark";

/**
 * Pricing exploration, option A: "Three stencil sheets".
 *
 * The classic three-column layout. Free, Team and Enterprise are three
 * cut-paper sheets side by side; Team is lifted and given the indigo header
 * so the eye lands on it first. Each sheet lists what it includes, then a
 * short FAQ closes the page. Content is the decided column set from
 * docs/design-explorations/two-tier-proposal.md section 5.
 *
 * Style is Product v2 (src/routes/Home.tsx): serif display, aizome indigo,
 * stencil tiles as ground, notched corners, registration marks, cut edges.
 * Stencil tiles and marks come from src/components/site.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

/* ---- content ------------------------------------------------------------ */

const BASE_PRICE = 39;
const INCLUDED_SEATS = 5;
const EXTRA_SEAT = 8;
const MAX_SEATS = 40;

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

const FAQ: { q: string; a: string }[] = [
  {
    q: "What counts as an editor on Free?",
    a: "Anyone with the edit link and the document open. Free allows two at once. A third arrival gets view-only until someone closes the tab.",
  },
  {
    q: "What happens on the 11th doc?",
    a: "Free stops at 10 single docs. The ten you have keep working; delete one to make room, or move to Team for unlimited docs and projects.",
  },
  {
    q: "Can I export?",
    a: "On every plan. Free exports Markdown; Team and Enterprise add PDF. What you download is exactly what you wrote.",
  },
  {
    q: "Do viewers cost anything?",
    a: "No. Seats are for editors. Viewers and commenters read without a seat and without an account.",
  },
  {
    q: "What is in Enterprise?",
    a: "Team plus single sign-on, domain-restricted links, retention policies, custom seat agreements, a named support contact and an uptime SLA.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  usePageMeta({
    title: "Pricing",
    description:
      "Free to start. One price for the team. Free for one or two people and up to ten docs; Team is $39 a month with five seats.",
  });
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
      <SiteHeader />

      <main>
        {/* Title on a fading asanoha ground, same as the homepage hero */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-10 text-center md:px-10 md:pt-16">
            <h1
              style={{ fontFamily: SERIF }}
              className="mx-auto max-w-[20ch] text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              Free to start. One price for the team.
            </h1>
            <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              Write your first spec without an account. When the whole team
              needs to be in it, Team is $39 a month with five seats, and $8
              for each seat after that.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                Couldn't create the doc: {error}
              </p>
            )}
          </div>

          {/* Three sheets */}
          <div className="relative mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3 md:px-10">
            <Sheet
              name="Free"
              price="$0"
              meta="No account needed"
              blurb="For one doc, or a handful, with a couple of people in it."
              cta={
                <SheetButton onClick={create} disabled={loading} secondary>
                  {loading ? "Opening…" : "Start a spec"}
                </SheetButton>
              }
              items={[
                "Up to 10 single docs",
                "2 people editing at once",
                "Edit and view links",
                "20 auto-snapshots, 3 named versions",
                "Markdown export",
                "Community support",
              ]}
            />
            <Sheet
              name="Team"
              price="$39"
              unit="/ month"
              meta="5 seats included, then $8 per seat / month"
              blurb="For a product, design or content team that lives in specs."
              featured
              cta={
                <SheetButton onClick={create} disabled={loading}>
                  {loading ? "Opening…" : "Start a spec"}
                </SheetButton>
              }
              lead="Everything in Free, plus"
              items={[
                "Unlimited docs and projects",
                "5 seats included, add more as you grow",
                "Comment-only and login-required links",
                "Unlimited named versions",
                "Markdown and PDF export",
                "Images in documents",
                "AI text operations, when they ship",
                "Email support",
              ]}
            />
            <Sheet
              name="Enterprise"
              price="Contact us"
              priceSmall
              meta="Custom seat agreements"
              blurb="For organisations that need sign-on, retention and an SLA."
              cta={
                <SheetButton secondary onClick={() => navigate("/contact")}>
                  Contact us
                </SheetButton>
              }
              lead="Everything in Team, plus"
              items={[
                "Single sign-on",
                "Domain restrictions on links",
                "Retention policies for history",
                "Named support contact",
                "Uptime SLA",
              ]}
            />
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
              <h2
                style={{ fontFamily: SERIF }}
                className="max-w-[20ch] text-3xl leading-tight sm:text-4xl"
              >
                What would Team cost your team?
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
              <NotchCard tone="indigo" shadow className="p-6 sm:p-8">
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
              </NotchCard>
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

        <CutEdge />

        {/* FAQ */}
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_2fr] md:px-10">
          <div>
            <h2
              style={{ fontFamily: SERIF }}
              className="text-3xl leading-tight sm:text-4xl"
            >
              Questions people ask before they pick
            </h2>
            <p className="mt-4 max-w-[36ch] text-muted-foreground">
              Short answers. If yours is not here, start a spec and find
              out; Free has no account and no card.
            </p>
          </div>
          <dl className="divide-y divide-border">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-2 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
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
              <Link
                to="/contact"
                style={{ clipPath: NOTCH }}
                className="inline-flex h-11 items-center bg-white px-6 text-sm font-medium text-[var(--indigo)] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Contact us
              </Link>
              <span className="text-xs text-white/70">
                Priced per agreement.
              </span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

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

function Sheet({
  name,
  price,
  unit,
  priceSmall,
  meta,
  blurb,
  cta,
  lead,
  items,
  featured,
}: {
  name: string;
  price: string;
  unit?: string;
  priceSmall?: boolean;
  meta: string;
  blurb: string;
  cta: ReactNode;
  lead?: string;
  items: string[];
  featured?: boolean;
}) {
  return (
    <div className={"relative " + (featured ? "md:-mt-6" : "")}>
      {featured && (
        <>
          <RegMark className="-left-3 -top-3" />
          <RegMark className="-right-3 -top-3" />
          <RegMark className="-bottom-3 -left-3" />
          <RegMark className="-bottom-3 -right-3" />
        </>
      )}
      <NotchCard
        tone={featured ? "indigo" : "gray"}
        shadow
        outerClassName="h-full"
        className="flex flex-col"
      >
        {featured ? (
          <div className="flex items-center justify-between bg-[var(--indigo)] px-6 py-2 text-xs text-white">
            <span>Recommended</span>
            <span className="text-white/70">most teams start here</span>
          </div>
        ) : (
          <div className="h-8" aria-hidden />
        )}
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h2 style={{ fontFamily: SERIF }} className="text-2xl">
            {name}
          </h2>
          <p className="mt-4 flex items-baseline gap-1.5">
            <span
              style={{ fontFamily: SERIF }}
              className={priceSmall ? "text-3xl" : "text-5xl tracking-tight"}
            >
              {price}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {blurb}
          </p>
          <div className="mt-6">{cta}</div>
          {lead && (
            <p className="mt-7 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {lead}
            </p>
          )}
          <ul className={"space-y-2.5 text-sm " + (lead ? "mt-3" : "mt-7")}>
            {items.map((it) => (
              <li key={it} className="flex gap-2.5">
                <Tick />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </NotchCard>
    </div>
  );
}

function SheetButton({
  children,
  onClick,
  disabled,
  secondary,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  if (secondary) {
    // Outlined notch: an indigo outer face with a card-coloured inner face,
    // because a CSS border gets cut off by the clip-path at the notches.
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ clipPath: NOTCH }}
        className="group h-11 w-full bg-[var(--indigo)] p-px text-sm font-medium text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:bg-blue-300 dark:text-blue-300"
      >
        <span
          style={{ clipPath: NOTCH_IN }}
          className="flex h-full w-full items-center justify-center bg-card px-6 group-hover:bg-[var(--indigo-soft)]"
        >
          {children}
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ clipPath: NOTCH }}
      className="h-11 w-full bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="mt-1 size-3.5 shrink-0 text-[var(--indigo)] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
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

