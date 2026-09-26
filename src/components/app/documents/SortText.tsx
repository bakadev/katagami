/** Sort as plain text: "Sort by last edited · title". Generic over the keys. */
export function SortText<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K;
  onChange: (v: K) => void;
  /** In display order: key and label. */
  options: readonly (readonly [K, string])[];
}) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Sort by</span>
      {options.map(([k, label], i) => (
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
            {label}
          </button>
        </span>
      ))}
    </p>
  );
}

export const DOC_SORT_OPTIONS = [
  ["edited", "last edited"],
  ["title", "title"],
] as const;

export const PROJECT_SORT_OPTIONS = [
  ["updated", "last updated"],
  ["name", "name"],
] as const;
