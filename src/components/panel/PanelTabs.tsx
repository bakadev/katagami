import { useCallback, useId, useRef, type KeyboardEvent } from "react";
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

  // Each tab is one grid column. The active tab sizes to its content
  // (`auto`); inactive tabs are fixed 40px wells. A trailing `1fr` track
  // soaks up the remaining row width so the rail keeps its w-full shell
  // and only the active tab occupies the space its content needs.
  const gridTemplate =
    tabs.map((t) => (t.id === active ? "auto" : "40px")).join(" ") + " 1fr";

  return (
    <TooltipProvider delayDuration={300}>
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

          // The grid column owns the width — the button just fills it.
          const layoutClasses = "min-w-0";

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
                // Base layout — h-8 gives enough room for label + 14px icon
                // without fighting the parent rail.
                "relative inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-2",
                "cursor-pointer select-none outline-none",
                // The grid track owns the width animation. We still transition
                // color/shadow on the button itself so the handoff between
                // states reads as a single coordinated gesture.
                "transition-[background-color,color,box-shadow] duration-200 ease-in-out",
                layoutClasses,
                isActive
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
