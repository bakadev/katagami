import type { ReactNode } from "react";
import { PanelTabs, type PanelTabDescriptor } from "./PanelTabs";
import type { PanelTab } from "~/hooks/usePanelVisibility";

interface RightPanelProps {
  open: boolean;
  /** Phones: tapping the backdrop closes the overlay. */
  onClose?: () => void;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  commentCount: number;
  hasNewCommentActivity: boolean;
  children: ReactNode;
}

const TABS: readonly PanelTabDescriptor[] = [
  { id: "documents", label: "Documents", icon: "FileText", badge: null, hasNotification: false },
  { id: "comments", label: "Comments", icon: "MessageSquare", badge: null, hasNotification: false },
  { id: "ai", label: "AI", icon: "Sparkles", badge: null, hasNotification: false },
  { id: "history", label: "History", icon: "History", badge: null, hasNotification: false },
];

/**
 * RightPanel — panel on the right edge of the editor.
 *
 * Three responsibilities:
 * 1. Open/closed transition. On md+ it is an in-flow column (360px → 0 with
 *    a width transition). On phones it is a drawer that slides in from the
 *    right over the editor card, inside the content area, so the header and
 *    its toggle stay reachable and the card never resizes.
 * 2. Render the PanelTabs header with dynamic count + notification signals
 *    tailored for this session's state (only the Comments tab gets a live
 *    count; the others are placeholders today).
 * 3. Slot the active tab's content (passed as children — parent maps tab id
 *    to the appropriate tab component).
 */
export function RightPanel({
  open,
  onClose,
  activeTab,
  onTabChange,
  commentCount,
  hasNewCommentActivity,
  children,
}: RightPanelProps) {
  const tabs = TABS.map((t): PanelTabDescriptor => {
    if (t.id === "comments") {
      return {
        ...t,
        badge: commentCount > 0 ? commentCount : null,
        hasNotification: hasNewCommentActivity && activeTab !== "comments",
      };
    }
    return t;
  });

  return (
    <>
      {/* Phones: the panel is a drawer over the editor card. The backdrop
          covers only the content area, so the header (and its toggle) stays
          reachable. */}
      <button
        type="button"
        aria-label="Close panel"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="complementary"
        aria-label="Document panel"
        aria-hidden={!open}
        inert={!open}
        className={`notch flex min-h-0 flex-col overflow-hidden bg-border p-px transition-[width,translate] duration-200 ease-out ${
          /* phone: drawer sliding in from the right edge of the content area */
          "absolute inset-y-3 right-3 z-40 w-[min(360px,calc(100vw-1.5rem))] shadow-2xl"
        } ${open ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+1rem)]"} ${
          /* md+: in-flow column that collapses to zero width */
          "md:static md:inset-auto md:z-auto md:translate-x-0 md:shadow-none md:pointer-events-auto"
        } ${open ? "md:w-[360px]" : "md:w-0 md:p-0"}`}
      >
        <div className="notch-in flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="border-b border-border p-2">
            <PanelTabs
              tabs={tabs}
              active={activeTab}
              onChange={(id) => onTabChange(id as PanelTab)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </aside>
    </>
  );
}
