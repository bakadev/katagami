import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useRelativeTime } from "~/hooks/useRelativeTime";
import { cn } from "~/lib/utils";

export type ConnectionState = "connecting" | "connected" | "disconnected";
export type Permission = "edit" | "view";

export interface MetaLineProps {
  updatedAt: string | null;
  connection: ConnectionState;
  permission: Permission;
}

const CONNECTION_COPY: Record<ConnectionState, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Disconnected",
};

// Middle-dot glyph, decorative only — the sr-only fallback for screen readers
// is the separator's surrounding semantic structure (each token is its own span).
const DOT = "·";

/**
 * MetaLine — the one-line status strip under the document title.
 *
 * Three tokens: relative time, connection status, permission. Separated by
 * middle-dots so the whole row reads as a single sentence rather than a
 * toolbar. Uses `truncate` on the outer container so narrow headers lose the
 * right-most token first instead of wrapping to two lines.
 */
export function MetaLine({
  updatedAt,
  connection,
  permission,
}: MetaLineProps) {
  const relative = useRelativeTime(updatedAt);
  // Localized absolute timestamp for the tooltip. Memoized so a re-render
  // caused by `useRelativeTime`'s minute tick doesn't rebuild the string.
  const absolute = useMemo(() => {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [updatedAt]);

  const dotColor =
    connection === "connected"
      ? "bg-emerald-500"
      : connection === "disconnected"
        ? "bg-destructive"
        : "bg-muted-foreground";

  const timeToken =
    updatedAt === null || !relative ? (
      <span aria-label="Never updated">—</span>
    ) : (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/*
              A span (not a button) because this is a tooltip on information,
              not a click target. tabIndex=0 makes it focusable for keyboard
              tooltip reveal, and Radix handles the rest.
            */}
            <span
              tabIndex={0}
              className={cn(
                "cursor-help rounded-sm outline-none",
                "underline decoration-dotted decoration-muted-foreground/40 underline-offset-4",
                "transition-colors hover:text-foreground/80",
                "focus-visible:ring-2 focus-visible:ring-ring/60",
              )}
            >
              {relative}
            </span>
          </TooltipTrigger>
          {absolute ? (
            <TooltipContent side="bottom" sideOffset={6}>
              {absolute}
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center text-xs leading-none text-muted-foreground",
        "truncate whitespace-nowrap",
      )}
      // Not a list — it's prose-like. Give assistive tech a summary role.
      aria-label={`Updated ${relative || "never"}, ${CONNECTION_COPY[connection]}, ${permission === "edit" ? "Editing" : "View only"}`}
    >
      <span className="inline-flex items-center">
        <span className="text-muted-foreground/80">Updated&nbsp;</span>
        {timeToken}
      </span>

      <span aria-hidden className="mx-1.5 text-muted-foreground/40">
        {DOT}
      </span>

      <span className="inline-flex items-center gap-1.5">
        {/*
          The connection dot. A soft 3px halo ring conveys "live" for connected
          without needing motion. The pulse animation is reserved for the
          connecting state so it reads as activity, not noise.
        */}
        <span
          aria-hidden
          className={cn(
            "size-[6px] shrink-0 rounded-full",
            dotColor,
            connection === "connected" &&
              "shadow-[0_0_0_3px_rgb(16_185_129_/_0.18)]",
            connection === "disconnected" &&
              "shadow-[0_0_0_3px_var(--destructive)/18]",
            connection === "connecting" && "animate-pulse",
          )}
        />
        <span>{CONNECTION_COPY[connection]}</span>
      </span>

      <span aria-hidden className="mx-1.5 text-muted-foreground/40">
        {DOT}
      </span>

      <span>{permission === "edit" ? "Editing" : "View only"}</span>
    </div>
  );
}
