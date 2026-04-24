// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import * as Y from "yjs";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";

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

// --- Mocks ---

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

// Mock yjs-client so we never open a real WebSocket in jsdom.
vi.mock("~/lib/yjs-client", () => {
  return {
    connect: vi.fn(() => {
      const ydoc = new Y.Doc();
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
          setLocalState: vi.fn(),
          getLocalState: () => null,
        },
      };
      return {
        ydoc,
        provider,
        destroy: () => ydoc.destroy(),
      };
    }),
  };
});

// Import AFTER the mocks above so the mocked modules are picked up.
import DocumentRoute from "~/routes/Document";

function renderAt(url: string) {
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

describe("DocumentRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows the Edit tab selected by default and both tabs visible", async () => {
    renderAt("/p/proj-1/d/doc-1?key=edit-token");
    // Wait for the async permission load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const editTab = await screen.findByRole("tab", { name: "Edit" });
    const previewTab = await screen.findByRole("tab", { name: "Preview" });
    expect(editTab.getAttribute("aria-selected")).toBe("true");
    expect(previewTab.getAttribute("aria-selected")).toBe("false");
  });

  it("switches aria-selected on Preview click", async () => {
    renderAt("/p/proj-1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const previewTab = await screen.findByRole("tab", { name: "Preview" });
    await act(async () => {
      previewTab.click();
    });
    expect(previewTab.getAttribute("aria-selected")).toBe("true");
  });
});
