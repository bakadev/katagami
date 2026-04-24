// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRelativeTime, formatRelative } from "../../src/hooks/useRelativeTime";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("formatRelative", () => {
  it("formats a 2-minute-old timestamp as '2 minutes ago'", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    const iso = new Date(now - 2 * 60_000).toISOString();
    expect(formatRelative(iso, now)).toBe("2 minutes ago");
  });

  it("returns 'just now' for timestamps within 30 seconds", () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    const iso = new Date(now - 15_000).toISOString();
    expect(formatRelative(iso, now)).toBe("just now");
  });
});

describe("useRelativeTime", () => {
  it("formats an ISO timestamp relative to now", () => {
    const baseTime = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime - 2 * 60_000).toISOString();
    const { result } = renderHook(() => useRelativeTime(iso));
    expect(result.current).toBe("2 minutes ago");
  });

  it("returns 'just now' for timestamps within 30 seconds", () => {
    const baseTime = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(baseTime);
    const iso = new Date(baseTime - 10_000).toISOString();
    const { result } = renderHook(() => useRelativeTime(iso));
    expect(result.current).toBe("just now");
  });

  it("re-renders after the 60s tick and reflects the updated relative time", () => {
    const baseTime = new Date("2024-01-01T12:00:00Z").getTime();
    vi.setSystemTime(baseTime);
    // iso is 2 minutes old at baseTime
    const iso = new Date(baseTime - 2 * 60_000).toISOString();
    const { result } = renderHook(() => useRelativeTime(iso));
    expect(result.current).toBe("2 minutes ago");

    // Advance 61 seconds: now the timestamp is ~3 minutes old
    // advanceTimersByTime also advances Date.now(), so no separate setSystemTime needed
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current).toBe("3 minutes ago");
  });

  it("returns empty string for null iso", () => {
    const { result } = renderHook(() => useRelativeTime(null));
    expect(result.current).toBe("");
  });

  it("returns empty string for undefined iso", () => {
    const { result } = renderHook(() => useRelativeTime(undefined));
    expect(result.current).toBe("");
  });
});
