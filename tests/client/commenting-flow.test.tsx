// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import * as Y from "yjs";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";
import { createThread } from "~/lib/comments/threads";

// --- jsdom polyfills for TipTap ---

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

vi.mock("~/lib/api", () => ({
  getDocument: vi.fn(async () => ({
    document: {
      id: "doc-1",
      projectId: "proj-1",
      title: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    permissionLevel: "edit" as const,
  })),
}));

// Shared ydoc so the test can create a thread that the route also sees.
const ydoc = new Y.Doc();

vi.mock("~/lib/yjs-client", () => {
  return {
    connect: vi.fn(() => {
      const provider = {
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        awareness: {
          on: vi.fn(),
          off: vi.fn(),
          getStates: () => new Map(),
          states: new Map(),
          setLocalStateField: vi.fn(),
        },
      };
      return { ydoc, provider, destroy: () => {} };
    }),
  };
});

import DocumentRoute from "~/routes/Document";

function renderRoute(url: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/p/:projectId/d/:docId" element={<DocumentRoute />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("commenting flow", () => {
  beforeEach(() => {
    localStorage.clear();
    const map = ydoc.getMap("threads");
    for (const key of map.keys()) map.delete(key);
    vi.clearAllMocks();
  });

  it("renders the comment chip with zero when there are no threads", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    expect(chip.textContent).toContain("0");
  });

  it("chip updates count when a thread is added to the Y.Map", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    await act(async () => {
      createThread(ydoc, {
        authorName: "Sakura",
        authorColor: "#e11d48",
        body: "Hey",
        createdAt: Date.now(),
      });
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    expect(chip.textContent).toContain("1");
  });

  it("opens the sidebar when the chip is clicked", async () => {
    renderRoute("/p/p1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const chip = await screen.findByRole("button", { name: /unresolved comments/i });
    await act(async () => {
      chip.click();
    });
    expect(screen.getByTestId("comment-sidebar")).toBeTruthy();
  });
});
