import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import type { DocumentRow, HomeResponse, ProjectCard as ProjectCardData } from "../../shared/types";
import { useAuth } from "~/lib/auth/AuthProvider";
import {
  createProject,
  deleteDocument,
  deleteProject,
  getHome,
  moveDocument,
  renameProject,
} from "~/lib/api/auth";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { AppHeader } from "~/components/app/AppHeader";
import { SERIF } from "~/components/app/serif";
import {
  ClaimStrip,
  dismissClaim,
  verifyClaims,
  type VerifiedClaims,
} from "~/components/app/documents/ClaimStrip";
import { DashedNotch } from "~/components/app/documents/DashedNotch";
import { DocumentsTable, type RowActions } from "~/components/app/documents/DocumentsTable";
import { EmptyState } from "~/components/app/documents/EmptyState";
import { LockedProjects } from "~/components/app/documents/LockedProjects";
import { NewSpecButton } from "~/components/app/documents/NewSpecButton";
import { OutlinedButton } from "~/components/app/documents/OutlinedButton";
import { ProjectCard, type ProjectRowHandlers } from "~/components/app/documents/ProjectCard";
import { ProjectTable } from "~/components/app/documents/ProjectTable";
import {
  UNTITLED_PROJECT,
  filterDocs,
  filterProjects,
  projectName,
  sortDocs,
  sortProjects,
  type ProjectSortKey,
  type SortKey,
} from "~/components/app/documents/lib";

/**
 * The signed-in home, /documents. Option D of the Round 7 exploration with
 * live data: the person's projects as cards (a table past six), and the
 * documents in no project as a flat table. Moves and deletes call the API
 * first, then animate the row out; an error leaves the row where it was
 * and says so at the top of its section.
 */

/** Cards shown before the grid gives way to "Show all N projects". */
const CARD_LIMIT = 6;

type Pending = { kind: "move"; projectId: string } | { kind: "delete" };

function message(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : "";
  return /^\d{3}$/.test(m) || !m ? fallback : `${fallback} (${m})`;
}

function SectionError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-destructive">
      {text}
    </p>
  );
}

export default function Documents() {
  usePageMeta({ title: "Your documents", description: "Your specs and projects." });
  const { user, loading } = useAuth();
  if (!loading && !user) return <Navigate to="/signin?next=%2Fdocuments" replace />;
  if (!user) return null;
  return <Home />;
}

function Home() {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getHome();
    setHome(res);
    setProjects(res.projects);
    setDocs(res.documents);
    setLoadError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().catch((e: unknown) => {
      if (!cancelled) setLoadError(message(e, "Couldn't load your documents."));
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  /* A quiet re-sync after a change; a failure here keeps what's on screen. */
  const resync = useCallback(() => {
    void load().catch(() => undefined);
  }, [load]);

  const free = (home?.plan ?? "free") === "free";

  /* Claim strip: creator keys still in this browser that the server confirms
     still open an unclaimed project, until dismissed. Stale keys are dropped
     by the lookup. A failed lookup just shows no strip. */
  const [claim, setClaim] = useState<VerifiedClaims | null>(null);
  useEffect(() => {
    let cancelled = false;
    verifyClaims()
      .then((c) => {
        if (!cancelled) setClaim(c);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const unclaimed = claim?.documentCount ?? 0;
  const showClaim = claim !== null && claim.projects.length > 0 && !claim.dismissed;

  /* Documents: search, sort, row lifecycle. */
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [pending, setPending] = useState<Map<string, Pending>>(new Map());
  const [confirmingDoc, setConfirmingDoc] = useState<string | null>(null);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  /* Projects: lifecycle and the cards-or-table view. */
  const [confirmingProject, setConfirmingProject] = useState<string | null>(null);
  const [busyProject, setBusyProject] = useState<string | null>(null);
  const [leavingProject, setLeavingProject] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [projectView, setProjectView] = useState<"cards" | "table">("cards");
  const [projectQ, setProjectQ] = useState("");
  const [projectSort, setProjectSort] = useState<ProjectSortKey>("updated");
  const [projectPage, setProjectPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const shownDocs = useMemo(() => sortDocs(filterDocs(docs, q), sort), [docs, q, sort]);
  const freshest = useMemo(() => sortProjects(projects, "updated").slice(0, CARD_LIMIT), [projects]);
  const tabled = useMemo(
    () => sortProjects(filterProjects(projects, projectQ), projectSort),
    [projects, projectQ, projectSort],
  );

  const setLeaving = (id: string, p: Pending) => setPending((m) => new Map(m).set(id, p));

  /* ---- documents ---- */

  const onMove = async (doc: DocumentRow, projectId: string | null) => {
    if (!projectId) return;
    setDocsError(null);
    try {
      await moveDocument(doc.id, projectId);
      setLeaving(doc.id, { kind: "move", projectId });
    } catch (e) {
      setDocsError(message(e, "Couldn't move that document."));
    }
  };

  const onConfirmDelete = async (doc: DocumentRow) => {
    setDocsError(null);
    setBusyDoc(doc.id);
    try {
      await deleteDocument(doc.id);
      setConfirmingDoc(null);
      setLeaving(doc.id, { kind: "delete" });
    } catch (e) {
      setDocsError(message(e, "Couldn't delete that document."));
    } finally {
      setBusyDoc(null);
    }
  };

  const onDocGone = (id: string) => {
    const p = pending.get(id);
    if (!p) return;
    const doc = docs.find((d) => d.id === id);
    setDocs((list) => list.filter((d) => d.id !== id));
    if (p.kind === "move" && doc) {
      setProjects((list) =>
        list.map((x) =>
          x.id === p.projectId
            ? {
                ...x,
                documentCount: x.documentCount + 1,
                updatedAt: doc.updatedAt > x.updatedAt || x.documentCount === 0 ? doc.updatedAt : x.updatedAt,
                lastEditedBy:
                  doc.updatedAt > x.updatedAt || x.documentCount === 0 ? doc.lastEditedBy : x.lastEditedBy,
              }
            : x,
        ),
      );
      resync();
    }
    setPending((m) => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });
  };

  const actions: RowActions = {
    projects: free ? undefined : projects,
    onMove: (doc, projectId) => void onMove(doc, projectId),
    onDelete: (doc) => setConfirmingDoc(doc.id),
  };

  /* ---- projects ---- */

  const newProject = async () => {
    if (creating) return;
    setProjectsError(null);
    setCreating(true);
    try {
      const { project } = await createProject(UNTITLED_PROJECT);
      setProjects((list) => [project, ...list]);
      setRenaming(project.id);
      setProjectPage(1);
      setProjectQ("");
    } catch (e) {
      setProjectsError(message(e, "Couldn't create a project."));
    } finally {
      setCreating(false);
    }
  };

  const rename = async (p: ProjectCardData, name: string) => {
    const before = p.name;
    setProjectsError(null);
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, name } : x)));
    try {
      await renameProject(p.id, name);
    } catch (e) {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, name: before } : x)));
      setProjectsError(message(e, `Couldn't rename “${projectName(p)}”.`));
    }
  };

  const confirmDeleteProject = async (p: ProjectCardData) => {
    setProjectsError(null);
    setBusyProject(p.id);
    try {
      await deleteProject(p.id);
      setConfirmingProject(null);
      setLeavingProject(p.id);
    } catch (e) {
      setProjectsError(message(e, `Couldn't delete “${projectName(p)}”.`));
    } finally {
      setBusyProject(null);
    }
  };

  /* Its documents are back in the default project now: fetch them. */
  const onProjectGone = (id: string) => {
    setProjects((list) => list.filter((p) => p.id !== id));
    setLeavingProject(null);
    resync();
  };

  const projectHandlers = (p: ProjectCardData): ProjectRowHandlers => ({
    leaving: leavingProject === p.id,
    onGone: () => onProjectGone(p.id),
    confirming: confirmingProject === p.id,
    busy: busyProject === p.id,
    onAskDelete: () => setConfirmingProject(p.id),
    onConfirmDelete: () => void confirmDeleteProject(p),
    onKeep: () => setConfirmingProject(null),
    onRename: (name) => void rename(p, name),
    renaming: renaming === p.id,
    onRenamingChange: (v) => setRenaming(v ? p.id : null),
  });

  const loaded = home !== null;
  const nothingAtAll = loaded && docs.length === 0 && projects.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          {/* Header row */}
          <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
            Your documents
          </h1>

          {showClaim && (
            <div className="mt-6">
              <ClaimStrip
                count={unclaimed}
                onDismiss={() => {
                  dismissClaim(claim.fingerprint);
                  setClaim((c) => (c ? { ...c, dismissed: true } : c));
                }}
              />
            </div>
          )}

          {loadError && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {loadError}{" "}
              <button
                type="button"
                onClick={() => load().catch((e: unknown) => setLoadError(message(e, "Couldn't load your documents.")))}
                className="underline underline-offset-4"
              >
                Try again
              </button>
            </p>
          )}

          {/* Projects */}
          <section className="mt-10" aria-labelledby="projects">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="flex items-baseline gap-3">
                <h2 id="projects" style={{ fontFamily: SERIF }} className="text-2xl">
                  Projects
                </h2>
                {!free && projects.length > 0 && (
                  <span className="text-xs text-muted-foreground">{projects.length}</span>
                )}
              </div>
              <OutlinedButton
                onClick={() => void newProject()}
                disabled={free || !loaded || creating}
                lock={free}
              >
                New project
              </OutlinedButton>
            </div>
            <SectionError text={projectsError} />

            {!loaded ? (
              <p className="mt-4 py-6 text-sm text-muted-foreground">Loading…</p>
            ) : free ? (
              <LockedProjects />
            ) : projects.length === 0 ? (
              <DashedNotch className="mt-4">
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
                  <p className="text-muted-foreground">
                    No projects yet. Group related specs under one name.
                  </p>
                  <button
                    type="button"
                    onClick={() => void newProject()}
                    disabled={creating}
                    className="text-brand-ink underline underline-offset-4 hover:opacity-80"
                  >
                    New project
                  </button>
                </div>
              </DashedNotch>
            ) : projectView === "table" ? (
              <div className="mt-4">
                <ProjectTable
                  projects={tabled}
                  total={projects.length}
                  q={projectQ}
                  onQ={(v) => {
                    setProjectQ(v);
                    setProjectPage(1);
                  }}
                  sort={projectSort}
                  onSort={(v) => {
                    setProjectSort(v);
                    setProjectPage(1);
                  }}
                  page={projectPage}
                  onPage={setProjectPage}
                  handlers={projectHandlers}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setProjectView("cards")}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Show as cards
                  </button>
                </p>
              </div>
            ) : (
              <>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {freshest.map((p) => (
                    <ProjectCard key={p.id} project={p} {...projectHandlers(p)} />
                  ))}
                </ul>
                {projects.length > CARD_LIMIT && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setProjectView("table")}
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      Show all {projects.length} projects
                    </button>
                  </p>
                )}
              </>
            )}
          </section>

          {/* Documents */}
          <section className="mt-12" aria-labelledby="documents">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="flex items-baseline gap-3">
                <h2 id="documents" style={{ fontFamily: SERIF }} className="text-2xl">
                  Documents
                </h2>
                {docs.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {free ? docs.length : `${docs.length} not in a project`}
                  </span>
                )}
              </div>
              {/* The empty state carries its own New spec, so only show this
                  one once there is a list. */}
              {docs.length > 0 && <NewSpecButton />}
            </div>
            <SectionError text={docsError} />

            {!loaded ? (
              <p className="mt-4 py-6 text-sm text-muted-foreground">Loading…</p>
            ) : nothingAtAll ? (
              <div className="mt-4">
                <EmptyState unclaimed={unclaimed} />
              </div>
            ) : (
              <div className="mt-4">
                <DocumentsTable
                  docs={shownDocs}
                  q={q}
                  onQ={setQ}
                  sort={sort}
                  onSort={setSort}
                  actions={actions}
                  leaving={new Set(pending.keys())}
                  onGone={onDocGone}
                  confirmingId={confirmingDoc}
                  busyId={busyDoc}
                  onConfirmDelete={(doc) => void onConfirmDelete(doc)}
                  onKeep={() => setConfirmingDoc(null)}
                  emptyText="Every document is in a project."
                />
              </div>
            )}
          </section>

          {loaded && free && (
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
