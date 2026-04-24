// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    expect(screen.getByText("Comments")).toBeTruthy();
  });

  it("shows a count badge on the active tab when provided", () => {
    render(<PanelTabs tabs={baseTabs} active="comments" onChange={() => {}} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("a tab without a badge has an aria-label that doesn't mention 'unread'", () => {
    // The Documents tab has badge: null. Its aria-label should be just the
    // label, no count. Comments still has badge: 3 in the DOM (for width
    // measurement) but is clipped by the active tab's overflow-hidden, so
    // we check the semantic — the active tab's accessible name — instead.
    render(<PanelTabs tabs={baseTabs} active="documents" onChange={() => {}} />);
    const documentsTab = screen.getByRole("tab", { name: /Documents/i });
    expect(documentsTab.getAttribute("aria-label")).toBe("Documents");
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
