// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentSidebar } from "../../src/components/comments/CommentSidebar";
import type { Thread } from "../../src/lib/comments/types";

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "t1",
    authorName: "Sakura",
    authorColor: "#e11d48",
    body: "Nice",
    createdAt: Date.now(),
    resolved: false,
    replies: [],
    ...overrides,
  };
}

const noop = () => {};
const basicHandlers = {
  onClose: noop,
  onReply: noop,
  onResolveToggle: noop,
  onDeleteThreadRoot: noop,
  onDeleteReply: noop,
  onClickAnchor: noop,
  resolveAnchor: () => "anchor text",
};

describe("CommentSidebar", () => {
  it("shows empty-state when no threads", () => {
    render(
      <CommentSidebar
        threads={[]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText(/No comments yet/i)).toBeTruthy();
  });

  it("renders a thread card", () => {
    render(
      <CommentSidebar
        threads={[makeThread({ body: "Hello world" })]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("hides resolved threads by default", () => {
    render(
      <CommentSidebar
        threads={[
          makeThread({ id: "open", body: "open thread" }),
          makeThread({ id: "done", body: "closed thread", resolved: true }),
        ]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    expect(screen.getByText("open thread")).toBeTruthy();
    expect(screen.queryByText("closed thread")).toBeNull();
  });

  it("toggling Show resolved reveals resolved threads", () => {
    render(
      <CommentSidebar
        threads={[
          makeThread({ id: "done", body: "closed thread", resolved: true }),
        ]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
      />,
    );
    const toggle = screen.getByTestId("show-resolved") as HTMLInputElement;
    fireEvent.click(toggle);
    expect(screen.getByText("closed thread")).toBeTruthy();
  });

  it("onClose fires when the X button is clicked", () => {
    const onClose = vi.fn();
    render(
      <CommentSidebar
        threads={[]}
        currentAuthorName="Sakura"
        readOnly={false}
        {...basicHandlers}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close sidebar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
