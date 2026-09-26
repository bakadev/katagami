import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { DocumentRow, ProjectCard as ProjectCardData } from "../../shared/types";
import { useAuth } from "~/lib/auth/AuthProvider";
import { deleteDocument, deleteProject, getHome, getProject, moveDocument, renameProject } from "~/lib/api/auth";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { AppHeader } from "~/components/app/AppHeader";
import { SERIF } from "~/components/app/serif";
import { ConfirmInline } from "~/components/app/documents/ConfirmInline";
import { DocumentsTable, type RowActions } from "~/components/app/documents/DocumentsTable";
import { InlineName } from "~/components/app/documents/InlineName";
import { NewSpecButton } from "~/components/app/documents/NewSpecButton";
import {
  ago,
  countLabel,
  deleteProjectNote,
  filterDocs,
  projectName,
  sortDocs,
  type SortKey,
} from "~/components/app/documents/lib";

/**
 * One project, /documents/:projectId. The same app header, a breadcrumb
 * back to the home, the name in serif with an inline rename, a meta line,
 * "New spec" and an overflow with "Delete project", then the same search,
 * sort and table as the Documents section of the home.
 */

function message(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : "";
  return /^\d{3}$/.test(m) || !m ? fallback : `${fallback} (${m})`;
}

export default function Project() {
  const { projectId = "" } = useParams();
  const { user, loading } = useAuth();
  if (!loading && !user) {
    return <Navigate to={`/signin?next=${encodeURIComponent(`/documents/${projectId}`)}`} replace />;
  }
  if (!user) return null;
  return <ProjectPage key={projectId} projectId={projectId} />;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProjectPage({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectCardData | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [others, setOthers] = useState<ProjectCardData[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);

  const name = project ? projectName(project) : "Project";
  usePageMeta({ title: name, description: "One project's documents." });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await getProject(projectId);
        if (cancelled) return;
        setProject(page.project);
        setDocs(page.documents);
        setState("ready");
        /* The other projects, for "Move to project". Optional. */
        try {
          const home = await getHome();
          if (!cancelled) setOthers(home.projects.filter((p) => p.id !== projectId));
        } catch {
          // the move menu just offers "Remove from project"
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "404") setState("missing");
        else {
          setState("failed");
          setError(message(e, "Couldn't load this project."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const [renaming, setRenaming] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [confirmingDoc, setConfirmingDoc] = useState<string | null>(null);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const [confirmingProject, setConfirmingProject] = useState(false);
  const [busyProject, setBusyProject] = useState(false);

  const shown = useMemo(() => sortDocs(filterDocs(docs, q), sort), [docs, q, sort]);

  const markLeaving = (id: string) => setLeaving((s) => new Set(s).add(id));

  const rename = async (next: string) => {
    if (!project) return;
    const before = project.name;
    setError(null);
    setProject({ ...project, name: next });
    try {
      await renameProject(project.id, next);
    } catch (e) {
      setProject((p) => (p ? { ...p, name: before } : p));
      setError(message(e, "Couldn't rename this project."));
    }
  };

  const confirmDeleteProject = async () => {
    if (!project) return;
    setError(null);
    setBusyProject(true);
    try {
      await deleteProject(project.id);
      navigate("/documents", { replace: true });
    } catch (e) {
      setBusyProject(false);
      setError(message(e, "Couldn't delete this project."));
    }
  };

  const onMove = async (doc: DocumentRow, targetId: string | null) => {
    setError(null);
    try {
      await moveDocument(doc.id, targetId);
      markLeaving(doc.id);
    } catch (e) {
      setError(message(e, "Couldn't move that document."));
    }
  };

  const onConfirmDelete = async (doc: DocumentRow) => {
    setError(null);
    setBusyDoc(doc.id);
    try {
      await deleteDocument(doc.id);
      setConfirmingDoc(null);
      markLeaving(doc.id);
    } catch (e) {
      setError(message(e, "Couldn't delete that document."));
    } finally {
      setBusyDoc(null);
    }
  };

  /* Moved or deleted, the row is gone from this project either way. */
  const onDocGone = (id: string) => {
    setDocs((list) => list.filter((d) => d.id !== id));
    setProject((p) => (p ? { ...p, documentCount: Math.max(0, p.documentCount - 1) } : p));
    setLeaving((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const actions: RowActions = {
    projects: others,
    canRemoveFromProject: true,
    onMove: (doc, targetId) => void onMove(doc, targetId),
    onDelete: (doc) => setConfirmingDoc(doc.id),
  };

  if (state === "missing" || state === "failed") {
    return (
      <Shell>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/documents" className="hover:text-foreground">
            Your documents
          </Link>
        </nav>
        <h1 style={{ fontFamily: SERIF }} className="mt-4 text-3xl leading-tight sm:text-4xl">
          {state === "missing" ? "This project isn't here" : "Couldn't load this project"}
        </h1>
        <p className="mt-3 max-w-[48ch] text-sm text-muted-foreground" role={state === "failed" ? "alert" : undefined}>
          {state === "missing"
            ? "It may have been deleted, or it belongs to a team you're not in."
            : error}
        </p>
        <p className="mt-6 text-sm">
          <Link to="/documents" className="text-brand-ink underline underline-offset-4">
            Back to your documents
          </Link>
        </p>
      </Shell>
    );
  }

  const n = docs.length;
  const updated = project && n > 0 ? `Updated ${ago(project.updatedAt)}` : null;

  return (
    <Shell>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/documents" className="hover:text-foreground">
          Your documents
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-foreground" aria-current="page">
          {project ? name : "…"}
        </span>
      </nav>

      {/* Header row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 text-3xl leading-tight sm:text-4xl">
              {project ? (
                <InlineName
                  value={name}
                  onChange={(v) => void rename(v)}
                  editing={renaming}
                  onEditingChange={setRenaming}
                  showButton={false}
                  className="text-3xl sm:text-4xl"
                  inputClassName="max-w-lg"
                />
              ) : (
                <span style={{ fontFamily: SERIF }} className="text-muted-foreground">
                  Loading…
                </span>
              )}
            </h1>
            {!renaming && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="More actions for this project"
                  disabled={!project}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onSelect={() => setRenaming(true)}>
                    <Pencil className="size-3.5" aria-hidden />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingProject(true)}>
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {project && (
            <p className="mt-2 text-sm text-muted-foreground">
              {countLabel(n)}
              {updated && <> · {updated}</>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NewSpecButton projectId={projectId} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {confirmingProject && (
        <NotchCard tone="indigo" outerClassName="mt-6" className="px-4 py-3">
          <ConfirmInline
            question={<>Delete “{name}”?</>}
            note={deleteProjectNote(n)}
            busy={busyProject}
            onConfirm={() => void confirmDeleteProject()}
            onCancel={() => setConfirmingProject(false)}
          />
        </NotchCard>
      )}

      <div className="mt-8">
        {state === "loading" ? (
          <p className="py-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <DocumentsTable
            docs={shown}
            q={q}
            onQ={setQ}
            sort={sort}
            onSort={setSort}
            actions={actions}
            leaving={leaving}
            onGone={onDocGone}
            confirmingId={confirmingDoc}
            busyId={busyDoc}
            onConfirmDelete={(doc) => void onConfirmDelete(doc)}
            onKeep={() => setConfirmingDoc(null)}
            emptyText="Nothing in this project yet."
          />
        )}
      </div>
    </Shell>
  );
}
