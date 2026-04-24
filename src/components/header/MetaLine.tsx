import { useMemo } from "react";
import { Clock } from "lucide-react";
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

/**
 * MetaLine — compact icon row for relative-time + connection status.
 *
 * Designed to sit inline next to the title (not on its own row). Two tokens:
 *
 *   - Clock icon + relative time text (tooltip = absolute timestamp)
 *   - Pulsating dot, color-coded by connection state (tooltip = status word)
 *
 * The Edit/Preview toggle in the header conveys permission already, so we
 * intentionally drop the "Editing"/"View only" text token here.
 */
export function MetaLine({ updatedAt, connection }: MetaLineProps) {
  const relative = useRelativeTime(updatedAt);
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

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex shrink-0 items-center gap-2.5 text-xs text-muted-foreground"
        aria-label={`Updated ${relative || "never"}, ${CONNECTION_COPY[connection]}`}
      >
        {/* Clock + relative time */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Clock aria-hidden className="size-3.5" strokeWidth={1.75} />
              <span>
                {updatedAt === null || !relative ? "—" : relative}
              </span>
            </span>
          </TooltipTrigger>
          {absolute ? (
            <TooltipContent side="bottom" sideOffset={6}>
              {absolute}
            </TooltipContent>
          ) : null}
        </Tooltip>

        {/* Connection status — pulsating dot only, copy in tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              aria-label={CONNECTION_COPY[connection]}
              className="inline-flex items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  dotColor,
                  // Pulse on connected so it reads as "live", and on
                  // connecting so it reads as activity. Disconnected stays
                  // static — no motion to avoid a panic-y feel.
                  connection === "connected" &&
                    "shadow-[0_0_0_3px] shadow-emerald-500/20 motion-safe:animate-pulse",
                  connection === "connecting" && "motion-safe:animate-pulse",
                  connection === "disconnected" &&
                    "shadow-[0_0_0_3px] shadow-destructive/20",
                )}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {CONNECTION_COPY[connection]}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
