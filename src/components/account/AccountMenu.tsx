import { Link, useLocation } from "react-router";
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Check,
  Files,
  LogIn,
  LogOut,
  Palette,
  PenLine,
  Settings,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { ThemeTriState, type Theme } from "~/components/avatar-menu/ThemeTriState";
import { ThemeContext } from "~/lib/theme/ThemeProvider";
import { useAuth } from "~/lib/auth/AuthProvider";
import { updateMe } from "~/lib/api/auth";
import { CURSOR_COLORS } from "~/lib/user/names";
import { cn } from "~/lib/utils";

export interface AccountMenuProps {
  /** The local editing identity: the random name, or the account name once signed in. */
  identity: { name: string; color: string };
  /** Called after a new display name is accepted (and saved to the account, when signed in). */
  onNameChange: (nextName: string) => void;
  /** Called after a swatch is picked (and saved to the account, when signed in). */
  onColorChange: (nextColor: string) => void;
  onSignOut?: () => void;
  /** Theme controls; omitted when the host has no ThemeProvider (falls back to context). */
  theme?: Theme;
  onThemeChange?: (next: Theme) => void;
  trigger: ReactNode;
  /**
   * Force the menu open at mount. Test-only seam, not part of the public API.
   * @internal
   */
  __testDefaultOpen?: boolean;
}

const NAME_MIN = 1;
const NAME_MAX = 40;

type View = "menu" | "rename" | "colour";

/**
 * AccountMenu: the one account dropdown, shared by the editor's avatar button
 * and the /documents header's initials tile.
 *
 * Content, top to bottom: identity header, theme, then "Change name" and
 * "Change colour" (both swap the dropdown content to an inline view instead
 * of opening a dialog, matching the title-editor and snapshot popovers),
 * then destinations (Your documents, Settings, Admin), then sign in/out.
 *
 * Who is signed in comes from `useAuth()`; the menu works outside the
 * provider too (signed-out shape). Name and colour edits update the local
 * identity through the callbacks, and when signed in also persist to the
 * account via `updateMe` followed by `refresh()`.
 */
export function AccountMenu({
  identity,
  onNameChange,
  onColorChange,
  onSignOut,
  theme: themeProp,
  onThemeChange: onThemeChangeProp,
  trigger,
  __testDefaultOpen,
}: AccountMenuProps) {
  const [open, setOpen] = useState(__testDefaultOpen ?? false);
  const [view, setView] = useState<View>("menu");
  const auth = useAuth();
  const themeCtx = useContext(ThemeContext);
  const theme = themeProp ?? themeCtx?.theme ?? "system";
  const onThemeChange = onThemeChangeProp ?? themeCtx?.setTheme ?? (() => undefined);
  const location = useLocation();
  const signInTo = `/signin?next=${encodeURIComponent(location.pathname + location.search)}`;

  // Reset to the menu view every time the dropdown closes so reopening
  // always lands on the canonical surface.
  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  const persist = async (patch: { name?: string; color?: string }) => {
    if (!auth.user) return;
    try {
      await updateMe(patch);
      await auth.refresh();
    } catch {
      toast.error("Couldn't save to your account");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[260px] p-0">
        {view === "menu" && (
          <MenuView
            identity={identity}
            account={auth.user ? { name: auth.user.name, email: auth.user.email } : null}
            isAdmin={auth.isAdmin}
            signInTo={signInTo}
            theme={theme}
            onThemeChange={onThemeChange}
            onRenameClick={() => setView("rename")}
            onColourClick={() => setView("colour")}
            onSignOut={() => {
              setOpen(false);
              onSignOut?.();
            }}
          />
        )}
        {view === "rename" && (
          <RenameView
            initialName={identity.name}
            onCancel={() => setView("menu")}
            onSave={(next) => {
              onNameChange(next);
              void persist({ name: next });
              setOpen(false);
            }}
          />
        )}
        {view === "colour" && (
          <ColourView
            current={identity.color}
            onCancel={() => setView("menu")}
            onPick={(color) => {
              onColorChange(color);
              void persist({ color });
              setOpen(false);
            }}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Menu view: the default content of the dropdown.
// ---------------------------------------------------------------------------

interface MenuViewProps {
  identity: { name: string; color: string };
  account: { name: string; email: string } | null;
  isAdmin: boolean;
  signInTo: string;
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  onRenameClick: () => void;
  onColourClick: () => void;
  onSignOut: () => void;
}

const ITEM = "gap-2 px-2 py-1.5 text-sm";
const ICON = "size-4 text-muted-foreground";

function MenuView({
  identity,
  account,
  isAdmin,
  signInTo,
  theme,
  onThemeChange,
  onRenameClick,
  onColourClick,
  onSignOut,
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
        {account ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight text-foreground">
              {account.name}
            </div>
            <div className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
              {account.email}
            </div>
          </div>
        ) : (
          <div className="inline-flex min-w-0 flex-1 items-baseline justify-between gap-2">
            <div className="truncate text-sm font-semibold leading-tight text-foreground">
              {identity.name}
            </div>
            <div className="truncate text-xs tracking-wider leading-tight text-muted-foreground">
              (You)
            </div>
          </div>
        )}
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 2. Theme row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-sm text-foreground">Theme</span>
        <ThemeTriState value={theme} onChange={onThemeChange} />
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 3. Identity edits: both swap the content instead of closing. */}
      <div className="p-1">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onRenameClick();
          }}
          className={ITEM}
        >
          <PenLine className={ICON} />
          <span>Change name</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onColourClick();
          }}
          className={ITEM}
        >
          <Palette className={ICON} />
          <span>Change colour</span>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 4. Destinations */}
      <div className="p-1">
        {account && (
          <DropdownMenuItem asChild className={ITEM}>
            <Link to="/documents">
              <Files className={ICON} />
              <span>Your documents</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled aria-disabled className={ITEM}>
          <Settings className={ICON} />
          <span>Settings</span>
          <DropdownMenuShortcut className="tracking-normal">Soon</DropdownMenuShortcut>
        </DropdownMenuItem>
        {account && isAdmin && (
          <DropdownMenuItem asChild className={ITEM}>
            <Link to="/admin">
              <Shield className={ICON} />
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
      </div>

      <DropdownMenuSeparator className="my-0" />

      {/* 5. Session */}
      <div className="p-1">
        {account ? (
          <DropdownMenuItem onSelect={onSignOut} className={ITEM}>
            <LogOut className={ICON} />
            <span>Sign out</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className={ITEM}>
            <Link to={signInTo}>
              <LogIn className={ICON} />
              <span>Sign in</span>
            </Link>
          </DropdownMenuItem>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Rename view: compact form swapped into the same dropdown content.
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
        Change your name
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
        <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive">
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

// ---------------------------------------------------------------------------
// Colour view: the cursor palette as a swatch grid, current one marked.
// ---------------------------------------------------------------------------

interface ColourViewProps {
  current: string;
  onCancel: () => void;
  onPick: (color: string) => void;
}

function ColourView({ current, onCancel, onPick }: ColourViewProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-xs font-medium text-foreground">Change your colour</div>
      <div
        role="radiogroup"
        aria-label="Cursor colour"
        className="grid grid-cols-5 gap-2 py-1"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      >
        {CURSOR_COLORS.map((color) => {
          const selected = color.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Colour ${color}`}
              onClick={() => onPick(color)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full outline-none",
                "transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                selected && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover",
              )}
              style={{ backgroundColor: color }}
            >
              {selected && <Check aria-hidden className="size-4 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Shows on your caret and beside your comments.
      </p>
      <div className="mt-1 flex items-center justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
