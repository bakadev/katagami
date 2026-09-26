import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { FolderOpen, Lock, LogIn, Pencil, Plus, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PanelFiller } from "~/components/panel/PanelFiller";
import { renameProject } from "~/lib/api/auth";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { EditorName } from "~/components/app/documents/EditorName";
import { countLabel, docTitle, docUrl, projectName } from "~/components/app/documents/lib";
import { useRelativeTime } from "~/hooks/useRelativeTime";
import type { ProjectDocsState } from "~/hooks/useProjectDocuments";
import { useAuth } from "~/lib/auth/AuthProvider";
import { cn } from "~/lib/utils";
import type { DocumentRow, ProjectCard } from "@shared/types";

export interface DocsTabProps {
  /** The open document, marked in the list. */
  docId: string;
  /** From the route's `useProjectDocuments`; the tab only renders it. */
  state: ProjectDocsState;
  /** The open document's live title, so a rename shows here at once. */
  currentTitle?: string | null;
  /** Called after the project is renamed from the tab, to refetch. */
  onRenamed?: () => void;
}

/**
 * DocsTab: the other documents in this document's project, for quick
 * switching. What it shows depends on who is looking:
 *
 *   - signed in, project visible: the list, current one marked
 *   - signed in, Team, but the document sits in the hidden default bucket
 *     (the API answers 404): a nudge to put it in a project
 *   - signed in on Free: projects are a Team feature
 *   - signed out: sign in to see the rest
 *
 * The empty states keep the komon tile vocabulary shared with {@link AiTab}.
 */
export function DocsTab({ docId, state, currentTitle, onRenamed }: DocsTabProps) {
  const { user, plan } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <EmptyPanel icon={LogIn} title="Sign in to see this project">
        <p>Sign in to see the other documents in this project.</p>
        <PanelLink to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`}>
          Sign in
        </PanelLink>
      </EmptyPanel>
    );
  }

  if (state.status === "idle" || state.status === "loading") {
    return (
      <p className="p-4 text-xs text-muted-foreground" role="status">
        Loading documents…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="p-4 text-xs text-muted-foreground" role="status">
        Couldn&apos;t load this project&apos;s documents.
      </p>
    );
  }

  if (state.status === "not-in-project") {
    if (plan === "team") {
      return (
        <EmptyPanel icon={FolderOpen} title="Not in a project yet">
          <p>
            This document isn&apos;t in a project yet. Put it in one from Your documents and
            the rest of that project shows up here for quick switching.
          </p>
          <PanelLink to="/documents">Your documents</PanelLink>
        </EmptyPanel>
      );
    }
    return (
      <EmptyPanel icon={Lock} title="Projects come with Team">
        <p>Group related specs and switch between them from here.</p>
        <PanelLink to="/pricing">See Team</PanelLink>
      </EmptyPanel>
    );
  }

  const { project, documents } = state.data;
  // The open document's title comes from the editor, not the cached list.
  const rows = documents.map((d) =>
    d.id === docId && currentTitle !== undefined ? { ...d, title: currentTitle } : d,
  );
  return (
    <div className="flex h-full flex-col">
      <ProjectHeader project={project} count={documents.length} onRenamed={onRenamed} />
      <ul className="p-2" aria-label="Documents in this project">
        {rows.map((d) => (
          <DocRow key={d.id} doc={d} current={d.id === docId} />
        ))}
      </ul>
      <NewSpecInProject projectId={project.id} onCreated={onRenamed} />
      <PanelFiller />
    </div>
  );
}

/** Start another spec in this project without leaving the editor. */
function NewSpecInProject({ projectId, onCreated }: { projectId: string; onCreated?: () => void }) {
  const { create, loading, error } = useCreateDoc(projectId);
  return (
    <div className="px-2 pb-2">
      <button
        type="button"
        onClick={() => {
          void create().then(onCreated);
        }}
        disabled={loading}
        className="notch-sm flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-ink hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden />
        {loading ? "Opening…" : "New spec in this project"}
      </button>
      {error && (
        <p role="alert" className="px-3 pt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Project name and count, with an inline rename like the account menu's. */
function ProjectHeader({
  project,
  count,
  onRenamed,
}: {
  project: ProjectCard;
  count: number;
  onRenamed?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(projectName(project));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!editing) return;
    setDraft(projectName(project));
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
    return () => clearTimeout(t);
  }, [editing, project]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = draft.trim();
    if (!next || next === projectName(project)) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await renameProject(project.id, next);
      onRenamed?.();
      setEditing(false);
    } catch {
      toast.error("Couldn't rename the project");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <label htmlFor={inputId} className="text-xs font-medium text-foreground">
          Rename project
        </label>
        <input
          id={inputId}
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={80}
          disabled={busy}
          className="h-8 w-full border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
            className="notch-sm px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            className="notch-sm bg-brand px-3 py-1 text-xs font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group/project flex items-start justify-between gap-2 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-foreground">{projectName(project)}</h3>
        <p className="text-xs text-muted-foreground">{countLabel(count)}</p>
      </div>
      <button
        type="button"
        aria-label="Rename project"
        title="Rename project"
        onClick={() => setEditing(true)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function DocRow({ doc, current }: { doc: DocumentRow; current: boolean }) {
  const edited = useRelativeTime(doc.updatedAt);
  return (
    <li>
      <Link
        to={docUrl(doc)}
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex flex-col gap-0.5 rounded-sm px-2 py-1.5 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60",
          current ? "bg-brand/10" : "hover:bg-muted",
        )}
      >
        <span
          className={cn(
            "truncate text-sm",
            current ? "font-semibold text-brand-ink" : "text-foreground",
          )}
        >
          {docTitle(doc)}
        </span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">{edited}</span>
          {doc.lastEditedBy && (
            <>
              <span aria-hidden>·</span>
              <EditorName editor={doc.lastEditedBy} className="inline-flex min-w-0" />
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Empty-state vocabulary: komon tile, dual-ring badge, centered stack.
// ---------------------------------------------------------------------------

function EmptyPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative h-full min-h-[280px] flex-1 overflow-hidden">
      <div
        aria-hidden
        className="komon pointer-events-none absolute inset-0 -z-0 text-brand-ink opacity-[0.10] dark:opacity-[0.16]"
      />
      <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="notch relative mb-5 bg-brand/10 p-3">
          <div className="notch-sm flex size-11 items-center justify-center bg-background">
            <Icon aria-hidden className="size-5 text-brand-ink" strokeWidth={1.75} />
          </div>
        </div>
        <h3 className="text-base leading-tight font-semibold text-foreground">{title}</h3>
        <div className="mt-1.5 flex max-w-[260px] flex-col items-center gap-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
