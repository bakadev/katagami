import { useId } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export type Theme = "light" | "dark" | "system";

export interface ThemeTriStateProps {
  value: Theme;
  onChange: (next: Theme) => void;
}

interface Option {
  value: Theme;
  label: string;
  icon: typeof Sun;
}

const OPTIONS: readonly Option[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "Match system", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
];

/**
 * ThemeTriState — a segmented control for picking light / system / dark.
 *
 * Rendered as three independent `<button aria-pressed>` controls inside a
 * shared track. A sliding background "thumb" indicates the selected option and
 * animates between positions on change — the one subtle flourish in the whole
 * dropdown.
 *
 * Each button is wrapped in a Tooltip for the textual label; icon-only buttons
 * still pass accessibility because the button itself has an `aria-label`.
 */
export function ThemeTriState({ value, onChange }: ThemeTriStateProps) {
  const groupId = useId();
  const index = OPTIONS.findIndex((o) => o.value === value);
  // Width of one slot = 100% / 3; thumb slides in multiples of that.
  const thumbOffset = `calc(${index} * (100% / 3))`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="group"
        aria-label="Theme"
        className={cn(
          "relative inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5",
          "shadow-[inset_0_1px_0_rgb(0_0_0/0.02)]",
        )}
      >
        {/* Sliding thumb — the selected background pill */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 rounded-[5px] bg-secondary",
            "shadow-sm ring-1 ring-border/60",
            "transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          )}
          style={{
            width: "calc((100% - 4px) / 3)",
            transform: `translateX(${thumbOffset})`,
          }}
        />

        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.value === value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  id={`${groupId}-${opt.value}`}
                  aria-label={opt.label}
                  aria-pressed={isActive}
                  data-state={isActive ? "active" : "inactive"}
                  onClick={() => {
                    if (!isActive) onChange(opt.value);
                  }}
                  className={cn(
                    // Size + layout — each button is an even third of the track
                    "relative z-10 inline-flex h-6 w-7 items-center justify-center rounded-[5px]",
                    "cursor-pointer outline-none",
                    // Icon colors transition between states
                    "transition-colors duration-150 ease-out",
                    isActive
                      ? "text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    // Focus ring inside the track — clipped gracefully
                    "focus-visible:ring-2 focus-visible:ring-ring/60",
                  )}
                >
                  <Icon className="size-[14px]" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{opt.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
