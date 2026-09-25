import { cn } from "~/lib/utils";

/** The Katagami mark: one asanoha (hemp leaf) cell, cut from indigo paper. */
export function StencilMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-5 text-brand-ink", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
