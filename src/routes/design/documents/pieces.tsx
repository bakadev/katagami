import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Copy,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMarks } from "~/components/site/RegMark";
import { StencilMark } from "~/components/site/StencilMark";
import { ME, PROJECTS, UNCLAIMED_COUNT, WORKSPACES, type Person, type SortKey } from "./data";

/**
 * Pieces the three Round 7 options share: the signed-in app header, the
 * claim strip, the empty state, search, sort, share and overflow. Kept
 * together so the options differ in layout, not in how a chip is drawn.
 */

export const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

/** `?empty=1` shows the empty state; the toggle in `AppHeader` flips it. */
export function useEmptyState(): [boolean, () => void] {
  const [params, setParams] = useSearchParams();
  const empty = params.get("empty") === "1";
  const toggle = () => {
    const next = new URLSearchParams(params);
    if (empty) next.delete("empty");
    else next.set("empty", "1");
    setParams(next, { replace: true });
  };
  return [empty, toggle];
}

/** `?plan=free` shows the Free tier (option D); the toggle in `AppHeader` flips it. */
export type Plan = "free" | "team";
export function usePlan(): [Plan, () => void] {
  const [params, setParams] = useSearchParams();
  const plan: Plan = params.get("plan") === "free" ? "free" : "team";
  const toggle = () => {
    const next = new URLSearchParams(params);
    if (plan === "free") next.delete("plan");
    else next.set("plan", "free");
    setParams(next, { replace: true });
  };
  return [plan, toggle];
}

/** "Plan: Free / Team" reviewer switch, beside "Show empty state". Exploration chrome. */
export function PlanToggle({ plan, onToggle }: { plan: Plan; onToggle: () => void }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Plan:</span>
      {(["free", "team"] as Plan[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => plan !== k && onToggle()}
          aria-pressed={plan === k}
          className={
            "px-1 underline-offset-4 hover:text-foreground " +
            (plan === k ? "text-foreground underline" : "")
          }
        >
          {k === "free" ? "Free" : "Team"}
        </button>
      ))}
    </p>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * The signed-in app header: wordmark (links to the documents home) and the
 * avatar menu whose first item is "Your documents". Beside it the reviewer's
 * "Show empty state" switch, which is exploration chrome, not product.
 */
export function AppHeader({
  empty,
  onToggleEmpty,
  homeTo = "#",
  children,
}: {
  empty: boolean;
  onToggleEmpty: () => void;
  /** Where the wordmark and "Your documents" go. */
  homeTo?: string;
  /** Extra reviewer chrome (option D's plan switch). */
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-10">
      <Link to={homeTo} className="flex items-center gap-2.5" aria-label="Your documents">
        <StencilMark />
        <span style={{ fontFamily: SERIF }} className="text-xl">
          Katagami
        </span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        {children}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={empty}
            onChange={onToggleEmpty}
            className="size-3.5 accent-brand"
          />
          Show empty state
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            style={{ fontFamily: SERIF }}
            className="notch-sm flex size-9 items-center justify-center bg-brand-tint text-sm text-brand-ink outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {initialsOf(ME.name)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {ME.name}
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={homeTo}>Your documents</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/">Marketing home</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

/** Primary "New spec" button, notched, indigo. */
export function NewSpecButton({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={
        "notch inline-flex h-10 items-center gap-2 bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        className
      }
    >
      <Plus className="size-4" aria-hidden />
      New spec
    </Link>
  );
}

/** Workspace switcher: only rendered when there is more than one workspace. */
export function WorkspaceSwitcher() {
  const [current, setCurrent] = useState(WORKSPACES[0]!.id);
  if (WORKSPACES.length < 2) return null;
  const ws = WORKSPACES.find((w) => w.id === current) ?? WORKSPACES[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="notch-sm inline-flex h-10 items-center gap-2 border-0 bg-border p-px text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="notch-sm-in flex h-full items-center gap-2 bg-card px-3 hover:bg-muted/60">
          <span className="size-2 bg-brand-ink" aria-hidden />
          {ws.name}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Workspace
        </DropdownMenuLabel>
        {WORKSPACES.map((w) => (
          <DropdownMenuItem key={w.id} onSelect={() => setCurrent(w.id)}>
            <span className="flex-1">{w.name}</span>
            {w.id === current && <Check className="size-3.5" aria-hidden />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground">New workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The slim indigo-tinted strip about documents still on this browser. */
/** With `onDismiss` it gets a close button (option D: persists until dismissed). */
export function ClaimBanner({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <NotchCard tone="indigo" fill="tint" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 text-sm">
      <p className="flex items-center gap-3">
        <StencilMark className="size-4 shrink-0" />
        <span>
          {UNCLAIMED_COUNT} documents from before you signed in are still on this browser.
        </span>
      </p>
      <span className="flex items-center gap-2">
        <Link
          to="/claim"
          className="font-medium text-brand-ink underline underline-offset-4 hover:opacity-80"
        >
          Bring them in
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            title="Dismiss"
            className="-mr-1.5 inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-brand-ink/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </span>
    </NotchCard>
  );
}

/** Komon field with the mark. Used by all three options when there is nothing to list. */
export function EmptyState({ prominent = false }: { prominent?: boolean }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="komon pointer-events-none absolute inset-0 text-brand-ink opacity-[0.12] dark:opacity-[0.2]"
      />
      <div
        className={
          "relative mx-auto flex max-w-md flex-col items-center px-6 text-center " +
          (prominent ? "py-24 sm:py-32" : "py-16 sm:py-20")
        }
      >
        <div className="relative">
          <RegMarks />
          <NotchCard tone="indigo" className="flex size-16 items-center justify-center">
            <StencilMark className="size-7" />
          </NotchCard>
        </div>
        <h2
          style={{ fontFamily: SERIF }}
          className={"mt-8 leading-tight " + (prominent ? "text-3xl" : "text-2xl")}
        >
          Nothing cut yet.
        </h2>
        <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
          Start a spec, or bring in the ones on this browser.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <NewSpecButton />
          <Link to="/claim" className="text-sm text-brand-ink underline underline-offset-4">
            Bring in {UNCLAIMED_COUNT} from this browser
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Search by title. */
export function SearchField({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={"relative block " + className}>
      <span className="sr-only">Search documents by title</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title"
        className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

/** Sort: last edited or title. */
export function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const label = value === "edited" ? "Last edited" : "Title";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 border border-border bg-background px-3 text-sm outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">Sort</span>
        <span>{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {(["edited", "title"] as SortKey[]).map((k) => (
          <DropdownMenuItem key={k} onSelect={() => onChange(k)}>
            <span className="flex-1">{k === "edited" ? "Last edited" : "Title"}</span>
            {k === value && <Check className="size-3.5" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Sort as plain text (option A's control): "Sort by last edited · title". */
export function SortText({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Sort by</span>
      {(["edited", "title"] as SortKey[]).map((k, i) => (
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
            {k === "edited" ? "last edited" : "title"}
          </button>
        </span>
      ))}
    </p>
  );
}

/** Quiet copy-share-link icon button. Flashes a check for a moment. */
export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy share link for ${title}`}
      title="Copy share link"
      onClick={() => {
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {done ? <Check className="size-4 text-brand-ink" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
    </button>
  );
}

/** Row overflow: Move to project (visual only), copy link, rename. */
export function RowMenu({ title, currentProjectId }: { title: string; currentProjectId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${title}`}
        className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to project</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            {PROJECTS.map((p) => (
              <DropdownMenuItem key={p.id}>
                <span className="flex-1">{p.name}</span>
                {p.id === currentProjectId && <Check className="size-3.5" aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">New project…</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>
          <Copy className="size-3.5" aria-hidden />
          Copy share link
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Pencil className="size-3.5" aria-hidden />
          Rename
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Name plus the person's small colour dot. */
/** Callers set the display class (`inline-flex`, `hidden sm:inline-flex`) so it can be hidden per breakpoint. */
export function Editor({ person, className = "inline-flex" }: { person: Person; className?: string }) {
  return (
    <span className={"items-center gap-2 " + className}>
      <span
        aria-hidden
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ background: person.color }}
      />
      {person.name}
    </span>
  );
}

/** Inline-rename affordance for a project name: pencil only, no behaviour. */
export function ProjectName({ children }: { children: ReactNode }) {
  return (
    <span className="group/name inline-flex items-center gap-2">
      <span style={{ fontFamily: SERIF }} className="text-lg">
        {children}
      </span>
      <button
        type="button"
        aria-label="Rename project"
        title="Rename project"
        className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/name:opacity-100"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}
