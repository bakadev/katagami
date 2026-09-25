import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, PenLine } from "lucide-react";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMarks } from "~/components/site/RegMark";
import {
  DOCS,
  filterDocs,
  personById,
  projectById,
  relative,
  sortDocs,
  type Doc,
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
  SortMenu,
  useEmptyState,
} from "./pieces";

/**
 * Signed-in home, option C: the reviewer.
 *
 * Someone who mostly opens what others share. Three sections, in the order
 * they'd read them: "Recently opened" as four card tiles, "Waiting on you"
 * as rows with a count of open comments and suggestions addressed to them
 * (yellow anchor accent, the same one the editor uses for comment ranges),
 * then "Everything else" as a flat list. Reads like an inbox.
 */

export default function DocumentsC() {
  usePageMeta({ title: "Your documents", description: "What's waiting on you." });
  const [empty, toggleEmpty] = useEmptyState();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");

  const all = empty ? [] : filterDocs(DOCS, q);
  const recent = [...all]
    .filter((d) => d.openedMinutesAgo !== undefined)
    .sort((a, b) => a.openedMinutesAgo! - b.openedMinutesAgo!)
    .slice(0, 4);
  const waiting = sortDocs(
    all.filter((d) => d.waiting && d.waiting.comments + d.waiting.suggestions > 0),
    "edited",
  );
  const waitingIds = new Set(waiting.map((d) => d.id));
  const rest = sortDocs(
    all.filter((d) => !waitingIds.has(d.id)),
    sort,
  );
  const waitingTotal = waiting.reduce(
    (n, d) => n + (d.waiting?.comments ?? 0) + (d.waiting?.suggestions ?? 0),
    0,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ExplorationBar round="documents" current="documents-c" />
      <AppHeader empty={empty} onToggleEmpty={toggleEmpty} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
                Your documents
              </h1>
              {!empty && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {waitingTotal} things are waiting on you across {waiting.length} documents.
                </p>
              )}
            </div>
            <NewSpecButton className="self-start sm:self-auto" />
          </div>

          <div className="mt-6">
            <ClaimBanner />
          </div>

          {empty ? (
            <div className="mt-8">
              <EmptyState />
            </div>
          ) : (
            <>
              <div className="mt-8">
                <SearchField value={q} onChange={setQ} className="sm:w-72" />
              </div>

              {all.length === 0 && (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Nothing titled “{q}”.
                </p>
              )}

              {/* Recently opened */}
              {recent.length > 0 && (
                <section className="mt-10" aria-labelledby="recent">
                  <SectionHead id="recent" title="Recently opened" note="By you" />
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {recent.map((d) => (
                      <li key={d.id}>
                        <Tile doc={d} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Waiting on you */}
              {waiting.length > 0 && (
                <section className="mt-12" aria-labelledby="waiting">
                  <SectionHead
                    id="waiting"
                    title="Waiting on you"
                    note={`${waitingTotal} open`}
                    accent
                  />
                  <div className="relative mt-4">
                    <RegMarks />
                    <NotchCard tone="indigo">
                      <ul className="divide-y divide-border">
                        {waiting.map((d) => (
                          <WaitingRow key={d.id} doc={d} />
                        ))}
                      </ul>
                    </NotchCard>
                  </div>
                </section>
              )}

              {/* Everything else */}
              {rest.length > 0 && (
                <section className="mt-12" aria-labelledby="rest">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <SectionHead id="rest" title="Everything else" note={`${rest.length} documents`} />
                    <SortMenu value={sort} onChange={setSort} />
                  </div>
                  <ul className="mt-2 divide-y divide-border border-t border-border">
                    {rest.map((d) => (
                      <PlainRow key={d.id} doc={d} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function SectionHead({
  id,
  title,
  note,
  accent = false,
}: {
  id: string;
  title: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 id={id} style={{ fontFamily: SERIF }} className="text-2xl">
        {accent ? <span className="comment-anchor px-1">{title}</span> : title}
      </h2>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </div>
  );
}

/** Card tile with a faint sketch of the document's first lines. */
function Tile({ doc }: { doc: Doc }) {
  const by = personById(doc.editedBy);
  return (
    <NotchCard
      as={Link}
      to="/"
      outerClassName="h-full"
      className="group flex h-full flex-col hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div aria-hidden className="border-b border-border px-3 pb-3 pt-4 sm:px-4">
        <div className="h-2 w-3/4 bg-foreground/15" />
        <div className="mt-2 h-1.5 w-full bg-foreground/8" />
        <div className="mt-1.5 h-1.5 w-11/12 bg-foreground/8" />
        <div className="mt-1.5 h-1.5 w-2/3 bg-foreground/8" />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        <p style={{ fontFamily: SERIF }} className="line-clamp-2 text-sm leading-snug group-hover:text-brand-ink sm:text-base">
          {doc.title}
        </p>
        <p className="mt-auto pt-3 text-xs text-muted-foreground">
          Opened {relative(doc.openedMinutesAgo ?? doc.editedMinutesAgo)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <Editor person={by} />
        </p>
      </div>
    </NotchCard>
  );
}

/** Row in "Waiting on you": counts of comments and suggestions, yellow anchor. */
function WaitingRow({ doc }: { doc: Doc }) {
  const by = personById(doc.editedBy);
  const w = doc.waiting ?? { comments: 0, suggestions: 0 };
  return (
    <li className="group flex items-center gap-4 px-4 py-3 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <Link to="/" className="block truncate text-sm font-medium hover:text-brand-ink">
          {doc.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="truncate">{projectById(doc.projectId).name}</span>
          <span className="hidden sm:inline">
            <Editor person={by} /> · {relative(doc.editedMinutesAgo)}
          </span>
          <span className="sm:hidden">{relative(doc.editedMinutesAgo)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        {w.comments > 0 && (
          <span className="comment-anchor inline-flex items-center gap-1 px-1.5 py-0.5">
            <MessageSquare className="size-3" aria-hidden />
            {w.comments}
            <span className="sr-only"> open comments</span>
          </span>
        )}
        {w.suggestions > 0 && (
          <span className="comment-anchor inline-flex items-center gap-1 px-1.5 py-0.5">
            <PenLine className="size-3" aria-hidden />
            {w.suggestions}
            <span className="sr-only"> open suggestions</span>
          </span>
        )}
      </div>
      <div className="hidden items-center gap-0.5 sm:flex">
        <ShareButton title={doc.title} />
        <RowMenu title={doc.title} currentProjectId={doc.projectId} />
      </div>
    </li>
  );
}

function PlainRow({ doc }: { doc: Doc }) {
  const by = personById(doc.editedBy);
  return (
    <li className="group flex items-center gap-4 py-3 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <Link to="/" className="block truncate text-sm hover:text-brand-ink">
          {doc.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
          {relative(doc.editedMinutesAgo)}
        </p>
      </div>
      <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
        {relative(doc.editedMinutesAgo)}
      </span>
      <Editor person={by} className="hidden w-36 shrink-0 text-xs text-muted-foreground md:inline-flex" />
      <div className="flex items-center gap-0.5">
        <span className="hidden sm:inline-flex">
          <ShareButton title={doc.title} />
        </span>
        <RowMenu title={doc.title} currentProjectId={doc.projectId} />
      </div>
    </li>
  );
}
