import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, Link2, MessageSquare, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { DocumentRow, ProjectCard } from "../../../../shared/types";
import { ConfirmInline } from "./ConfirmInline";
import { EditorName } from "./EditorName";
import { Leaving } from "./Leaving";
import { SearchField } from "./SearchField";
import { DOC_SORT_OPTIONS, SortText } from "./SortText";
import { ago, docTitle, docUrl, projectName, type SortKey } from "./lib";

/**
 * The flat documents table option D uses on both signed-in pages: search on
 * the left, text sort on the right, then one row per document with the
 * title, last edited (anyone's), who, open counts, copy link and overflow.
 */

export interface RowActions {
  /** Projects offered under "Move to project". Absent on Free. */
  projects?: ProjectCard[];
  /** Offered when the document is in a project (project page). */
  canRemoveFromProject?: boolean;
  /** `null` means "Remove from project" (back to the default one). */
  onMove: (doc: DocumentRow, projectId: string | null) => void;
  onDelete: (doc: DocumentRow) => void;
}

/** Copies the editor URL for the row; flashes a check and toasts "Copied". */
export function CopyLinkButton({ doc }: { doc: DocumentRow }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${docUrl(doc)}`;
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      toast("Copied", { duration: 1500 });
      window.setTimeout(() => setDone(false), 1200);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };
  return (
    <button
      type="button"
      aria-label={`Copy link for ${docTitle(doc)}`}
      title="Copy link"
      onClick={() => void copy()}
      className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {done ? <Check className="size-4 text-brand-ink" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
    </button>
  );
}

function RowMenu({ doc, actions }: { doc: DocumentRow; actions: RowActions }) {
  const { projects, canRemoveFromProject, onMove, onDelete } = actions;
  const hasMove = (projects && projects.length > 0) || canRemoveFromProject;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${docTitle(doc)}`}
        className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {hasMove && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to project</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {(projects ?? []).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  disabled={p.id === doc.projectId}
                  onSelect={() => onMove(doc, p.id)}
                >
                  <span className="flex-1 truncate">{projectName(p)}</span>
                  {p.id === doc.projectId && <Check className="size-3.5" aria-hidden />}
                </DropdownMenuItem>
              ))}
              {canRemoveFromProject && (
                <>
                  {(projects ?? []).length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={() => onMove(doc, null)}>
                    Remove from project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {hasMove && <DropdownMenuSeparator />}
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(doc)}>
          <Trash2 className="size-3.5" aria-hidden />
          Delete document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Open comment and suggestion counts on the yellow anchor, in their own
 * column just left of the row actions. Zero hides the chip; the column keeps
 * its width so the actions line up down the table.
 */
export function OpenCounts({ doc }: { doc: DocumentRow }) {
  const comments = doc.openComments;
  const suggestions = doc.openSuggestions;
  return (
    <span className="flex w-16 shrink-0 items-center justify-end gap-1.5 text-xs sm:w-20 sm:gap-2">
      {comments > 0 && (
        <span className="comment-anchor inline-flex items-center gap-1 px-1.5 py-0.5">
          <MessageSquare className="size-3" aria-hidden />
          {comments}
          <span className="sr-only"> open comments</span>
        </span>
      )}
      {suggestions > 0 && (
        <span className="comment-anchor inline-flex items-center gap-1 px-1.5 py-0.5">
          <PenLine className="size-3" aria-hidden />
          {suggestions}
          <span className="sr-only"> open suggestions</span>
        </span>
      )}
    </span>
  );
}

/** One row: title, last edited (anyone's), who, counts, copy link, overflow. Or the delete confirm. */
export function DocRow({
  doc,
  actions,
  leaving,
  onGone,
  confirming,
  busy,
  onConfirmDelete,
  onKeep,
}: {
  doc: DocumentRow;
  actions: RowActions;
  leaving: boolean;
  onGone: () => void;
  confirming: boolean;
  busy: boolean;
  onConfirmDelete: () => void;
  onKeep: () => void;
}) {
  const title = docTitle(doc);
  return (
    <Leaving leaving={leaving} onGone={onGone} className="group" data-doc={doc.id}>
      {confirming ? (
        <ConfirmInline
          question={<>Delete “{title}”?</>}
          note="This can't be undone."
          busy={busy}
          onConfirm={onConfirmDelete}
          onCancel={onKeep}
          className="bg-destructive/5 px-3 py-3"
        />
      ) : (
        <div className="flex items-center gap-4 py-3 hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            <Link to={docUrl(doc)} className="block truncate text-sm hover:text-brand-ink">
              {title}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{ago(doc.updatedAt)}</p>
          </div>
          <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
            {ago(doc.updatedAt)}
          </span>
          <span className="hidden w-36 shrink-0 text-xs text-muted-foreground md:block">
            {doc.lastEditedBy ? <EditorName editor={doc.lastEditedBy} /> : "—"}
          </span>
          <OpenCounts doc={doc} />
          <div className="flex items-center gap-0.5">
            <span className="hidden sm:inline-flex">
              <CopyLinkButton doc={doc} />
            </span>
            <RowMenu doc={doc} actions={actions} />
          </div>
        </div>
      )}
    </Leaving>
  );
}

/** Search on the left, text sort on the right, then the flat table. */
export function DocumentsTable({
  docs,
  q,
  onQ,
  sort,
  onSort,
  actions,
  leaving,
  onGone,
  confirmingId,
  busyId,
  onConfirmDelete,
  onKeep,
  emptyText,
}: {
  /** Already filtered and sorted. */
  docs: DocumentRow[];
  q: string;
  onQ: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  actions: RowActions;
  leaving: Set<string>;
  onGone: (id: string) => void;
  confirmingId: string | null;
  /** The document whose delete request is in flight. */
  busyId?: string | null;
  onConfirmDelete: (doc: DocumentRow) => void;
  onKeep: () => void;
  emptyText: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={q} onChange={onQ} className="sm:w-72" />
        <SortText value={sort} onChange={onSort} options={DOC_SORT_OPTIONS} />
      </div>
      {docs.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {q.trim() ? <>Nothing titled “{q}”.</> : emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {docs.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              actions={actions}
              leaving={leaving.has(d.id)}
              onGone={() => onGone(d.id)}
              confirming={confirmingId === d.id}
              busy={busyId === d.id}
              onConfirmDelete={() => onConfirmDelete(d)}
              onKeep={onKeep}
            />
          ))}
        </ul>
      )}
    </>
  );
}
