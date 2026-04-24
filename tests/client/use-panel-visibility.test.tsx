// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelVisibility } from "../../src/hooks/usePanelVisibility";

beforeEach(() => {
  localStorage.clear();
});

describe("usePanelVisibility", () => {
  it("defaults to open=true and activeTab='comments' when localStorage is empty", () => {
    const { result } = renderHook(() => usePanelVisibility());
    expect(result.current.open).toBe(true);
    expect(result.current.activeTab).toBe("comments");
  });

  it("persists open=false and activeTab='history' across re-mounts", () => {
    const { result, unmount } = renderHook(() => usePanelVisibility());

    act(() => {
      result.current.setOpen(false);
      result.current.setActiveTab("history");
    });

    unmount();

    const { result: result2 } = renderHook(() => usePanelVisibility());
    expect(result2.current.open).toBe(false);
    expect(result2.current.activeTab).toBe("history");
  });

  it("togglePanel flips open", () => {
    const { result } = renderHook(() => usePanelVisibility());
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.togglePanel();
    });
    expect(result.current.open).toBe(false);

    act(() => {
      result.current.togglePanel();
    });
    expect(result.current.open).toBe(true);
  });
});
