import { useState } from "react";
import { Link } from "react-router";
import { SiteFooter } from "~/components/site/SiteFooter";
import { usePageMeta } from "~/hooks/usePageMeta";

/**
 * Claim a project, option B: a page.
 *
 * Left column explains, with the mark, what claiming means and what it
 * doesn't change. Right column is the list of documents found in this
 * browser as a notched table with checkboxes, all checked by default, so
 * the person can leave one behind. The primary button counts what's
 * selected. On a komon band like the Contact form.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const WORKSPACE = "Acme";

const FOUND = [
  { id: "a", title: "Checkout redesign · PRD", edited: "Today, 4:12 PM", people: "3 people" },
  { id: "b", title: "Onboarding email sequence", edited: "Tue, 11:30 AM", people: "2 people" },
  { id: "c", title: "Pricing page copy, draft 2", edited: "Sep 18", people: "Just you" },
];

export default function Claim() {
  usePageMeta({
    title: "Claim your documents",
    description: "Move documents from this browser into your workspace.",
  });
  const [picked, setPicked] = useState<Set<string>>(new Set(FOUND.map((d) => d.id)));
  const all = picked.size === FOUND.length;
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      <main className="relative flex-1">
        <div
          aria-hidden
          className="komon pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[5fr_7fr] md:items-start md:px-10 md:py-24">
          {/* Explanation */}
          <div>
            <StencilMark />
            <p className="mt-4 text-xs text-muted-foreground">Found in this browser</p>
            <h1 style={{ fontFamily: SERIF }} className="mt-2 text-3xl leading-tight sm:text-4xl">
              Bring your documents into {WORKSPACE}
            </h1>
            <p className="mt-5 max-w-[46ch] leading-relaxed text-muted-foreground">
              You wrote these before you had an account. This browser still holds the
              creator key for each one, which is how we know they're yours. Moving them
              in gives them the same seats and named history as the rest of the workspace.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Share links keep working. Everyone who has one opens the document at the same address.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Comments and history come along unchanged.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Leave one unchecked and it stays a Free document you can claim later from this browser.
              </li>
            </ul>
          </div>

          {/* The table */}
          <div className="relative">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <div
              style={{ clipPath: NOTCH }}
              className="border border-[var(--indigo)] bg-card shadow-md dark:border-blue-300/60"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all documents"
                        checked={all}
                        onChange={() =>
                          setPicked(all ? new Set() : new Set(FOUND.map((d) => d.id)))
                        }
                        className="size-4 accent-[var(--indigo)]"
                      />
                    </th>
                    <th scope="col" className="py-3 pr-4 font-normal">
                      Document
                    </th>
                    <th scope="col" className="hidden py-3 pr-4 font-normal sm:table-cell">
                      Editing
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-normal">
                      Last edited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {FOUND.map((d) => {
                    const on = picked.has(d.id);
                    return (
                      <tr key={d.id} className={on ? "" : "text-muted-foreground"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            id={`claim-${d.id}`}
                            checked={on}
                            onChange={() => toggle(d.id)}
                            className="size-4 accent-[var(--indigo)]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <label htmlFor={`claim-${d.id}`} className="block cursor-pointer">
                            {d.title}
                          </label>
                        </td>
                        <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                          {d.people}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-xs text-muted-foreground">
                          {d.edited}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-5">
                <p className="text-xs text-muted-foreground">
                  {picked.size} of {FOUND.length} selected
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/"
                    style={{ clipPath: NOTCH }}
                    className="group inline-block bg-border p-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      style={{ clipPath: NOTCH_IN }}
                      className="flex h-[42px] items-center bg-card px-5 text-sm font-medium group-hover:bg-muted/60"
                    >
                      Not now
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={picked.size === 0}
                    style={{ clipPath: NOTCH }}
                    className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  >
                    Move {picked.size === FOUND.length ? "these" : picked.size} into {WORKSPACE}
                  </button>
                </div>
              </div>
            </div>
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

function StencilMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-6 text-[var(--indigo)] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
