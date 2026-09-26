import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  D_DOCS,
  D_HOME,
  D_PROJECTS,
  filterDocs,
  sortDocs,
  type Doc,
  type SortKey,
} from "./data";
import { AppHeader, NewSpecButton, useEmptyState } from "./pieces";
import { ConfirmInline, DocTable, InlineName, projectMeta, type RowActions } from "./dPieces";

/**
 * Option D, page 2: one project. The same app header, a breadcrumb back to
 * the home, the project name in serif with an inline rename, a meta line,
 * "New spec" and an overflow with "Delete project", then the same search,
 * sort and table as the Documents section of the home. No accordion.
 */

const PROJECT = D_PROJECTS[0]!;
const OTHER_PROJECTS = D_PROJECTS.filter((p) => p.id !== PROJECT.id);

type Pending = { kind: "move"; projectId: string } | { kind: "delete" };

export default function DocumentsDProject() {
  usePageMeta({ title: PROJECT.name, description: "One project's documents." });
  const [empty, toggleEmpty] = useEmptyState();
  return <ProjectPage key={String(empty)} empty={empty} toggleEmpty={toggleEmpty} />;
}

function ProjectPage({ empty, toggleEmpty }: { empty: boolean; toggleEmpty: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState(PROJECT.name);
  const [renaming, setRenaming] = useState(false);
  const [docs, setDocs] = useState<Doc[]>(
    empty ? [] : D_DOCS.filter((d) => d.projectId === PROJECT.id),
  );
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [pending, setPending] = useState<Map<string, Pending>>(new Map());
  const [confirmingDoc, setConfirmingDoc] = useState<string | null>(null);
  const [confirmingProject, setConfirmingProject] = useState(false);

  const shown = useMemo(() => sortDocs(filterDocs(docs, q), sort), [docs, q, sort]);
  const { count, updated } = projectMeta(docs);

  const setLeaving = (id: string, p: Pending) => setPending((m) => new Map(m).set(id, p));

  const actions: RowActions = {
    projects: OTHER_PROJECTS,
    canRemoveFromProject: true,
    onMove: (doc, projectId) => setLeaving(doc.id, { kind: "move", projectId }),
    onDelete: (doc) => setConfirmingDoc(doc.id),
  };

  /* Moved or deleted, the row is gone from this project either way. */
  const onDocGone = (id: string) => {
    setDocs((list) => list.filter((d) => d.id !== id));
    setPending((m) => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ExplorationBar round="documents" current="documents-d-project" />
      <AppHeader empty={empty} onToggleEmpty={toggleEmpty} homeTo={D_HOME} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to={D_HOME} className="hover:text-foreground">
              Your documents
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="truncate text-foreground" aria-current="page">
              {name}
            </span>
          </nav>

          {/* Header row */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl leading-tight sm:text-4xl">
                <InlineName
                  value={name}
                  onChange={setName}
                  editing={renaming}
                  onEditingChange={setRenaming}
                  className="text-3xl sm:text-4xl"
                  inputClassName="max-w-lg"
                />
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {count}
                {updated && <> · {updated}</>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NewSpecButton />
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="More actions for this project"
                  className="inline-flex size-10 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingProject(true)}>
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {confirmingProject && (
            <NotchCard tone="indigo" className="mt-6 px-4 py-3">
              <ConfirmInline
                question={<>Delete “{name}”?</>}
                note={
                  docs.length > 0
                    ? `Its ${docs.length} document${docs.length === 1 ? "" : "s"} go${docs.length === 1 ? "es" : ""} back to Documents.`
                    : "This can't be undone."
                }
                onConfirm={() => void navigate(D_HOME)}
                onCancel={() => setConfirmingProject(false)}
              />
            </NotchCard>
          )}

          <div className="mt-8">
            <DocTable
              docs={shown}
              q={q}
              onQ={setQ}
              sort={sort}
              onSort={setSort}
              actions={actions}
              leaving={new Set(pending.keys())}
              onGone={onDocGone}
              confirmingId={confirmingDoc}
              onConfirmDelete={(doc) => {
                setConfirmingDoc(null);
                setLeaving(doc.id, { kind: "delete" });
              }}
              onKeep={() => setConfirmingDoc(null)}
              emptyText="Nothing in this project yet."
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
