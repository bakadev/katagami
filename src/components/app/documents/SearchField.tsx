import { Search } from "lucide-react";

/** Search by title. */
export function SearchField({
  value,
  onChange,
  className = "",
  label = "Search documents by title",
  placeholder = "Search by title",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}) {
  return (
    <label className={"relative block " + className}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
