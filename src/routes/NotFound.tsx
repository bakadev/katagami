import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";
import { ASANOHA } from "~/components/site/patterns";
import { RegMark } from "~/components/site/RegMark";

/**
 * 404: a stencil with nothing cut.
 *
 * One notched sheet with registration marks. The interior is an asanoha
 * field with a blank rectangle in the middle, the part of the paper nobody
 * has cut yet. The header and footer are the same as the marketing pages,
 * so the page is never a dead end.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

export default function NotFound() {
  usePageMeta({
    title: "Page not found",
    description:
      "Nothing is cut here yet. The link may be wrong, or the document may have been deleted.",
  });
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
      }}
    >
      <SiteHeader />

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

      <SiteFooter />
    </div>
  );
}
