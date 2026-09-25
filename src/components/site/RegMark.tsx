import { cn } from "~/lib/utils";

/** Registration mark: the crosshair a dyer uses to align stencil repeats. */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn("pointer-events-none absolute size-4 text-brand-ink opacity-60", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="8" cy="8" r="4" />
      <path d="M8 0v16M0 8h16" />
    </svg>
  );
}

/** Four marks at the corners of a `relative` parent. */
export function RegMarks() {
  return (
    <>
      <RegMark className="-left-2.5 -top-2.5" />
      <RegMark className="-right-2.5 -top-2.5" />
      <RegMark className="-bottom-2.5 -left-2.5" />
      <RegMark className="-bottom-2.5 -right-2.5" />
    </>
  );
}
