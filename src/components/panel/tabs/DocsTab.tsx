import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { FolderOpen, Lock, LogIn, type LucideIcon } from "lucide-react";
import { EditorName } from "~/components/app/documents/EditorName";
import { countLabel, docTitle, docUrl, projectName } from "~/components/app/documents/lib";
import { useRelativeTime } from "~/hooks/useRelativeTime";
import type { ProjectDocsState } from "~/hooks/useProjectDocuments";
import { useAuth } from "~/lib/auth/AuthProvider";
import { cn } from "~/lib/utils";
import type { DocumentRow } from "@shared/types";

export interface DocsTabProps {
  /** The open document, marked in the list. */
  docId: string;
  /** From the route's `useProjectDocuments`; the tab only renders it. */
  state: ProjectDocsState;
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
export function DocsTab({ docId, state }: DocsTabProps) {
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
  const others = documents.filter((d) => d.id !== docId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="truncate text-sm font-semibold text-foreground">{projectName(project)}</h3>
        <p className="text-xs text-muted-foreground">{countLabel(documents.length)}</p>
      </div>
      {others.length === 0 ? (
        <EmptyPanel icon={FolderOpen} title="Nothing else here yet">
          <p>Nothing else in this project yet.</p>
        </EmptyPanel>
      ) : (
        <ul className="p-2" aria-label="Documents in this project">
          {documents.map((d) => (
            <DocRow key={d.id} doc={d} current={d.id === docId} />
          ))}
        </ul>
      )}
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
    <div className="relative min-h-[280px] flex-1 overflow-hidden">
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
