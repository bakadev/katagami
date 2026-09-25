import { Link, useLocation } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";

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
        <nav className="flex items-center gap-7 text-sm text-muted-foreground">
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

function StencilMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 text-[#274b8f] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
