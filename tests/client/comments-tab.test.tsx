// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentsTab } from "~/components/panel/tabs/CommentsTab";
import type { Thread } from "~/lib/comments/types";

// Radix Tooltip (used inside ThreadCard actions) needs a ResizeObserver stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

function fakeThread(id: string, overrides: Partial<Thread> = {}): Thread {
  return {
    id,
    authorName: "Sakura",
    authorColor: "#ff66aa",
    body: "A comment",
    createdAt: Date.now(),
    resolved: false,
    replies: [],
    ...overrides,
  } as Thread;
}

const defaults = {
  currentAuthorName: "Sakura",
  readOnly: false,
  resolveAnchor: () => "",
  onReply: () => {},
  onResolveToggle: () => {},
  onDeleteThreadRoot: () => {},
  onDeleteReply: () => {},
  onClickAnchor: () => {},
};

describe("CommentsTab", () => {
  it("renders empty state when there are no threads", () => {
    render(<CommentsTab threads={[]} {...defaults} />);
    expect(screen.getByText(/No comments yet/i)).toBeTruthy();
  });

  it("shows a reply count badge on collapsed threads with replies", () => {
    const thread = fakeThread("t1", {
      replies: [
        { id: "r1", authorName: "X", authorColor: "#000", body: "r", createdAt: Date.now() },
        { id: "r2", authorName: "Y", authorColor: "#000", body: "r", createdAt: Date.now() },
      ],
    });
    render(<CommentsTab threads={[thread]} {...defaults} />);
    // Collapse the thread first so the compact summary is shown
    const collapseBtn = screen.getByRole("button", { name: /Collapse/i });
    fireEvent.click(collapseBtn);
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders unresolved threads before resolved ones when Show resolved is on", () => {
    const older = fakeThread("t-old", { body: "Older resolved comment", createdAt: 100, resolved: true });
    const newer = fakeThread("t-new", { body: "Newer unresolved comment", createdAt: 200, resolved: false });
    render(<CommentsTab threads={[older, newer]} {...defaults} />);
    const toggle = screen.getByLabelText(/Show resolved/i) as HTMLInputElement;
    fireEvent.click(toggle);
    const unresolvedEl = screen.getByText(/Newer unresolved comment/);
    const resolvedEl = screen.getByText(/Older resolved comment/);
    // The unresolved thread's body should appear before the resolved one in document order.
    expect(
      unresolvedEl.compareDocumentPosition(resolvedEl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("collapses and expands a thread when the control is clicked", () => {
    const thread = fakeThread("t1", { body: "Full body text visible when expanded" });
    render(<CommentsTab threads={[thread]} {...defaults} />);
    // Default is expanded — body visible
    expect(screen.getByText("Full body text visible when expanded")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Collapse/i }));
    // After collapse, an Expand button is present
    expect(screen.getByRole("button", { name: /Expand/i })).toBeTruthy();
  });

  it("calls onClickAnchor when the anchor quote is clicked", () => {
    const onClickAnchor = vi.fn();
    const thread = fakeThread("t1");
    render(
      <CommentsTab
        threads={[thread]}
        {...defaults}
        resolveAnchor={() => "The anchored quote"}
        onClickAnchor={onClickAnchor}
      />,
    );
    fireEvent.click(screen.getByText(/The anchored quote/));
    expect(onClickAnchor).toHaveBeenCalledWith("t1");
  });
});
