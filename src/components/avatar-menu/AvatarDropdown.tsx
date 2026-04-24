import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Download, LogIn, PenLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { ThemeTriState, type Theme } from "./ThemeTriState";
import { cn } from "~/lib/utils";

export interface AvatarDropdownProps {
  identity: { name: string; color: string };
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  onRenameSave: (nextName: string) => void;
  onDownloadClick: () => void;
  trigger: ReactNode;
  /**
   * Force the menu open at mount. Test-only seam — not part of the public API.
   * @internal
   */
  __testDefaultOpen?: boolean;
}

const NAME_MIN = 1;
const NAME_MAX = 40;

/**
 * AvatarDropdown — top-right user menu with an inline rename form.
 *
 * The dropdown content has two views, switched by local state:
 *   - "menu": identity header + theme + actions + log-in row
 *   - "rename": compact form for choosing a new display name
 *
 * Keeping the rename inside the same Radix popover (rather than opening a
 * separate Dialog) means the visual idiom matches the title-editor and
 * save-snapshot popovers — every "rename a thing" affordance feels the
 * same. Cancel returns to the menu view; Save submits and closes the
 * dropdown.
 */
export function AvatarDropdown({
  identity,
  theme,
  onThemeChange,
  onRenameSave,
  onDownloadClick,
  trigger,
  __testDefaultOpen,
}: AvatarDropdownProps) {
  const [open, setOpen] = useState(__testDefaultOpen ?? false);
  const [view, setView] = useState<"menu" | "rename">("menu");

  // Reset to the menu view every time the dropdown closes so reopening
  // always lands on the canonical surface.
  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[260px] p-0"
      >
        {view === "menu" ? (
          <MenuView
            identity={identity}
            theme={theme}
            onThemeChange={onThemeChange}
            onRenameClick={() => setView("rename")}
            onDownloadClick={() => {
              setOpen(false);
              onDownloadClick();
            }}
          />
        ) : (
          <RenameView
            initialName={identity.name}
            onCancel={() => setView("menu")}
            onSave={(next) => {
              onRenameSave(next);
              setOpen(false);
            }}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Menu view — the default content of the dropdown.
// ---------------------------------------------------------------------------

interface MenuViewProps {
  identity: { name: string; color: string };
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  onRenameClick: () => void;
  onDownloadClick: () => void;
}

function MenuView({
  identity,
  theme,
  onThemeChange,
  onRenameClick,
  onDownloadClick,
}: MenuViewProps) {
  return (
    <>
      {/* 1. Identity header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span
          aria-hidden
          className="relative size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
          style={{ backgroundColor: identity.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight text-foreground">
            {identity.name}
          </div>
          <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
            You
          </div>
        </div>
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 2. Theme row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-sm text-foreground">Theme</span>
        <ThemeTriState value={theme} onChange={onThemeChange} />
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 3. Primary actions */}
      <div className="p-1">
        <DropdownMenuItem
          onSelect={(e) => {
            // Keep the popover open — we're swapping content, not closing.
            e.preventDefault();
            onRenameClick();
          }}
          className="gap-2 px-2 py-1.5 text-sm"
        >
          <PenLine className="size-4 text-muted-foreground" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            queueMicrotask(onDownloadClick);
          }}
          className="gap-2 px-2 py-1.5 text-sm"
        >
          <Download className="size-4 text-muted-foreground" />
          <span>Download as Markdown</span>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 4. Disabled "Log in" with tooltip */}
      <div className="p-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="presentation"
                tabIndex={-1}
                className="block rounded-md outline-none"
              >
                <DropdownMenuItem
                  disabled
                  className="gap-2 px-2 py-1.5 text-sm"
                  onSelect={(e) => e.preventDefault()}
                >
                  <LogIn className="size-4 text-muted-foreground" />
                  <span>Log in</span>
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Authentication coming in a future phase
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Rename view — compact form swapped into the same dropdown content.
// ---------------------------------------------------------------------------

interface RenameViewProps {
  initialName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}

function RenameView({ initialName, onCancel, onSave }: RenameViewProps) {
  const [draft, setDraft] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Focus + select all on mount.
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
    return () => clearTimeout(t);
  }, []);

  const submit = () => {
    const trimmed = draft.trim();
    if (trimmed.length < NAME_MIN) {
      setError("Name can't be empty.");
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setError(`Name must be ${NAME_MAX} characters or fewer.`);
      inputRef.current?.focus();
      return;
    }
    onSave(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2 p-3"
    >
      <label htmlFor={inputId} className="text-xs font-medium text-foreground">
        Rename yourself
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
        maxLength={NAME_MAX * 2}
        className={cn(
          "h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          error
            ? "border-destructive/60 focus-visible:border-destructive"
            : "border-input focus-visible:border-ring",
        )}
      />
      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {NAME_MIN}–{NAME_MAX} characters. Visible to collaborators on cursors and comments.
        </p>
      )}
      <div className="mt-1 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save
        </Button>
      </div>
    </form>
  );
}
