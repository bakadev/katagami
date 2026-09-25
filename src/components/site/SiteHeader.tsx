import { Link, useLocation } from "react-router";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { StencilMark } from "~/components/site/StencilMark";

/**
 * Shared header for the teams-side pages: wordmark (root link), Pricing,
 * Contact, Start a spec. The audience switch lives in the UtilityBar above.
 * The developer page keeps its own monospace header.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NAV: { label: string; to: string }[] = [
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export function SiteHeader() {
  const { pathname } = useLocation();
  const { create, loading, error } = useCreateDoc();

  return (
    <header className="mx-auto max-w-6xl px-6 py-6 md:px-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <StencilMark />
          <span style={{ fontFamily: SERIF }} className="text-xl">
            Katagami
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground sm:gap-7">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={
                  "hidden sm:inline " +
                  (active ? "text-foreground" : "hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={create}
            disabled={loading}
            className="bg-[#274b8f] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            style={{ clipPath: NOTCH }}
          >
            {loading ? "Opening…" : "Start a spec"}
          </button>
          {/* Phone: everything else lives in one menu, including the links
              the utility bar hides at this width. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="inline-flex size-9 items-center justify-center rounded-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {NAV.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link to="/developers">For developers</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/signin">Sign in</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-right text-sm text-destructive">
          Couldn't create the doc: {error}
        </p>
      )}
    </header>
  );
}
