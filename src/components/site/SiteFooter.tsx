import { Link } from "react-router";

/**
 * Shared footer for the teams-side pages (home, pricing, legal, 404).
 * The developer page keeps its own one-line monospace footer on purpose.
 *
 * Links only point at pages that exist. Add to LINKS as pages ship.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const LINKS: { title: string; items: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Pricing", to: "/pricing" },
      { label: "For developers", to: "/developers" },
    ],
  },
  {
    title: "Company",
    items: [{ label: "Contact", to: "/contact" }],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <StencilMark />
            <span style={{ fontFamily: SERIF }} className="text-lg">
              Katagami
            </span>
          </Link>
          <p className="mt-3 max-w-[36ch] text-sm text-muted-foreground">
            型紙, a stencil the whole team fills in. One spec, in the open, in
            plain Markdown.
          </p>
        </div>
        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-medium">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pb-8 text-xs text-muted-foreground md:px-10">
        <span>© {new Date().getFullYear()} Katagami</span>
        <span>Made for teams that argue in the margins.</span>
      </div>
    </footer>
  );
}

function StencilMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 text-[#274b8f] dark:text-blue-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
