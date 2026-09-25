import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import {
  DOCS,
  PROJECTS,
  STATUS_LABEL,
  filterDocs,
  personById,
  relative,
  sortDocs,
  type Doc,
  type DocStatus,
  type SortKey,
} from "./data";
import {
  AppHeader,
  ClaimBanner,
  Editor,
  EmptyState,
  NewSpecButton,
  ProjectName,
  RowMenu,
  SERIF,
  SearchField,
  ShareButton,
  SortMenu,
  WorkspaceSwitcher,
  useEmptyState,
} from "./pieces";

/**
 * Signed-in home, option B: the team lead.
 *
 * Several projects, a dozen documents. Grouped by project with collapsible
 * serif headers; single-document projects sit flat in a trailing "Other
 * documents" run. Workspace switcher on the right, a status chip per row,
 * a sort menu. Denser rows. Reads like a table of contents.
 */

const STATUS_TONE: Record<DocStatus, string> = {
  draft: "text-muted-foreground",
  review: "text-brand-ink",
  signed: "text-foreground",
};

export default function DocumentsB() {
  usePageMeta({ title: "Your documents", description: "What Acme is working on." });
  const [empty, toggleEmpty] = useEmptyState();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const docs = empty ? [] : sortDocs(filterDocs(DOCS, q), sort);

  /* Projects with 2+ docs become groups ordered by their freshest doc;
     the rest go in one flat run at the end. */
  const { groups, flat } = useMemo(() => {
    const byProject = new Map<string, Doc[]>();
    for (const d of docs) byProject.set(d.projectId, [...(byProject.get(d.projectId) ?? []), d]);
    const groups: { id: string; name: string; docs: Doc[] }[] = [];
    const flat: Doc[] = [];
    for (const p of PROJECTS) {
      const list = byProject.get(p.id) ?? [];
      if (list.length >= 2) groups.push({ id: p.id, name: p.name, docs: list });
      else flat.push(...list);
    }
    groups.sort((a, b) =>
      sort === "title"
        ? a.name.localeCompare(b.name)
        : a.docs[0]!.editedMinutesAgo - b.docs[0]!.editedMinutesAgo,
    );
    return { groups, flat: sortDocs(flat, sort) };
  }, [docs, sort]);

  const toggleGroup = (id: string) =>
    setClosed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ExplorationBar round="documents" current="documents-b" />
      <AppHeader empty={empty} onToggleEmpty={toggleEmpty} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
              Your documents
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <WorkspaceSwitcher />
              <NewSpecButton />
            </div>
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
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchField value={q} onChange={setQ} className="sm:w-72" />
                <div className="flex items-center gap-3">
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {docs.length} documents in {groups.length + flat.length} projects
                  </p>
                  <SortMenu value={sort} onChange={setSort} />
                </div>
              </div>

              {docs.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Nothing titled “{q}”.
                </p>
              ) : (
                <div className="mt-6">
                  {/* Column heads: desktop only. */}
                  <div className="hidden grid-cols-[1fr_120px_140px_170px_72px] gap-4 border-b border-border px-3 pb-2 text-[11px] uppercase tracking-wide text-muted-foreground md:grid">
                    <span>Document</span>
                    <span>Status</span>
                    <span>Last edited</span>
                    <span>By</span>
                    <span className="sr-only">Actions</span>
                  </div>

                  {groups.map((g) => {
                    const open = !closed.has(g.id);
                    return (
                      <section key={g.id} aria-labelledby={`grp-${g.id}`}>
                        <div className="flex items-center gap-2 border-b border-border py-3 pl-1 pr-3">
                          <button
                            type="button"
                            onClick={() => toggleGroup(g.id)}
                            aria-expanded={open}
                            aria-controls={`grp-${g.id}-rows`}
                            className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronRight
                              className={"size-4 transition-transform " + (open ? "rotate-90" : "")}
                              aria-hidden
                            />
                          </button>
                          <h2 id={`grp-${g.id}`} className="flex items-center gap-2">
                            <ProjectName>{g.name}</ProjectName>
                          </h2>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {g.docs.length} documents
                          </span>
                          {!open && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              edited {relative(g.docs[0]!.editedMinutesAgo)}
                            </span>
                          )}
                        </div>
                        {open && (
                          <ul id={`grp-${g.id}-rows`} className="divide-y divide-border">
                            {g.docs.map((d) => (
                              <Row key={d.id} doc={d} />
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}

                  {flat.length > 0 && (
                    <section aria-labelledby="grp-other">
                      <div className="flex items-center gap-2 border-b border-border py-3 pl-1 pr-3">
                        <span className="size-6" aria-hidden />
                        <h2
                          id="grp-other"
                          style={{ fontFamily: SERIF }}
                          className="whitespace-nowrap text-lg text-muted-foreground"
                        >
                          {groups.length > 0 ? "Other documents" : "Documents"}
                        </h2>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {flat.length} single-document projects
                        </span>
                      </div>
                      <ul className="divide-y divide-border">
                        {flat.map((d) => (
                          <Row key={d.id} doc={d} />
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
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

function StatusChip({ status }: { status: DocStatus }) {
  return (
    <NotchCard
      as="span"
      size="sm"
      tone={status === "review" ? "indigo" : "gray"}
      fill={status === "signed" ? "tint" : "card"}
      outerClassName="inline-flex"
      className={"px-2 py-0.5 text-[11px] leading-4 " + STATUS_TONE[status]}
    >
      {STATUS_LABEL[status]}
    </NotchCard>
  );
}

function Row({ doc }: { doc: Doc }) {
  const by = personById(doc.editedBy);
  return (
    <li className="group grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 hover:bg-muted/40 md:grid-cols-[1fr_120px_140px_170px_72px] md:gap-4">
      <div className="min-w-0">
        <Link to="/" className="block truncate text-sm font-medium hover:text-brand-ink">
          {doc.title}
        </Link>
        {/* Phone: status and time folded under the title. */}
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground md:hidden">
          <span>{relative(doc.editedMinutesAgo)}</span>
          <span aria-hidden>·</span>
          <span className={STATUS_TONE[doc.status]}>{STATUS_LABEL[doc.status]}</span>
        </p>
      </div>
      <div className="hidden md:block">
        <StatusChip status={doc.status} />
      </div>
      <span className="hidden text-sm text-muted-foreground md:block">
        {relative(doc.editedMinutesAgo)}
      </span>
      <Editor person={by} className="hidden truncate text-sm text-muted-foreground md:inline-flex" />
      <div className="flex items-center justify-end gap-0.5">
        <span className="hidden md:inline-flex">
          <ShareButton title={doc.title} />
        </span>
        <RowMenu title={doc.title} currentProjectId={doc.projectId} />
      </div>
    </li>
  );
}
