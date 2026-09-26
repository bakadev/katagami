import { Link } from "react-router";
import type { ProjectCard as ProjectCardData } from "../../../../shared/types";
import { SERIF } from "../serif";
import { ConfirmInline } from "./ConfirmInline";
import { EditorName } from "./EditorName";
import { InlineName } from "./InlineName";
import { Leaving } from "./Leaving";
import { ProjectMenu, projectTo, type ProjectRowHandlers } from "./ProjectCard";
import { SearchField } from "./SearchField";
import { PROJECT_SORT_OPTIONS, SortText } from "./SortText";
import { ago, countLabel, deleteProjectNote, projectName, type ProjectSortKey } from "./lib";

export const PROJECT_PAGE_SIZE = 10;

/** One row of the compact table, or the delete confirmation in its place. */
function ProjectRow({ project, h }: { project: ProjectCardData; h: ProjectRowHandlers }) {
  const n = project.documentCount;
  const name = projectName(project);
  const by = project.lastEditedBy;
  return (
    <Leaving leaving={h.leaving} onGone={h.onGone} className="group" data-project={project.id}>
      {h.confirming ? (
        <ConfirmInline
          question={<>Delete “{name}”?</>}
          note={deleteProjectNote(n)}
          busy={h.busy}
          onConfirm={h.onConfirmDelete}
          onCancel={h.onKeep}
          className="bg-destructive/5 px-3 py-3"
        />
      ) : (
        <div className="flex items-center gap-4 py-3 hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            {h.renaming ? (
              <InlineName
                value={name}
                onChange={h.onRename}
                editing
                onEditingChange={h.onRenamingChange}
                className="text-base"
                inputClassName="max-w-sm"
              />
            ) : (
              <Link
                to={projectTo(project)}
                style={{ fontFamily: SERIF }}
                className="block truncate text-base leading-tight hover:text-brand-ink"
              >
                {name}
              </Link>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
              {n} doc{n === 1 ? "" : "s"}
              {n > 0 && <> · {ago(project.updatedAt)}</>}
            </p>
          </div>
          <span className="hidden w-24 shrink-0 text-xs text-muted-foreground sm:block">
            {countLabel(n)}
          </span>
          <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
            {n > 0 ? ago(project.updatedAt) : "—"}
          </span>
          <span className="hidden w-36 shrink-0 text-xs text-muted-foreground md:block">
            {by ? <EditorName editor={by} /> : "—"}
          </span>
          <ProjectMenu project={project} onRename={() => h.onRenamingChange(true)} onAskDelete={h.onAskDelete} />
        </div>
      )}
    </Leaving>
  );
}

/**
 * The compact table the cards give way to past six projects: search on the
 * left, text sort on the right, column headings, ten rows a page and a
 * "1–10 of 14 · Next" line. Search and sort come from the page so the page
 * stays the one source of truth for what is shown.
 */
export function ProjectTable({
  projects,
  total,
  q,
  onQ,
  sort,
  onSort,
  page,
  onPage,
  handlers,
}: {
  /** Already filtered and sorted; the table only slices the page. */
  projects: ProjectCardData[];
  /** Count before filtering, for the empty message. */
  total: number;
  q: string;
  onQ: (v: string) => void;
  sort: ProjectSortKey;
  onSort: (v: ProjectSortKey) => void;
  page: number;
  onPage: (n: number) => void;
  handlers: (project: ProjectCardData) => ProjectRowHandlers;
}) {
  const pages = Math.max(1, Math.ceil(projects.length / PROJECT_PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PROJECT_PAGE_SIZE;
  const shown = projects.slice(start, start + PROJECT_PAGE_SIZE);
  return (
    <>
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={q}
          onChange={onQ}
          className="sm:w-72"
          label="Search projects by name"
          placeholder="Search projects"
        />
        <SortText value={sort} onChange={onSort} options={PROJECT_SORT_OPTIONS} />
      </div>
      <div
        aria-hidden
        className="hidden items-center gap-4 border-b border-border py-2 text-[11px] uppercase tracking-wide text-muted-foreground sm:flex"
      >
        <span className="flex-1">Name</span>
        <span className="w-24 shrink-0">Documents</span>
        <span className="w-32 shrink-0">Updated</span>
        <span className="hidden w-36 shrink-0 md:block">Last editor</span>
        <span className="size-8 shrink-0" />
      </div>
      {shown.length === 0 ? (
        <p className="border-t border-border py-12 text-center text-sm text-muted-foreground sm:border-t-0">
          {q.trim() ? <>No project named “{q}”.</> : total === 0 ? "No projects yet." : null}
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border sm:border-t-0">
          {shown.map((p) => (
            <ProjectRow key={p.id} project={p} h={handlers(p)} />
          ))}
        </ul>
      )}
      {projects.length > PROJECT_PAGE_SIZE && (
        <p className="flex items-center gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {start + 1}–{start + shown.length} of {projects.length}
          </span>
          {current > 1 && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => onPage(current - 1)}
                className="px-1 py-0.5 underline-offset-4 hover:text-foreground hover:underline"
              >
                Previous
              </button>
            </>
          )}
          {current < pages && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => onPage(current + 1)}
                className="px-1 py-0.5 underline-offset-4 hover:text-foreground hover:underline"
              >
                Next
              </button>
            </>
          )}
        </p>
      )}
    </>
  );
}
