import type { ReactNode } from "react";
import { PanelTabs, type PanelTabDescriptor } from "./PanelTabs";
import type { PanelTab } from "~/hooks/usePanelVisibility";

interface RightPanelProps {
  open: boolean;
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
    <aside
      role="complementary"
      aria-label="Document panel"
      aria-hidden={!open}
      className={`flex flex-col overflow-hidden border-l border-border bg-muted/20 transition-[width] duration-200 ease-out ${
        open ? "w-[360px]" : "w-0"
      }`}
    >
      {open ? (
        <>
          <div className="border-b border-border p-2">
            <PanelTabs
              tabs={tabs}
              active={activeTab}
              onChange={(id) => onTabChange(id as PanelTab)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </>
      ) : null}
    </aside>
  );
}
