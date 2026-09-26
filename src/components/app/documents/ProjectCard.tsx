import { Link } from "react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { NotchCard } from "~/components/site/NotchCard";
import { cn } from "~/lib/utils";
import type { ProjectCard as ProjectCardData } from "../../../../shared/types";
import { SERIF } from "../serif";
import { ConfirmInline } from "./ConfirmInline";
import { InlineName } from "./InlineName";
import { Leaving } from "./Leaving";
import { ago, countLabel, deleteProjectNote, projectName } from "./lib";

/** Everything a project card or row needs from the page. */
export interface ProjectRowHandlers {
  leaving: boolean;
  onGone: () => void;
  confirming: boolean;
  /** The delete request is in flight. */
  busy: boolean;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onKeep: () => void;
  onRename: (name: string) => void;
  renaming: boolean;
  onRenamingChange: (v: boolean) => void;
}

export function projectTo(p: ProjectCardData): string {
  return `/documents/${p.id}`;
}

/** Overlapping colour dots for the people who edited a project's documents. */
export function EditorDots({ project }: { project: ProjectCardData }) {
  const editors = project.editors;
  if (editors.length === 0) return null;
  return (
    <span className="flex items-center" aria-label={`Edited by ${editors.map((e) => e.name).join(", ")}`}>
      {editors.map((e, i) => (
        <span
          key={e.name}
          title={e.name}
          className={cn("block size-3 rounded-full ring-2 ring-card", i > 0 && "-ml-1")}
          style={{ background: e.color }}
        />
      ))}
    </span>
  );
}

/** Project overflow: Rename, Delete project. Shared by the card and the table row. */
export function ProjectMenu({
  project,
  onRename,
  onAskDelete,
}: {
  project: ProjectCardData;
  onRename: () => void;
  onAskDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${projectName(project)}`}
        className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onRename}>
          <Pencil className="size-3.5" aria-hidden />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onAskDelete}>
          <Trash2 className="size-3.5" aria-hidden />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A project tile. The whole card links to the project page (stretched link
 * under the name) except the overflow, which sits above it.
 */
export function ProjectCard({
  project,
  leaving,
  onGone,
  confirming,
  busy,
  onAskDelete,
  onConfirmDelete,
  onKeep,
  onRename,
  renaming,
  onRenamingChange,
}: { project: ProjectCardData } & ProjectRowHandlers) {
  const name = projectName(project);
  const n = project.documentCount;
  const by = project.lastEditedBy?.name;
  const updated = n > 0 ? `Updated ${ago(project.updatedAt)}` : null;
  return (
    <Leaving leaving={leaving} onGone={onGone} mode="fade" className="min-w-0" data-project={project.id}>
      <NotchCard
        tone={confirming ? "indigo" : "gray"}
        outerClassName="h-full"
        className="group relative flex h-full flex-col p-4 transition-colors hover:bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] sm:p-5"
      >
        {confirming ? (
          <ConfirmInline
            question={<>Delete “{name}”?</>}
            note={deleteProjectNote(n)}
            busy={busy}
            onConfirm={onConfirmDelete}
            onCancel={onKeep}
            className="h-full content-center"
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              {renaming ? (
                <InlineName
                  value={name}
                  onChange={onRename}
                  editing
                  onEditingChange={onRenamingChange}
                  className="text-xl"
                />
              ) : (
                <Link
                  to={projectTo(project)}
                  style={{ fontFamily: SERIF }}
                  className="min-w-0 truncate text-xl leading-tight after:absolute after:inset-0 after:content-[''] group-hover:text-brand-ink focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {name}
                </Link>
              )}
              <div className="relative z-10 -mr-2 -mt-1.5">
                <ProjectMenu
                  project={project}
                  onRename={() => onRenamingChange(true)}
                  onAskDelete={onAskDelete}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{countLabel(n)}</p>
            <div className="mt-auto flex items-end justify-between gap-3 pt-6">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {updated ? (by ? `${updated} · ${by}` : updated) : "Nothing in it yet"}
              </p>
              <EditorDots project={project} />
            </div>
          </>
        )}
      </NotchCard>
    </Leaving>
  );
}
