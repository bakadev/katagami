import { useState } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { ASANOHA } from "~/components/site/patterns";
import {
  SOLO_DOCS,
  filterDocs,
  personById,
  relative,
  sortDocs,
  type SortKey,
} from "./data";
import {
  AppHeader,
  ClaimBanner,
  Editor,
  EmptyState,
  NewSpecButton,
  RowMenu,
  SERIF,
  SearchField,
  ShareButton,
  useEmptyState,
} from "./pieces";

/**
 * Signed-in home, option A: the solo writer.
 *
 * A Free user with a handful of specs. One flat list on a wide, quiet page:
 * serif titles, hairlines between rows, search and sort as plain text on the
 * right, no workspace switcher, no status. The empty state takes the whole
 * sheet. Feels like a desk with a few pages on it.
 */

export default function DocumentsA() {
  usePageMeta({ title: "Your documents", description: "What you're working on." });
  const [empty, toggleEmpty] = useEmptyState();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");

  const docs = empty ? [] : sortDocs(filterDocs(SOLO_DOCS, q), sort);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ExplorationBar round="documents" current="documents-a" />
      <AppHeader empty={empty} onToggleEmpty={toggleEmpty} />

      <main className="relative flex-1">
        {/* A faint asanoha at the top edge, fading out fast: the sheet's head. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 text-brand-ink opacity-[0.07] dark:opacity-[0.16]"
          style={{
            backgroundImage: ASANOHA,
            backgroundSize: "56px 97px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-10 sm:pt-16">
          {/* Header row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Signed in as Priya Raman</p>
              <h1 style={{ fontFamily: SERIF }} className="mt-1 text-4xl leading-tight sm:text-5xl">
                Your documents
              </h1>
            </div>
            <NewSpecButton className="self-start sm:self-auto" />
          </div>

          <div className="mt-8">
            <ClaimBanner />
          </div>

          {empty ? (
            <div className="mt-10">
              <EmptyState prominent />
            </div>
          ) : (
            <>
              {/* Tools: quiet, one line. */}
              <div className="mt-12 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchField value={q} onChange={setQ} className="sm:w-64" />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Sort by</span>
                  {(["edited", "title"] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSort(k)}
                      aria-pressed={sort === k}
                      className={
                        "px-1.5 py-0.5 underline-offset-4 hover:text-foreground " +
                        (sort === k ? "text-foreground underline" : "")
                      }
                    >
                      {k === "edited" ? "last edited" : "title"}
                    </button>
                  ))}
                </p>
              </div>

              {docs.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Nothing titled “{q}”.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {docs.map((d) => {
                    const by = personById(d.editedBy);
                    return (
                      <li key={d.id} className="group flex items-center gap-4 py-5">
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/"
                            style={{ fontFamily: SERIF }}
                            className="block truncate text-xl leading-snug hover:text-brand-ink"
                          >
                            {d.title}
                          </Link>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>Edited {relative(d.editedMinutesAgo)}</span>
                            <Editor person={by} className="hidden sm:inline-flex" />
                          </p>
                        </div>
                        <div className="hidden items-center gap-1 sm:flex">
                          <ShareButton title={d.title} />
                          <RowMenu title={d.title} currentProjectId={d.projectId} />
                        </div>
                        <div className="sm:hidden">
                          <RowMenu title={d.title} currentProjectId={d.projectId} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-10 text-xs text-muted-foreground">
                {docs.length} document{docs.length === 1 ? "" : "s"}. Free keeps every one of
                them; projects and seats come with{" "}
                <Link to="/pricing" className="underline underline-offset-4">
                  Team
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
