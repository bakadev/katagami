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
 * RightPanel — fixed-width panel on the right edge of the editor.
 *
 * Three responsibilities:
 * 1. Width + open/closed transition (360px → 0 with a CSS width transition).
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
      {/* Phones: the panel floats over the editor; a backdrop closes it. */}
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
    <aside
      role="complementary"
      aria-label="Document panel"
      aria-hidden={!open}
      className={`notch min-h-0 flex-col overflow-hidden bg-border p-px transition-[width] duration-200 ease-out ${
        open
          ? "fixed inset-y-3 right-3 z-40 flex w-[min(360px,calc(100vw-1.5rem))] shadow-2xl md:static md:inset-auto md:z-auto md:w-[360px] md:shadow-none"
          : "hidden md:flex md:w-0 md:p-0"
      }`}
    >
      {open ? (
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
      ) : null}
    </aside>
    </>
  );
}
