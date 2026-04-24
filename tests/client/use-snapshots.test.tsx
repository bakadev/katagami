// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSnapshots } from "../../src/hooks/useSnapshots";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function mockListResponse(snapshots: unknown[]) {
  return vi.spyOn(global, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify({ snapshots }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("useSnapshots", () => {
  it("fetches on mount when enabled", async () => {
    const spy = mockListResponse([]);
    const { result } = renderHook(() => useSnapshots("doc-1", "key-1", true));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(result.current.snapshots).toEqual([]);
  });

  it("polls every 30s while enabled", async () => {
    const spy = mockListResponse([]);
    renderHook(() => useSnapshots("doc-1", "key-1", true));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(spy).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("stops polling when enabled flips to false", async () => {
    const spy = mockListResponse([]);
    const { rerender } = renderHook(({ enabled }) => useSnapshots("doc-1", "key-1", enabled), {
      initialProps: { enabled: true },
    });
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
