import { describe, it, expect } from "vitest";
import { isClientRoute } from "../../server/client-routes.js";

describe("isClientRoute", () => {
  it("knows the signed-in home and project pages", () => {
    expect(isClientRoute("/documents")).toBe(true);
    expect(isClientRoute("/admin")).toBe(true);
    expect(isClientRoute("/admin/")).toBe(true);
    expect(isClientRoute("/admin/x")).toBe(false);
    expect(isClientRoute("/documents/")).toBe(true);
    expect(isClientRoute("/documents/8f7c1a2e-0000-4000-8000-000000000000")).toBe(true);
    expect(isClientRoute("/documents?x=1")).toBe(true);
  });
  it("still refuses paths the app does not own", () => {
    expect(isClientRoute("/documentsx")).toBe(false);
    expect(isClientRoute("/nope")).toBe(false);
  });
});
