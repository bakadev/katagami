import type { ReactNode } from "react";
import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { ExplorationBar } from "../DesignIndex";

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
 * Helpers are copied, not shared; the page is throwaway.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

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

const FAQ: { q: string; a: string }[] = [
  {
    q: "What counts as an editor on Free?",
    a: "Anyone with the document open and the edit link is an editor while they have it open. Free allows two at a time. A third person who arrives sees the doc in view-only until someone leaves. Closing the tab frees the seat.",
  },
  {
    q: "What happens when I create an 11th doc?",
    a: "Free stops at 10 single documents. You can keep editing, sharing and exporting the ones you have, and you can delete one to make room. Team removes the limit and adds projects that hold many docs each.",
  },
  {
    q: "Can I export my documents?",
    a: "Yes, on every plan. Free exports Markdown. Team and Enterprise export Markdown and PDF. The file you download is the file you wrote; nothing is locked inside the app.",
  },
  {
    q: "Do viewers cost anything?",
    a: "No. Seats are for people who edit. Anyone with a view link, or a comment-only link on Team, reads the doc without taking a seat and without an account.",
  },
  {
    q: "What is in Enterprise?",
    a: "Everything in Team, plus single sign-on, domain restrictions on share links, retention policies for history, custom seat agreements, a named support contact and an uptime SLA. Pricing depends on the agreement, so it starts with a conversation.",
  },
];

export default function PricingA() {
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <ExplorationBar round="pricing" current="a" />

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
              cta={<SheetButton secondary>Contact us</SheetButton>}
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

        {/* One-line clarifications on a komon ground */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3 md:px-10">
            <Note
              title="Seats are for editors"
              body="People who only read or comment never take a seat, on any plan."
            />
            <Note
              title="Your files stay yours"
              body="Every plan exports plain Markdown. Move it to a repo, a wiki or another tool whenever you like."
            />
            <Note
              title="Prices are placeholders"
              body="Team pricing is a working figure while billing is built. Nothing is charged today."
            />
          </div>
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
              If yours is not here, start a spec and find out. Free has no
              account and no card.
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

        {/* Indigo close */}
        <section className="relative bg-[var(--indigo)] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-white opacity-[0.16]"
            style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
            <p
              style={{ fontFamily: SERIF }}
              className="max-w-[28ch] text-2xl leading-snug sm:text-3xl"
            >
              The first doc is free and takes one click.
            </p>
            <button
              type="button"
              onClick={create}
              disabled={loading}
              style={{ clipPath: NOTCH }}
              className="h-11 shrink-0 bg-white px-6 text-sm font-medium text-[var(--indigo)] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
            >
              Start a spec
            </button>
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
      <div
        style={{ clipPath: NOTCH }}
        className={
          "flex h-full flex-col border bg-card " +
          (featured
            ? "border-[var(--indigo)] shadow-md"
            : "border-border shadow-sm")
        }
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
      </div>
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

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-[var(--indigo)] pl-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
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
