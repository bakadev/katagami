// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  storeCreatorToken,
  getCreatorToken,
  clearCreatorToken,
} from "../../src/lib/creator-token";

describe("creator-token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves a token", () => {
    storeCreatorToken("abc", "token-123");
    expect(getCreatorToken("abc")).toBe("token-123");
  });

  it("isolates tokens per project id", () => {
    storeCreatorToken("a", "one");
    storeCreatorToken("b", "two");
    expect(getCreatorToken("a")).toBe("one");
    expect(getCreatorToken("b")).toBe("two");
  });

  it("returns null for unknown projects", () => {
    expect(getCreatorToken("missing")).toBeNull();
  });

  it("clears tokens", () => {
    storeCreatorToken("abc", "x");
    clearCreatorToken("abc");
    expect(getCreatorToken("abc")).toBeNull();
  });
});
