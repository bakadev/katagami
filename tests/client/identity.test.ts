// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateIdentity } from "../../src/lib/user/identity";
import { JAPANESE_NAMES, CURSOR_COLORS } from "../../src/lib/user/names";

describe("getOrCreateIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a name from the pool", () => {
    const { name } = getOrCreateIdentity();
    expect(JAPANESE_NAMES).toContain(name);
  });

  it("returns a color in #rrggbb format", () => {
    const { color } = getOrCreateIdentity();
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns a color from the palette", () => {
    const { color } = getOrCreateIdentity();
    expect(CURSOR_COLORS).toContain(color);
  });

  it("returns the same identity on subsequent calls", () => {
    const first = getOrCreateIdentity();
    const second = getOrCreateIdentity();
    expect(second).toEqual(first);
  });

  it("persists across module boundaries via localStorage", () => {
    const { name, color } = getOrCreateIdentity();
    const raw = localStorage.getItem("katagami:identity");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ name, color });
  });

  it("regenerates identity if localStorage is cleared", () => {
    const _first = getOrCreateIdentity();
    localStorage.clear();
    const second = getOrCreateIdentity();
    expect(localStorage.getItem("katagami:identity")).toBeTruthy();
    expect(JAPANESE_NAMES).toContain(second.name);
  });

  it("regenerates identity when stored JSON is corrupt", () => {
    localStorage.setItem("katagami:identity", "not valid json");
    const identity = getOrCreateIdentity();
    expect(JAPANESE_NAMES).toContain(identity.name);
    expect(CURSOR_COLORS).toContain(identity.color);
  });

  it("regenerates identity when stored name is not in the current pool", () => {
    localStorage.setItem(
      "katagami:identity",
      JSON.stringify({ name: "DefunctName", color: CURSOR_COLORS[0] }),
    );
    const identity = getOrCreateIdentity();
    expect(JAPANESE_NAMES).toContain(identity.name);
    // Must have regenerated — not returned the defunct stored name
    expect(identity.name).not.toBe("DefunctName");
  });
});
