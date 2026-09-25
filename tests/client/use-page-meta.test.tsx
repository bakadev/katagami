// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageMeta } from "../../src/hooks/usePageMeta";

describe("usePageMeta", () => {
  beforeEach(() => {
    document.title = "";
    document.querySelector('meta[name="description"]')?.remove();
  });

  it("sets a suffixed title and creates the description meta", () => {
    renderHook(() =>
      usePageMeta({ title: "Pricing", description: "Free to start." }),
    );
    expect(document.title).toBe("Pricing · Katagami");
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    expect(meta?.content).toBe("Free to start.");
  });

  it("uses the bare title when asked and updates an existing meta", () => {
    const existing = document.createElement("meta");
    existing.name = "description";
    existing.content = "old";
    document.head.appendChild(existing);

    renderHook(() =>
      usePageMeta({ title: "Katagami", description: "new", bare: true }),
    );
    expect(document.title).toBe("Katagami");
    expect(
      document.querySelectorAll('meta[name="description"]').length,
    ).toBe(1);
    expect(existing.content).toBe("new");
  });
});
