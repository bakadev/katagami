// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";
import { useThreads } from "../../src/hooks/useThreads";
import { createThread, setResolved } from "../../src/lib/comments/threads";

describe("useThreads", () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
  });

  it("returns [] when no threads exist", () => {
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toEqual([]);
  });

  it("returns threads created before the hook mounted", () => {
    createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "x",
      createdAt: 1,
    });
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toHaveLength(1);
  });

  it("updates when a thread is added after mount", () => {
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current).toHaveLength(0);

    act(() => {
      createThread(ydoc, {
        authorName: "B",
        authorColor: "#111",
        body: "y",
        createdAt: 2,
      });
    });

    expect(result.current).toHaveLength(1);
  });

  it("reflects resolved flag updates", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "x",
      createdAt: 1,
    });
    const { result } = renderHook(() => useThreads(null, ydoc));
    expect(result.current[0].resolved).toBe(false);

    act(() => {
      setResolved(ydoc, id, true);
    });

    expect(result.current[0].resolved).toBe(true);
  });

  it("returns [] when ydoc is null", () => {
    const { result } = renderHook(() => useThreads(null, null));
    expect(result.current).toEqual([]);
  });
});
