import { Link, useLocation, useSearchParams } from "react-router";
import type { HeaderTone } from "./DocHeader";

const OPTIONS: { tone: HeaderTone; label: string }[] = [
  { tone: "indigo-pattern", label: "A · Indigo + pattern" },
  { tone: "indigo", label: "B · Indigo plain" },
  { tone: "rail", label: "C · Rail" },
  { tone: "plain", label: "Current" },
];

/**
 * Round 5 exploration strip. Only rendered when the document URL carries a
 * `chrome` param; swaps the header tone on the same document.
 */
export function HeaderToneSwitcher({ current }: { current: HeaderTone }) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const hrefFor = (tone: HeaderTone) => {
    const next = new URLSearchParams(params);
    next.set("chrome", tone);
    return `${pathname}?${next.toString()}`;
  };
  return (
    <div className="flex h-9 items-center justify-between border-b border-border bg-background px-4 text-xs">
      <Link to="/design" className="text-muted-foreground hover:text-foreground">
        ← Explorations / Editor header
      </Link>
      <nav className="flex gap-1">
        {OPTIONS.map((o) => (
          <Link
            key={o.tone}
            to={hrefFor(o.tone)}
            aria-current={o.tone === current ? "page" : undefined}
            className={
              "rounded-sm px-2 py-0.5 " +
              (o.tone === current
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {o.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
