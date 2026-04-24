import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  FileText,
  History as HistoryIcon,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export type PanelTabIcon = "FileText" | "MessageSquare" | "Sparkles" | "History";

export interface PanelTabDescriptor {
  id: string;
  label: string;
  icon: PanelTabIcon;
  badge: number | null;
  hasNotification: boolean;
}

export interface PanelTabsProps {
  tabs: readonly PanelTabDescriptor[];
  active: string;
  onChange: (id: string) => void;
}

// Kept local so call sites only pass a string discriminator, not a component.
const ICON_MAP: Record<PanelTabIcon, LucideIcon> = {
  FileText,
  MessageSquare,
  Sparkles,
  History: HistoryIcon,
};

/**
 * Build the full aria-label for a tab. Inactive tabs collapse to icons, so we
 * bake the count into the label ("Comments, 3 unread") so screen-reader users
 * don't lose the information sighted users get from the visible badge.
 */
function buildAriaLabel(tab: PanelTabDescriptor): string {
  if (tab.badge != null && tab.badge > 0) {
    return `${tab.label}, ${tab.badge} unread`;
  }
  if (tab.hasNotification) {
    return `${tab.label}, new activity`;
  }
  return tab.label;
}

/**
 * PanelTabs — horizontal tab strip where the active tab *expands* to show its
 * label and optional count while inactive tabs collapse to icon-only wells.
 *
 * The motion is the point: `flex-grow` and `flex-basis` animate on the same
 * curve used by the theme tri-state so the whole app feels like a single
 * coordinated system. Icons stay put; the label + badge unfurl from the right
 * with a short opacity/translate reveal so the width animation doesn't look
 * like a simple text pop-in.
 *
 * Accessibility:
 *   - `role="tablist"` on the container, `role="tab"` per button, roving
 *     tabindex so Tab enters once and arrow keys traverse.
 *   - Home/End jump to the first/last tab.
 *   - Every tab has an aria-label that folds the count or notification state
 *     into the announcement, since inactive tabs are visually icon-only.
 *
 * Motion:
 *   - All transitions use standard Tailwind utilities; the global
 *     `prefers-reduced-motion` rule in styles.css disables them for users
 *     who request reduced motion.
 */
export function PanelTabs({ tabs, active, onChange }: PanelTabsProps) {
  const listId = useId();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTabAt = useCallback((index: number) => {
    const btn = buttonRefs.current[index];
    if (btn) {
      btn.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = tabs.length - 1;
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowRight":
          nextIndex = index === last ? 0 : index + 1;
          break;
        case "ArrowLeft":
          nextIndex = index === 0 ? last : index - 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = last;
          break;
        default:
          return;
      }

      if (nextIndex != null) {
        event.preventDefault();
        const target = tabs[nextIndex];
        if (target) {
          focusTabAt(nextIndex);
          // Activation-follows-focus: matches the Radix Tabs default and the
          // way other segmented controls in this app behave.
          onChange(target.id);
        }
      }
    },
    [tabs, focusTabAt, onChange],
  );

  // CSS can't smoothly animate between `40px` and `auto` / `max-content`, so
  // we measure each tab's natural content width up-front and store it. The
  // explicit pixel value lets `transition-[width]` interpolate cleanly. The
  // signature is keyed on the visible content (label + badge + notification
  // state) so the effect re-runs when those change.
  const measureKey = tabs
    .map((t) => `${t.id}:${t.label}:${t.badge ?? ""}:${t.hasNotification ? 1 : 0}`)
    .join("|");
  const [tabWidths, setTabWidths] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const next: Record<string, number> = {};
    tabs.forEach((tab, i) => {
      const btn = buttonRefs.current[i];
      if (btn) {
        // scrollWidth reports the unclipped content width even when the
        // button is currently constrained to 40px via overflow-hidden.
        // +1 for sub-pixel rounding.
        next[tab.id] = btn.scrollWidth + 1;
      }
    });
    setTabWidths(next);
    // The `measureKey` digest stands in for `tabs` because `tabs` is a new
    // array reference on every parent render and would re-fire the effect
    // unnecessarily. Whenever the digest changes, the underlying content
    // changed and we genuinely need to remeasure.
  }, [measureKey]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        aria-label="Panel sections"
        id={listId}
        className={cn(
          "flex w-full items-center gap-1 rounded-md border border-border bg-muted/40 p-1",
          "shadow-[inset_0_1px_0_rgb(0_0_0/0.02)]",
        )}
      >
        {tabs.map((tab, index) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = tab.id === active;
          // We always render the badge slot if the tab has a positive badge
          // count — both for measurement honesty (scrollWidth includes it)
          // and because users want to see "3" on the active Comments tab.
          const hasBadge = tab.badge != null && tab.badge > 0;
          const ariaLabel = buildAriaLabel(tab);

          // Active = measured natural width; inactive = 40px fixed slot.
          // Falls back to 40px on the first render before measurement runs.
          const targetWidth = isActive ? (tabWidths[tab.id] ?? 40) : 40;

          const buttonNode = (
            <button
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${listId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-label={ariaLabel}
              tabIndex={isActive ? 0 : -1}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => {
                if (!isActive) onChange(tab.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{ width: `${targetWidth}px` }}
              className={cn(
                // Base layout — h-8 gives enough room for label + 14px icon
                // without fighting the parent rail. overflow-hidden clips
                // the inner content while the width animation runs.
                "relative inline-flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-[5px] px-2",
                "cursor-pointer select-none outline-none",
                "transition-[width,background-color,color,box-shadow] duration-200 ease-in-out",
                isActive
                  ? "justify-start bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                // Focus ring sits inside the rail so it never clips.
                "focus-visible:ring-2 focus-visible:ring-ring/60",
              )}
            >
              <span className="relative inline-flex shrink-0 items-center justify-center">
                <Icon className="size-[14px]" strokeWidth={2} aria-hidden />
                {/* Notification dot: 6px red pip, ringed in the rail color so
                    it doesn't smear into the icon when they overlap. Hidden on
                    the active tab because the expanded badge carries the
                    unread count already. */}
                {!isActive && tab.hasNotification ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -top-0.5 -right-1 size-1.5 rounded-full bg-red-500",
                      "ring-2 ring-background",
                    )}
                  />
                ) : null}
              </span>

              {/* Label + badge are always in the DOM (so scrollWidth gives a
                  stable measurement). The button's overflow-hidden clips them
                  when collapsed; the width transition reveals them as it grows.
                  aria-hidden because the visible button label duplicates info
                  already in the button's aria-label. */}
              <span
                aria-hidden
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
              >
                <span className="text-sm font-medium leading-none">
                  {tab.label}
                </span>
                {hasBadge ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center rounded-full bg-muted px-1.5 py-0.5",
                      "text-[10px] font-medium leading-none text-muted-foreground tabular-nums",
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </span>
            </button>
          );

          // Only inactive tabs need a tooltip — the active tab's label is
          // already visible. Wrapping in Tooltip when inactive also avoids
          // Radix opening a tooltip right as you click to activate.
          if (isActive) {
            return <div key={tab.id}>{buttonNode}</div>;
          }

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>{buttonNode}</TooltipTrigger>
              <TooltipContent sideOffset={6}>{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
