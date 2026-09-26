import { Link, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { StencilMark } from "~/components/site/StencilMark";
import { useAuth } from "~/lib/auth/AuthProvider";
import { initialsOf } from "~/lib/user/initials";
import { SERIF } from "./serif";

/**
 * The signed-in app header: wordmark linking to the documents home, and on
 * the right the person's initials opening the account menu. Ported from the
 * Round 7 option D exploration, minus the reviewer switches.
 */
export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-10">
      <Link to="/documents" className="flex items-center gap-2.5" aria-label="Your documents">
        <StencilMark />
        <span style={{ fontFamily: SERIF }} className="text-xl">
          Katagami
        </span>
      </Link>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            style={{ fontFamily: SERIF }}
            className="notch-sm flex size-9 items-center justify-center bg-brand-tint text-sm text-brand-ink outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {initialsOf(user.name)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              <span className="block truncate text-foreground">{user.name}</span>
              <span className="block truncate">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/documents">Your documents</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/">Marketing home</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void onSignOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
