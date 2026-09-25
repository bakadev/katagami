import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * 404: a stencil with nothing cut.
 *
 * One notched sheet with registration marks. The interior is an asanoha
 * field with a blank rectangle in the middle, the part of the paper nobody
 * has cut yet. The header and footer are the same as the marketing pages,
 * so the page is never a dead end. Helpers are copied from Pricing.tsx and
 * kept local so this file stays self-contained.
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

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

export default function NotFound() {
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
      }}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
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
          <Link to="/pricing" className="hidden hover:text-foreground sm:inline">
            Pricing
          </Link>
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

      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-16">
          {/* The sheet: a notched card with registration marks at the corners */}
          <div className="relative mx-auto max-w-4xl">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <div
              style={{ clipPath: NOTCH }}
              className="relative overflow-hidden border border-[var(--indigo)] bg-card p-4 shadow-md sm:p-8"
            >
              {/* Asanoha field, the stencil ground */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.32]"
                style={{ backgroundImage: ASANOHA, backgroundSize: "56px 97px" }}
              />

              {/* The uncut area: a blank rectangle in the middle of the field */}
              <section
                aria-labelledby="nf-title"
                className="relative mx-auto max-w-xl bg-card px-5 py-10 text-center sm:px-8 sm:py-14"
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  404, page not found
                </p>
                <h1
                  id="nf-title"
                  style={{ fontFamily: SERIF }}
                  className="mt-4 text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl"
                >
                  Nothing is cut here yet.
                </h1>
                <p className="mx-auto mt-5 max-w-[40ch] leading-relaxed text-muted-foreground">
                  The link may be wrong, or the document may have been deleted.
                </p>

                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <Link
                    to="/"
                    style={{ clipPath: NOTCH }}
                    className="flex h-11 items-center justify-center bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Go to the homepage
                  </Link>
                  <button
                    type="button"
                    onClick={create}
                    disabled={loading}
                    style={{ clipPath: NOTCH }}
                    className="group h-11 bg-[var(--indigo)] p-px text-sm font-medium text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:bg-blue-300 dark:text-blue-300"
                  >
                    <span
                      style={{ clipPath: NOTCH_IN }}
                      className="flex h-full w-full items-center justify-center bg-card px-6 group-hover:bg-[var(--indigo-soft)]"
                    >
                      {loading ? "Opening…" : "Start a spec"}
                    </span>
                  </button>
                  <Link
                    to="/contact"
                    className="py-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:px-2"
                  >
                    Contact us
                  </Link>
                </div>

                {error && (
                  <p role="alert" className="mt-4 text-sm text-destructive">
                    Couldn't create the doc: {error}
                  </p>
                )}
              </section>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-[60ch] text-center text-sm leading-relaxed text-muted-foreground">
            If someone shared a document link with you, ask them to copy it
            again from the document header; links include a key after{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
              ?key=
            </code>
            .
          </p>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground md:px-10">
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
