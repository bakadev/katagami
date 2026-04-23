import { describe, it, expect } from "vitest";
import { randomToken } from "../../server/lib/random.js";

describe("randomToken", () => {
  it("returns a URL-safe string of the requested length", () => {
    const t = randomToken(32);
    expect(t).toHaveLength(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different values on each call", () => {
    const a = randomToken(32);
    const b = randomToken(32);
    expect(a).not.toBe(b);
  });

  it("defaults to 32 characters", () => {
    expect(randomToken()).toHaveLength(32);
  });
});
