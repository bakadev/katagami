// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateIdentity, storeIdentity } from "../../src/lib/user/identity";
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

  it("accepts a custom stored name that is not in the preset pool", () => {
    localStorage.setItem(
      "katagami:identity",
      JSON.stringify({ name: "Custom Name", color: CURSOR_COLORS[0] }),
    );
    const identity = getOrCreateIdentity();
    expect(identity.name).toBe("Custom Name");
    expect(identity.color).toBe(CURSOR_COLORS[0]);
  });

  it("regenerates identity when stored name is empty or too long", () => {
    localStorage.setItem(
      "katagami:identity",
      JSON.stringify({ name: "", color: CURSOR_COLORS[0] }),
    );
    const tooShort = getOrCreateIdentity();
    expect(tooShort.name.length).toBeGreaterThanOrEqual(1);

    localStorage.clear();
    localStorage.setItem(
      "katagami:identity",
      JSON.stringify({ name: "a".repeat(41), color: CURSOR_COLORS[0] }),
    );
    const tooLong = getOrCreateIdentity();
    expect(JAPANESE_NAMES).toContain(tooLong.name);
  });

  it("storeIdentity persists a custom identity to localStorage", () => {
    storeIdentity({ name: "Custom Person", color: "#123456" });
    const raw = localStorage.getItem("katagami:identity");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ name: "Custom Person", color: "#123456" });

    // And round-trips through getOrCreateIdentity
    const roundtrip = getOrCreateIdentity();
    expect(roundtrip).toEqual({ name: "Custom Person", color: "#123456" });
  });
});
