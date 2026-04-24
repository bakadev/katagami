// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { PanelTabs } from "~/components/panel/PanelTabs";

// Radix's Tooltip (used on inactive tabs) measures nodes with ResizeObserver,
// which jsdom doesn't ship. A no-op stub is sufficient for behavioral tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

const baseTabs = [
  { id: "documents", label: "Documents", icon: "FileText", badge: null, hasNotification: false },
  { id: "comments", label: "Comments", icon: "MessageSquare", badge: 3, hasNotification: true },
  { id: "ai", label: "AI", icon: "Sparkles", badge: null, hasNotification: false },
  { id: "history", label: "History", icon: "History", badge: null, hasNotification: false },
] as const;

describe("PanelTabs", () => {
  it("renders the active tab's label visibly", () => {
    // The component also renders an aria-hidden ghost row used to measure
    // each tab's natural width, so any text-based query must be scoped to
    // the visible tablist.
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    const list = screen.getByRole("tablist");
    expect(within(list).getByText("Comments")).toBeTruthy();
  });

  it("shows a count badge on the active tab when provided", () => {
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    const list = screen.getByRole("tablist");
    expect(within(list).getByText("3")).toBeTruthy();
  });

  it("does NOT render a badge in the visible tablist when active.badge is null", () => {
    render(<PanelTabs tabs={baseTabs} active="documents" onChange={() => {}} />);
    const list = screen.getByRole("tablist");
    // Documents is active and has badge=null. The visible tablist only shows
    // a badge inside the *active* tab, so no "3" should be visible there
    // (Comments' "3" lives only in the off-screen measurement ghost).
    expect(within(list).queryByText("3")).toBeNull();
  });

  it("fires onChange with the clicked tab id", () => {
    const onChange = vi.fn();
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={onChange} />);
    const historyTab = screen.getByRole("tab", { name: /History/i });
    fireEvent.click(historyTab);
    expect(onChange).toHaveBeenCalledWith("history");
  });

  it("marks the active tab with aria-selected=true", () => {
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    const commentsTab = screen.getByRole("tab", { name: /Comments/i });
    expect(commentsTab.getAttribute("aria-selected")).toBe("true");
    const historyTab = screen.getByRole("tab", { name: /History/i });
    expect(historyTab.getAttribute("aria-selected")).toBe("false");
  });

  it("uses role=tablist on the container", () => {
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    expect(screen.getByRole("tablist")).toBeTruthy();
  });

  it("ArrowRight moves to the next tab and fires onChange (wraps at end)", () => {
    const onChange = vi.fn();
    render(<PanelTabs tabs={baseTabs} active="history" onChange={onChange} />);
    const historyTab = screen.getByRole("tab", { name: /History/i });
    fireEvent.keyDown(historyTab, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("documents");
  });

  it("ArrowLeft moves to the previous tab and fires onChange (wraps at start)", () => {
    const onChange = vi.fn();
    render(<PanelTabs tabs={baseTabs} active="documents" onChange={onChange} />);
    const docsTab = screen.getByRole("tab", { name: /Documents/i });
    fireEvent.keyDown(docsTab, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("history");
  });

  it("Home jumps to the first tab, End jumps to the last", () => {
    const onChange = vi.fn();
    render(<PanelTabs tabs={baseTabs} active="ai" onChange={onChange} />);
    const aiTab = screen.getByRole("tab", { name: /AI/i });
    fireEvent.keyDown(aiTab, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("documents");
    fireEvent.keyDown(aiTab, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("history");
  });
});
