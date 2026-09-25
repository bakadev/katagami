import type { ReactNode } from "react";
import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { ExplorationBar } from "../DesignIndex";

/**
 * Pricing exploration, option B: "Comparison table".
 *
 * A short hero states the two real prices, then the whole offer is one long
 * table: rows are features, columns are Free / Team / Enterprise. Row groups
 * are separated by seigaiha cut-edge strips rather than heavier headers, the
 * Team column sits on a soft indigo band, and the column heads stay pinned
 * while you scroll. For the reader who wants to see everything before
 * deciding. Content is the decided column set from
 * docs/design-explorations/two-tier-proposal.md section 5.
 *
 * Style is Product v2 (src/routes/Home.tsx). Helpers are copied, not
 * shared; the page is throwaway.
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

/** A cell is a string, or true/false for a plain tick or dash. */
type Cell = string | boolean;

interface Row {
  label: string;
  hint?: string;
  cells: [Cell, Cell, Cell];
}

interface Group {
  title: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    title: "Documents",
    rows: [
      {
        label: "Single documents",
        hint: "A doc that stands on its own, shared by link",
        cells: ["Up to 10", "Unlimited", "Unlimited"],
      },
      {
        label: "Projects",
        hint: "A folder of related docs with one share setting",
        cells: [false, "Unlimited, many docs each", "Unlimited"],
      },
      { label: "Images in documents", cells: [false, true, true] },
      {
        label: "AI text operations",
        hint: "On the roadmap, not yet shipped",
        cells: [false, "When it ships", "When it ships"],
      },
    ],
  },
  {
    title: "People",
    rows: [
      {
        label: "Account",
        cells: ["None needed", "Required", "Required, with SSO"],
      },
      {
        label: "People editing at once",
        hint: "Counted per document, live",
        cells: ["2", "Anyone with a seat", "Anyone with a seat"],
      },
      {
        label: "Seats",
        hint: "Only editors take a seat",
        cells: [
          false,
          "5 included, $8 per extra seat / month",
          "Custom seat agreements",
        ],
      },
      { label: "Viewers and commenters", cells: ["Free", "Free", "Free"] },
    ],
  },
  {
    title: "Sharing",
    rows: [
      { label: "Edit links", cells: [true, true, true] },
      { label: "View links", cells: [true, true, true] },
      { label: "Comment-only links", cells: [false, true, true] },
      { label: "Login-required links", cells: [false, true, true] },
      {
        label: "Domain restrictions",
        hint: "Only people from your email domain can open a link",
        cells: [false, false, true],
      },
    ],
  },
  {
    title: "History",
    rows: [
      { label: "Auto-snapshots", cells: ["Last 20", "Unlimited", "Unlimited"] },
      {
        label: "Named versions",
        hint: "The ones you sign off on",
        cells: ["3", "Unlimited", "Unlimited"],
      },
      { label: "Retention policies", cells: [false, false, true] },
    ],
  },
  {
    title: "Export and support",
    rows: [
      { label: "Markdown export", cells: [true, true, true] },
      { label: "PDF export", cells: [false, true, true] },
      {
        label: "Support",
        cells: ["Community", "Email", "Named contact"],
      },
      { label: "Uptime SLA", cells: [false, false, true] },
    ],
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

export default function PricingB() {
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 8%, transparent)`,
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <ExplorationBar round="pricing" current="b" />

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
        {/* Hero: two real prices, side by side */}
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
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 md:grid-cols-[5fr_6fr] md:items-center md:px-10 md:pt-16">
            <div>
              <h1
                style={{ fontFamily: SERIF }}
                className="text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
              >
                Two prices. Everything on one page.
              </h1>
              <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
                Free is for a doc or ten with a couple of people in it. Team is
                for the whole group. The table below has every limit and every
                feature, so there is nothing to discover later.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  Couldn't create the doc: {error}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceCard
                name="Free"
                price="$0"
                meta="No account. 10 docs, 2 editing at once."
                onClick={create}
                loading={loading}
                secondary
              />
              <PriceCard
                name="Team"
                price="$39"
                unit="/ month"
                meta="5 seats included, $8 per extra seat / month."
                onClick={create}
                loading={loading}
                featured
              />
            </div>
          </div>
        </section>

        <CutEdge />

        {/* The table */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <h2
            style={{ fontFamily: SERIF }}
            className="text-3xl leading-tight sm:text-4xl"
          >
            Compare everything
          </h2>
          <p className="mt-3 max-w-[52ch] text-muted-foreground">
            Rows are features, columns are plans. A tick means it is included
            with no limit worth mentioning.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="sticky top-9 z-10 bg-background/95 backdrop-blur">
                <tr className="text-left align-bottom">
                  <th scope="col" className="w-[34%] pb-4 pr-4 font-normal">
                    <span className="sr-only">Feature</span>
                  </th>
                  <Head
                    name="Free"
                    price="$0"
                    action={
                      <HeadButton onClick={create} disabled={loading} secondary>
                        Start a spec
                      </HeadButton>
                    }
                  />
                  <Head
                    name="Team"
                    price="$39 / mo"
                    meta="5 seats, then $8 / seat"
                    featured
                    action={
                      <HeadButton onClick={create} disabled={loading}>
                        Start a spec
                      </HeadButton>
                    }
                  />
                  <Head
                    name="Enterprise"
                    price="Contact us"
                    action={<HeadButton secondary>Contact us</HeadButton>}
                  />
                </tr>
              </thead>
              {GROUPS.map((g) => (
                <tbody key={g.title}>
                  <tr>
                    <td colSpan={4} className="pt-10 pb-2">
                      <div className="flex items-center gap-4">
                        <h3
                          style={{ fontFamily: SERIF }}
                          className="shrink-0 text-xl"
                        >
                          {g.title}
                        </h3>
                        <CutEdge inline />
                      </div>
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-border">
                      <th
                        scope="row"
                        className="py-3.5 pr-4 text-left font-normal"
                      >
                        <span>{r.label}</span>
                        {r.hint && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {r.hint}
                          </span>
                        )}
                      </th>
                      {r.cells.map((c, i) => (
                        <td
                          key={i}
                          className={
                            "px-4 py-3.5 align-top " +
                            (i === 1
                              ? "bg-[var(--indigo-soft)] dark:bg-blue-300/10"
                              : "")
                          }
                        >
                          <CellValue value={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
              <tbody>
                <tr className="border-t border-border">
                  <td className="pt-6" />
                  <td className="px-4 pt-6">
                    <HeadButton onClick={create} disabled={loading} secondary>
                      Start a spec
                    </HeadButton>
                  </td>
                  <td className="bg-[var(--indigo-soft)] px-4 pb-6 pt-6 dark:bg-blue-300/10">
                    <HeadButton onClick={create} disabled={loading}>
                      Start a spec
                    </HeadButton>
                  </td>
                  <td className="px-4 pt-6">
                    <HeadButton secondary>Contact us</HeadButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Team pricing is a working figure while billing is built. Nothing is
            charged today.
          </p>
        </section>

        <CutEdge />

        {/* FAQ on komon */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10">
            <h2
              style={{ fontFamily: SERIF }}
              className="text-3xl leading-tight sm:text-4xl"
            >
              The short answers
            </h2>
            <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {FAQ.map((f) => (
                <div key={f.q} className="border-l-2 border-[var(--indigo)] pl-4">
                  <dt className="font-medium">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
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
              Seen enough? The first doc is free.
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

function PriceCard({
  name,
  price,
  unit,
  meta,
  onClick,
  loading,
  featured,
  secondary,
}: {
  name: string;
  price: string;
  unit?: string;
  meta: string;
  onClick: () => void;
  loading: boolean;
  featured?: boolean;
  secondary?: boolean;
}) {
  return (
    <div className="relative">
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
          "flex h-full flex-col border bg-card p-6 " +
          (featured ? "border-[var(--indigo)] shadow-md" : "border-border shadow-sm")
        }
      >
        <p className="text-xs text-muted-foreground">
          {featured ? "Recommended" : "Start here"}
        </p>
        <h2 style={{ fontFamily: SERIF }} className="mt-1 text-2xl">
          {name}
        </h2>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span style={{ fontFamily: SERIF }} className="text-4xl tracking-tight">
            {price}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {meta}
        </p>
        {secondary ? (
          <button
            type="button"
            onClick={onClick}
            disabled={loading}
            style={{ clipPath: NOTCH }}
            className="group mt-5 h-10 w-full bg-[var(--indigo)] p-px text-sm font-medium text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:bg-blue-300 dark:text-blue-300"
          >
            <span
              style={{ clipPath: NOTCH_IN }}
              className="flex h-full w-full items-center justify-center bg-card group-hover:bg-[var(--indigo-soft)]"
            >
              {loading ? "Opening…" : "Start a spec"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClick}
            disabled={loading}
            style={{ clipPath: NOTCH }}
            className="mt-5 h-10 w-full bg-[var(--indigo)] text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {loading ? "Opening…" : "Start a spec"}
          </button>
        )}
      </div>
    </div>
  );
}

function Head({
  name,
  price,
  meta,
  featured,
  action,
}: {
  name: string;
  price: string;
  meta?: string;
  featured?: boolean;
  action: ReactNode;
}) {
  return (
    <th
      scope="col"
      className={
        "w-[22%] px-4 pb-4 pt-3 text-left font-normal " +
        (featured
          ? "border-t-2 border-[var(--indigo)] bg-[var(--indigo-soft)] dark:border-blue-300 dark:bg-blue-300/10"
          : "")
      }
    >
      <span style={{ fontFamily: SERIF }} className="block text-xl">
        {name}
      </span>
      <span className="mt-1 block text-sm">{price}</span>
      <span className="mt-0.5 block h-4 text-xs text-muted-foreground">
        {meta}
      </span>
      <span className="mt-3 block">{action}</span>
    </th>
  );
}

function HeadButton({
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
    // Outlined notch: indigo outer face, card-coloured inner face, because a
    // CSS border gets cut off by the clip-path at the notches.
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ clipPath: NOTCH }}
        className="group h-9 w-full bg-[var(--indigo)] p-px text-xs font-medium text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:bg-blue-300 dark:text-blue-300"
      >
        <span
          style={{ clipPath: NOTCH_IN }}
          className="flex h-full w-full items-center justify-center bg-background px-3 group-hover:bg-[var(--indigo-soft)]"
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
      className="h-9 w-full bg-[var(--indigo)] px-3 text-xs font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <svg
        aria-label="Included"
        role="img"
        viewBox="0 0 16 16"
        className="size-4 text-[var(--indigo)] dark:text-blue-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 8.5l3 3 7-7" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <span aria-label="Not included" role="img" className="text-muted-foreground/50">
        –
      </span>
    );
  }
  return <span>{value}</span>;
}

/** Seigaiha strip. Full-width between sections, or inline as a group rule. */
function CutEdge({ inline }: { inline?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "text-[var(--indigo)] opacity-30 dark:text-blue-300 " +
        (inline ? "h-2.5 flex-1" : "h-3 w-full")
      }
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
