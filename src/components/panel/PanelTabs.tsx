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

  // ---- Measure each tab's natural "active" width ----
  // CSS can't smoothly interpolate between `40px` and `auto`. Solution: render
  // each tab once in its expanded form via a hidden ghost row, capture the
  // resolved pixel width with useLayoutEffect, and feed those pixel values
  // straight into `grid-template-columns`. The grid transition then runs
  // between two pixel lengths in every direction, which animates cleanly.
  const ghostRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const measureKey = tabs
    .map((t) => `${t.id}:${t.label}:${t.badge ?? ""}:${t.hasNotification ? 1 : 0}`)
    .join("|");
  const [measuredWidths, setMeasuredWidths] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const next: Record<string, number> = {};
    tabs.forEach((tab, i) => {
      const node = ghostRefs.current[i];
      if (node) {
        // Add 1px for sub-pixel rounding so the active button never clips its
        // own content during the transition.
        next[tab.id] = Math.ceil(node.getBoundingClientRect().width) + 1;
      }
    });
    setMeasuredWidths(next);
  }, [measureKey]);

  const gridTemplate =
    tabs
      .map((t) =>
        t.id === active ? `${measuredWidths[t.id] ?? 40}px` : "40px",
      )
      .join(" ") + " 1fr";

  return (
    <TooltipProvider delayDuration={300}>
      {/* Hidden measurement row — same DOM shape as the visible tabs but with
          natural sizing. Position absolutely so it doesn't push layout, and
          aria-hidden + tabIndex=-1 so it's invisible to assistive tech. */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute -left-[9999px] top-0 flex items-center gap-1.5"
      >
        {tabs.map((tab, i) => {
          const Icon = ICON_MAP[tab.icon];
          const hasBadge = tab.badge != null && tab.badge > 0;
          return (
            <span
              key={tab.id}
              ref={(node) => {
                ghostRefs.current[i] = node;
              }}
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap px-2"
            >
              <Icon className="size-[14px]" strokeWidth={2} />
              <span className="text-sm font-medium leading-none">{tab.label}</span>
              {hasBadge ? (
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
                  {tab.badge}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>

      <div
        role="tablist"
        aria-orientation="horizontal"
        aria-label="Panel sections"
        id={listId}
        className={cn(
          "grid w-full items-center gap-1 rounded-md border border-border bg-muted/40 p-1",
          "shadow-[inset_0_1px_0_rgb(0_0_0/0.02)]",
          "transition-[grid-template-columns] duration-200 ease-in-out",
        )}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {tabs.map((tab, index) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = tab.id === active;
          const showBadge = isActive && tab.badge != null && tab.badge > 0;
          const ariaLabel = buildAriaLabel(tab);

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
              // Roving tabindex: only the active tab is reachable via Tab.
              tabIndex={isActive ? 0 : -1}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => {
                if (!isActive) onChange(tab.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                // The grid track sets the available width; the button fills
                // it and clips its own overflowing content while the
                // grid-template-columns transition runs.
                "relative flex h-8 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-[5px] px-2",
                "cursor-pointer select-none outline-none",
                // Color/shadow transitions ride along with the grid-track
                // width transition so the handoff reads as one gesture.
                "transition-[background-color,color,box-shadow] duration-200 ease-in-out",
                isActive
                  ? "justify-start bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
                      // Ring against the panel surface so the pip reads cleanly in both themes.
                      "ring-2 ring-background",
                    )}
                  />
                ) : null}
              </span>

              {/* Label + badge reveal. We always render the label so width
                  measurements stay honest for flex layout, but we gate its
                  visibility on `isActive` with a short opacity/translate so
                  the text doesn't pop in before the tab has finished growing.
                  `aria-hidden` on the inactive copy keeps the screen reader
                  from announcing the label twice (the button has aria-label). */}
              <span
                aria-hidden
                className={cn(
                  "flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap",
                  "transition-[max-width,opacity,transform] duration-200 ease-in-out",
                  isActive
                    ? "max-w-[200px] translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-1 opacity-0",
                )}
              >
                <span className="truncate text-sm font-medium leading-none">
                  {tab.label}
                </span>
                {showBadge ? (
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
