import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * A notched box outlined by a dashed line. A CSS border can't follow the
 * cut corners, so the outline is an SVG octagon sized to the box.
 */
export function DashedNotch({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const c = 10;
  const { w, h } = size;
  const points = [
    [c, 0.5],
    [w - c, 0.5],
    [w - 0.5, c],
    [w - 0.5, h - c],
    [w - c, h - 0.5],
    [c, h - 0.5],
    [0.5, h - c],
    [0.5, c],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <div ref={ref} className={cn("relative", className)}>
      {w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full text-border" width={w} height={h}>
          <polygon points={points} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
