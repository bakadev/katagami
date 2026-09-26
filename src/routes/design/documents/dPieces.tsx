import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import {
  Check,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
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
import { NotchCard } from "~/components/site/NotchCard";
import { cn } from "~/lib/utils";
import {
  NO_PROJECT,
  latestDoc,
  personById,
  projectUpdatedMinutesAgo,
  relative,
  type Doc,
  type Project,
  type ProjectSortKey,
  type SortKey,
} from "./data";
import { Editor, SERIF, SearchField, ShareButton, SortText } from "./pieces";

/**
 * Pieces only option D uses, on both of its pages: the animated row exit,
 * the inline delete confirmation, the document table, the project card and
 * the inline rename. All state is local; the pages are demos.
 */

/* ---- Leaving: height collapse + fade + slight slide, ~250ms ------------ */

const LEAVE_MS = 250;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Wraps a row or card. When `leaving` turns true the element collapses
 * (height, padding, border), fades and slides up over 250ms, then `onGone`
 * fires so the parent removes it from state. With reduced motion `onGone`
 * fires at once. `mode="fade"` skips the height collapse (grid cards).
 */
export function Leaving<T extends "li" | "div" = "li">({
  as,
  leaving,
  onGone,
  mode = "collapse",
  className,
  children,
  ...rest
}: {
  as?: T;
  leaving: boolean;
  onGone: () => void;
  mode?: "collapse" | "fade";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">) {
  const Tag = (as ?? "li") as "li";
  const ref = useRef<HTMLLIElement>(null);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  useLayoutEffect(() => {
    if (!leaving) return;
    const el = ref.current;
    if (!el || reducedMotion()) {
      goneRef.current();
      return;
    }
    const h = el.getBoundingClientRect().height;
    const st = el.style;
    st.overflow = "hidden";
    st.pointerEvents = "none";
    if (mode === "collapse") st.height = `${h}px`;
    st.transition = `height ${LEAVE_MS}ms ease, padding ${LEAVE_MS}ms ease, border-width ${LEAVE_MS}ms ease, opacity ${LEAVE_MS}ms ease, transform ${LEAVE_MS}ms ease`;
    /* Reflow so the transition starts from the measured height. */
    void el.getBoundingClientRect();
    st.opacity = "0";
    st.transform = "translateY(-6px)";
    if (mode === "collapse") {
      st.height = "0px";
      st.paddingTop = "0px";
      st.paddingBottom = "0px";
      st.borderTopWidth = "0px";
      st.borderBottomWidth = "0px";
    }
    const t = window.setTimeout(() => goneRef.current(), LEAVE_MS + 20);
    return () => window.clearTimeout(t);
  }, [leaving, mode]);

  return (
    <Tag ref={ref} className={className} aria-hidden={leaving || undefined} {...(rest as object)}>
      {children}
    </Tag>
  );
}

/* ---- Inline confirmation ---------------------------------------------- */

/** "Delete 'X'? This can't be undone. [Delete] [Keep]" in place of a row or card. */
export function ConfirmInline({
  question,
  note,
  onConfirm,
  onCancel,
  className,
}: {
  question: ReactNode;
  note: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    keepRef.current?.focus();
  }, []);
  return (
    <div
      role="alertdialog"
      aria-live="polite"
      className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm", className)}
    >
      <p>
        <span className="font-medium">{question}</span>{" "}
        <span className="text-muted-foreground">{note}</span>
      </p>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="notch-sm inline-flex h-8 items-center bg-destructive px-3 text-xs font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Delete
        </button>
        <OutlinedButton ref={keepRef} onClick={onCancel} size="sm" icon={null}>
          Keep
        </OutlinedButton>
      </span>
    </div>
  );
}

/* ---- Buttons ----------------------------------------------------------- */

/**
 * Secondary outlined notched button ("New project", "Keep"). The 6px cut with
 * the border following it: an outer box in the border colour with 1px of
 * padding and an inner face one pixel smaller. Disabled shows a lock.
 */
export const OutlinedButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    lock?: boolean;
    className?: string;
    /** Leading icon; `null` for none. Defaults to a plus. */
    icon?: ReactNode;
    /** `md` is the 40px page button, `sm` the 32px inline one. */
    size?: "md" | "sm";
  }
>(function OutlinedButton(
  { children, onClick, disabled = false, lock = false, className, icon, size = "md" },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={disabled && lock ? "Projects come with Team" : undefined}
      className={cn(
        "notch-sm inline-flex items-center border-0 bg-border p-px outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "md" ? "h-10 text-sm" : "h-8 text-xs",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "notch-sm-in flex h-full items-center gap-2 bg-card",
          size === "md" ? "px-3.5" : "px-3 font-medium",
          !disabled && "hover:bg-muted/60",
        )}
      >
        {icon === undefined ? <Plus className="size-4" aria-hidden /> : icon}
        {children}
        {lock && <Lock className="size-3.5 text-muted-foreground" aria-hidden />}
      </span>
    </button>
  );
});

/* ---- Inline rename ----------------------------------------------------- */

/**
 * A name with a pencil. Click the pencil: an input replaces the text; Enter
 * commits, Escape cancels, blur commits. `editing` can be forced on from
 * outside (a just-created project starts in rename).
 */
export function InlineName({
  value,
  onChange,
  editing,
  onEditingChange,
  className,
  inputClassName,
  label = "Rename project",
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  className?: string;
  inputClassName?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) {
      setDraft(value);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = () => {
    const v = draft.trim();
    if (v) onChange(v);
    onEditingChange(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") onEditingChange(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        aria-label={label}
        style={{ fontFamily: SERIF }}
        className={cn(
          "w-full min-w-0 border-b border-brand-ink bg-transparent leading-tight outline-none",
          className,
          inputClassName,
        )}
      />
    );
  }
  return (
    <span className="group/name inline-flex min-w-0 items-center gap-2">
      <span style={{ fontFamily: SERIF }} className={cn("truncate leading-tight", className)}>
        {value}
      </span>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => onEditingChange(true)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover/name:opacity-100"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

/* ---- Row menu ---------------------------------------------------------- */

export interface RowActions {
  /** Projects offered under "Move to project". Absent on Free. */
  projects?: Project[];
  /** Offered when the document is in a project (page 2). */
  canRemoveFromProject?: boolean;
  onMove: (doc: Doc, projectId: string) => void;
  onDelete: (doc: Doc) => void;
}

function RowMenuD({ doc, actions }: { doc: Doc; actions: RowActions }) {
  const { projects, canRemoveFromProject, onMove, onDelete } = actions;
  const hasMove = (projects && projects.length > 0) || canRemoveFromProject;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${doc.title}`}
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
                  <span className="flex-1">{p.name}</span>
                  {p.id === doc.projectId && <Check className="size-3.5" aria-hidden />}
                </DropdownMenuItem>
              ))}
              {canRemoveFromProject && (
                <>
                  {(projects ?? []).length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={() => onMove(doc, NO_PROJECT)}>
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

/* ---- Document table ---------------------------------------------------- */

/**
 * Open comment and suggestion counts on the yellow anchor (option C's chips),
 * in their own column just left of the row actions. Zero hides the chip; the
 * column keeps its width so the actions line up down the table.
 */
function OpenCounts({ doc }: { doc: Doc }) {
  const comments = doc.comments ?? 0;
  const suggestions = doc.suggestions ?? 0;
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

/** One row: title, last edited (anyone's), who, share, overflow. Or the delete confirm. */
export function DocRow({
  doc,
  actions,
  leaving,
  onGone,
  confirming,
  onConfirmDelete,
  onKeep,
}: {
  doc: Doc;
  actions: RowActions;
  leaving: boolean;
  onGone: () => void;
  confirming: boolean;
  onConfirmDelete: () => void;
  onKeep: () => void;
}) {
  const by = personById(doc.editedBy);
  return (
    <Leaving leaving={leaving} onGone={onGone} className="group" data-doc={doc.id}>
      {confirming ? (
        <ConfirmInline
          question={<>Delete “{doc.title}”?</>}
          note="This can't be undone."
          onConfirm={onConfirmDelete}
          onCancel={onKeep}
          className="bg-destructive/5 px-3 py-3"
        />
      ) : (
        <div className="flex items-center gap-4 py-3 hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            <Link to="/" className="block truncate text-sm hover:text-brand-ink">
              {doc.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
              {relative(doc.editedMinutesAgo)}
            </p>
          </div>
          <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
            {relative(doc.editedMinutesAgo)}
          </span>
          <Editor
            person={by}
            className="hidden w-36 shrink-0 text-xs text-muted-foreground md:inline-flex"
          />
          <OpenCounts doc={doc} />
          <div className="flex items-center gap-0.5">
            <span className="hidden sm:inline-flex">
              <ShareButton title={doc.title} />
            </span>
            <RowMenuD doc={doc} actions={actions} />
          </div>
        </div>
      )}
    </Leaving>
  );
}

/** Search on the left, text sort on the right, then the flat table. */
export function DocTable({
  docs,
  q,
  onQ,
  sort,
  onSort,
  actions,
  leaving,
  onGone,
  confirmingId,
  onConfirmDelete,
  onKeep,
  emptyText,
}: {
  docs: Doc[];
  q: string;
  onQ: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  actions: RowActions;
  leaving: Set<string>;
  onGone: (id: string) => void;
  confirmingId: string | null;
  onConfirmDelete: (doc: Doc) => void;
  onKeep: () => void;
  emptyText: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={q} onChange={onQ} className="sm:w-72" />
        <SortText value={sort} onChange={onSort} />
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
              onConfirmDelete={() => onConfirmDelete(d)}
              onKeep={onKeep}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/* ---- Project card ------------------------------------------------------ */

/** Overlapping colour dots for the people who edited a project's documents. */
export function EditorDots({ docs }: { docs: Doc[] }) {
  const ids = [...new Set(docs.map((d) => d.editedBy))];
  if (ids.length === 0) return null;
  return (
    <span className="flex items-center" aria-label={`Edited by ${ids.map((i) => personById(i).name).join(", ")}`}>
      {ids.map((id, i) => {
        const p = personById(id);
        return (
          <span
            key={id}
            title={p.name}
            className={cn("block size-3 rounded-full ring-2 ring-card", i > 0 && "-ml-1")}
            style={{ background: p.color }}
          />
        );
      })}
    </span>
  );
}

/** Project meta: "3 documents", "Updated 12 minutes ago" and who did it. */
export function projectMeta(docs: Doc[]): { count: string; updated: string | null; by: string | null } {
  const count = `${docs.length} document${docs.length === 1 ? "" : "s"}`;
  const latest = latestDoc(docs);
  return {
    count,
    updated: latest ? `Updated ${relative(latest.editedMinutesAgo)}` : null,
    by: latest ? personById(latest.editedBy).name : null,
  };
}

/** Project overflow: Rename, Delete project. Shared by the card and the table row. */
function ProjectMenu({
  project,
  onRename,
  onAskDelete,
}: {
  project: Project;
  onRename: () => void;
  onAskDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${project.name}`}
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
  docs,
  to,
  leaving,
  onGone,
  confirming,
  onAskDelete,
  onConfirmDelete,
  onKeep,
  onRename,
  renaming,
  onRenamingChange,
}: { project: Project; docs: Doc[]; to: string } & ProjectRowHandlers) {
  const { count, updated, by } = projectMeta(docs);
  const n = docs.length;
  return (
    <Leaving leaving={leaving} onGone={onGone} mode="fade" className="min-w-0">
      <NotchCard
        tone={confirming ? "indigo" : "gray"}
        outerClassName="h-full"
        className="group relative flex h-full flex-col p-4 transition-colors hover:bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] sm:p-5"
      >
        {confirming ? (
          <ConfirmInline
            question={<>Delete “{project.name}”?</>}
            note={
              n > 0
                ? `Its ${n} document${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} back to Documents.`
                : "This can't be undone."
            }
            onConfirm={onConfirmDelete}
            onCancel={onKeep}
            className="h-full content-center"
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              {renaming ? (
                <InlineName
                  value={project.name}
                  onChange={onRename}
                  editing
                  onEditingChange={onRenamingChange}
                  className="text-xl"
                />
              ) : (
                <Link
                  to={to}
                  style={{ fontFamily: SERIF }}
                  className="min-w-0 truncate text-xl leading-tight after:absolute after:inset-0 after:content-[''] group-hover:text-brand-ink focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {project.name}
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
            <p className="mt-2 text-xs text-muted-foreground">{count}</p>
            <div className="mt-auto flex items-end justify-between gap-3 pt-6">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {updated ? `${updated} · ${by}` : "Nothing in it yet"}
              </p>
              <EditorDots docs={docs} />
            </div>
          </>
        )}
      </NotchCard>
    </Leaving>
  );
}

/* ---- Project table ----------------------------------------------------- */

/** Everything a project row needs from the page: the same handlers the card gets. */
export interface ProjectRowHandlers {
  leaving: boolean;
  onGone: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onKeep: () => void;
  onRename: (name: string) => void;
  renaming: boolean;
  onRenamingChange: (v: boolean) => void;
}

export const PROJECT_PAGE_SIZE = 10;

export function sortProjects(
  projects: Project[],
  docsOf: (id: string) => Doc[],
  by: ProjectSortKey,
): Project[] {
  const out = [...projects];
  if (by === "name") out.sort((a, b) => a.name.localeCompare(b.name));
  else
    out.sort(
      (a, b) => projectUpdatedMinutesAgo(a, docsOf(a.id)) - projectUpdatedMinutesAgo(b, docsOf(b.id)),
    );
  return out;
}

export function filterProjects(projects: Project[], q: string): Project[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return projects;
  return projects.filter((p) => p.name.toLowerCase().includes(needle));
}

/** Sort as plain text: "Sort by last updated · name". */
function ProjectSortText({
  value,
  onChange,
}: {
  value: ProjectSortKey;
  onChange: (v: ProjectSortKey) => void;
}) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Sort by</span>
      {(["updated", "name"] as ProjectSortKey[]).map((k, i) => (
        <span key={k} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>·</span>}
          <button
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={value === k}
            className={
              "px-1 py-0.5 underline-offset-4 hover:text-foreground " +
              (value === k ? "text-foreground underline" : "")
            }
          >
            {k === "updated" ? "last updated" : "name"}
          </button>
        </span>
      ))}
    </p>
  );
}

/** One row of the compact table, or the delete confirmation in its place. */
function ProjectRow({
  project,
  docs,
  to,
  h,
}: {
  project: Project;
  docs: Doc[];
  to: string;
  h: ProjectRowHandlers;
}) {
  const latest = latestDoc(docs);
  const by = latest ? personById(latest.editedBy) : null;
  const n = docs.length;
  return (
    <Leaving leaving={h.leaving} onGone={h.onGone} className="group" data-project={project.id}>
      {h.confirming ? (
        <ConfirmInline
          question={<>Delete “{project.name}”?</>}
          note={
            n > 0
              ? `Its ${n} document${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} back to Documents.`
              : "This can't be undone."
          }
          onConfirm={h.onConfirmDelete}
          onCancel={h.onKeep}
          className="bg-destructive/5 px-3 py-3"
        />
      ) : (
        <div className="flex items-center gap-4 py-3 hover:bg-muted/40">
          <div className="min-w-0 flex-1">
            {h.renaming ? (
              <InlineName
                value={project.name}
                onChange={h.onRename}
                editing
                onEditingChange={h.onRenamingChange}
                className="text-base"
                inputClassName="max-w-sm"
              />
            ) : (
              <Link
                to={to}
                style={{ fontFamily: SERIF }}
                className="block truncate text-base leading-tight hover:text-brand-ink"
              >
                {project.name}
              </Link>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
              {n} doc{n === 1 ? "" : "s"}
              {latest && <> · {relative(latest.editedMinutesAgo)}</>}
            </p>
          </div>
          <span className="hidden w-24 shrink-0 text-xs text-muted-foreground sm:block">
            {n} document{n === 1 ? "" : "s"}
          </span>
          <span className="hidden w-32 shrink-0 text-xs text-muted-foreground sm:block">
            {latest ? relative(latest.editedMinutesAgo) : "—"}
          </span>
          <span className="hidden w-36 shrink-0 text-xs text-muted-foreground md:block">
            {by ? <Editor person={by} /> : "—"}
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
 * "1–10 of 14 · Next" line. Search and sort come from the page so the
 * page stays the one source of truth for what is shown.
 */
export function ProjectTable({
  projects,
  total,
  docsOf,
  to,
  q,
  onQ,
  sort,
  onSort,
  page,
  onPage,
  handlers,
}: {
  /** Already filtered and sorted; the table only slices the page. */
  projects: Project[];
  /** Count before filtering, for the empty message. */
  total: number;
  docsOf: (id: string) => Doc[];
  to: string;
  q: string;
  onQ: (v: string) => void;
  sort: ProjectSortKey;
  onSort: (v: ProjectSortKey) => void;
  page: number;
  onPage: (n: number) => void;
  handlers: (project: Project) => ProjectRowHandlers;
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
        <ProjectSortText value={sort} onChange={onSort} />
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
            <ProjectRow key={p.id} project={p} docs={docsOf(p.id)} to={to} h={handlers(p)} />
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

/* ---- Dashed notched placeholder --------------------------------------- */

/**
 * A notched box outlined by a dashed line. A CSS border can't follow the
 * cut corners, so the outline is an SVG octagon sized to the box.
 */
export function DashedNotch({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const c = 10;
  const { w, h } = size;
  const points = [
    [c, 0.5],
    [w - c, 0.5],
    [w - 0.5, c],
    [w - 0.5, h - c],
    [w - c, h - 0.5],
    [c, h - 0.5],
    [0.5, h - c],
    [0.5, c],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <div ref={ref} className={cn("relative", className)}>
      {w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full text-border" width={w} height={h}>
          <polygon points={points} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
