import type { DocumentRow, ProjectCard } from "../../../../shared/types";
import { formatRelative } from "~/hooks/useRelativeTime";

/** Helpers the documents home and project page share: sorting, filtering, copy. */

export type SortKey = "edited" | "title";
export type ProjectSortKey = "updated" | "name";

export const UNTITLED_DOC = "Untitled";
export const UNTITLED_PROJECT = "Untitled project";

export function docTitle(d: DocumentRow): string {
  return d.title?.trim() || UNTITLED_DOC;
}

export function projectName(p: ProjectCard): string {
  return p.name?.trim() || UNTITLED_PROJECT;
}

/** Where a row opens: the editor with the owner's edit key. */
export function docUrl(d: DocumentRow): string {
  return `/p/${d.projectId}/d/${d.id}?key=${d.editToken}`;
}

export function sortDocs(docs: DocumentRow[], by: SortKey): DocumentRow[] {
  const out = [...docs];
  if (by === "title") out.sort((a, b) => docTitle(a).localeCompare(docTitle(b)));
  else out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return out;
}

export function filterDocs(docs: DocumentRow[], q: string): DocumentRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return docs;
  return docs.filter((d) => docTitle(d).toLowerCase().includes(needle));
}

export function sortProjects(projects: ProjectCard[], by: ProjectSortKey): ProjectCard[] {
  const out = [...projects];
  if (by === "name") out.sort((a, b) => projectName(a).localeCompare(projectName(b)));
  else out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return out;
}

export function filterProjects(projects: ProjectCard[], q: string): ProjectCard[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return projects;
  return projects.filter((p) => projectName(p).toLowerCase().includes(needle));
}

/** "12 minutes ago", "3 hours ago", "Sep 12". */
export function ago(iso: string): string {
  return formatRelative(iso);
}

export function countLabel(n: number): string {
  return `${n} document${n === 1 ? "" : "s"}`;
}

/** "Delete 'X'?" note: where its documents go, or that it can't be undone. */
export function deleteProjectNote(n: number): string {
  return n > 0
    ? `Its ${n} document${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} back to Documents.`
    : "This can't be undone.";
}
