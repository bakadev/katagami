import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import {
  D_DOCS,
  D_FREE_DOCS,
  D_HOME,
  D_PROJECTS,
  D_PROJECT_PAGE,
  ME,
  NO_PROJECT,
  filterDocs,
  sortDocs,
  type Doc,
  type Project,
  type SortKey,
} from "./data";
import {
  AppHeader,
  ClaimBanner,
  EmptyState,
  NewSpecButton,
  PlanToggle,
  SERIF,
  useEmptyState,
  usePlan,
} from "./pieces";
import { DashedNotch, DocTable, OutlinedButton, ProjectCard, type RowActions } from "./dPieces";

/**
 * Signed-in home, option D: the composite the owner specified after A, B, C.
 *
 * B's header and claim strip; C's card tiles, but for projects; A's text
 * sort; C's flat table for the documents that are in no project. No status,
 * no "Waiting on you", no switcher: the container is the team and there is
 * one. Moving and deleting animate the row out and update the cards, all in
 * local state. `?plan=free` shows the same layout with projects locked.
 */

type Pending = { kind: "move"; projectId: string } | { kind: "delete" };

export default function DocumentsD() {
  usePageMeta({ title: "Your documents", description: "What Acme is working on." });
  const [empty, toggleEmpty] = useEmptyState();
  const [plan, togglePlan] = usePlan();
  const free = plan === "free";

  /* The dataset follows the reviewer switches; local edits reset with them. */
  const key = `${plan}:${empty}`;
  return <Home key={key} empty={empty} toggleEmpty={toggleEmpty} free={free} togglePlan={togglePlan} />;
}

function Home({
  empty,
  toggleEmpty,
  free,
  togglePlan,
}: {
  empty: boolean;
  toggleEmpty: () => void;
  free: boolean;
  togglePlan: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>(empty || free ? [] : D_PROJECTS);
  const [docs, setDocs] = useState<Doc[]>(empty ? [] : free ? D_FREE_DOCS : D_DOCS);
  const [banner, setBanner] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");

  /* Row lifecycle: a pending action animates the row out, then commits. */
  const [pending, setPending] = useState<Map<string, Pending>>(new Map());
  const [confirmingDoc, setConfirmingDoc] = useState<string | null>(null);

  /* Project lifecycle. */
  const [confirmingProject, setConfirmingProject] = useState<string | null>(null);
  const [leavingProject, setLeavingProject] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  const loose = useMemo(
    () => sortDocs(filterDocs(docs.filter((d) => d.projectId === NO_PROJECT), q), sort),
    [docs, q, sort],
  );
  const byProject = (id: string) => docs.filter((d) => d.projectId === id);

  const setLeaving = (id: string, p: Pending) =>
    setPending((m) => new Map(m).set(id, p));

  const actions: RowActions = {
    projects: free ? undefined : projects,
    onMove: (doc, projectId) => setLeaving(doc.id, { kind: "move", projectId }),
    onDelete: (doc) => setConfirmingDoc(doc.id),
  };

  const onDocGone = (id: string) => {
    const p = pending.get(id);
    if (!p) return;
    setDocs((list) =>
      p.kind === "delete"
        ? list.filter((d) => d.id !== id)
        : list.map((d) =>
            d.id === id
              ? { ...d, projectId: p.projectId, editedMinutesAgo: 0, editedBy: ME.id }
              : d,
          ),
    );
    setPending((m) => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });
  };

  const onProjectGone = (id: string) => {
    setProjects((list) => list.filter((p) => p.id !== id));
    setDocs((list) => list.map((d) => (d.projectId === id ? { ...d, projectId: NO_PROJECT } : d)));
    setLeavingProject(null);
  };

  const newProject = () => {
    const id = `p${Date.now()}`;
    setProjects((list) => [{ id, name: "Untitled project" }, ...list]);
    setRenaming(id);
  };

  const nothingAtAll = docs.length === 0 && projects.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ExplorationBar round="documents" current="documents-d" />
      <AppHeader empty={empty} onToggleEmpty={toggleEmpty} homeTo={D_HOME}>
        <PlanToggle plan={free ? "free" : "team"} onToggle={togglePlan} />
      </AppHeader>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
              Your documents
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <OutlinedButton onClick={newProject} disabled={free} lock={free}>
                New project
              </OutlinedButton>
              <NewSpecButton />
            </div>
          </div>

          {banner && (
            <div className="mt-6">
              <ClaimBanner onDismiss={() => setBanner(false)} />
            </div>
          )}

          {/* Projects */}
          <section className="mt-10" aria-labelledby="projects">
            <div className="flex items-baseline gap-3">
              <h2 id="projects" style={{ fontFamily: SERIF }} className="text-2xl">
                Projects
              </h2>
              {!free && projects.length > 0 && (
                <span className="text-xs text-muted-foreground">{projects.length}</span>
              )}
            </div>

            {free ? (
              <NotchCard className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-muted/40 px-4 py-4 text-sm sm:px-5">
                <p>
                  <span className="font-medium">Projects come with Team.</span>{" "}
                  <span className="text-muted-foreground">
                    Group specs, share seats and keep named history.
                  </span>
                </p>
                <Link to="/pricing" className="text-brand-ink underline underline-offset-4">
                  See Team
                </Link>
              </NotchCard>
            ) : projects.length === 0 ? (
              <DashedNotch className="mt-4">
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
                  <p className="text-muted-foreground">
                    No projects yet. Group related specs under one name.
                  </p>
                  <button
                    type="button"
                    onClick={newProject}
                    className="text-brand-ink underline underline-offset-4 hover:opacity-80"
                  >
                    New project
                  </button>
                </div>
              </DashedNotch>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    docs={byProject(p.id)}
                    to={D_PROJECT_PAGE}
                    leaving={leavingProject === p.id}
                    onGone={() => onProjectGone(p.id)}
                    confirming={confirmingProject === p.id}
                    onAskDelete={() => setConfirmingProject(p.id)}
                    onConfirmDelete={() => {
                      setConfirmingProject(null);
                      setLeavingProject(p.id);
                    }}
                    onKeep={() => setConfirmingProject(null)}
                    onRename={(name) =>
                      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, name } : x)))
                    }
                    renaming={renaming === p.id}
                    onRenamingChange={(v) => setRenaming(v ? p.id : null)}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Documents */}
          <section className="mt-12" aria-labelledby="documents">
            <div className="flex items-baseline gap-3">
              <h2 id="documents" style={{ fontFamily: SERIF }} className="text-2xl">
                Documents
              </h2>
              {loose.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {free ? loose.length : `${loose.length} not in a project`}
                </span>
              )}
            </div>

            {nothingAtAll ? (
              <div className="mt-4">
                <EmptyState />
              </div>
            ) : (
              <div className="mt-4">
                <DocTable
                  docs={loose}
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
                  emptyText="Every document is in a project."
                />
              </div>
            )}
          </section>

          {free && (
            <p className="mt-10 text-xs text-muted-foreground">
              Free keeps every document you make. Projects, seats and named history come with{" "}
              <Link to="/pricing" className="underline underline-offset-4">
                Team
              </Link>
              .
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
