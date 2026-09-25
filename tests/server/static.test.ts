import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "../../server/index.js";

/**
 * In production the Fastify server also serves the built client from
 * `dist/client`. Unknown non-API paths fall back to index.html so React
 * Router can handle them; API and WebSocket paths are untouched.
 */
describe("static client serving", () => {
  let dir: string;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "katagami-static-"));
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "index.html"), "<html><body>SPA</body></html>");
    writeFileSync(join(dir, "assets", "app.js"), "console.log('hi')");
    app = await buildServer({ staticDir: dir });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves index.html at /", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("SPA");
  });

  it("serves hashed assets", async () => {
    const res = await app.inject({ method: "GET", url: "/assets/app.js" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("console.log");
  });

  it("falls back to index.html for client routes", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/p/abc/d/def?key=xyz",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("SPA");
  });

  it("still returns JSON 404s for unknown API routes", async () => {
    const res = await app.inject({ method: "GET", url: "/api/nope" });
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });

  it("keeps existing API routes working", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.json()).toEqual({ ok: true });
  });

  it("does not register static serving when no staticDir is given", async () => {
    const plain = await buildServer();
    await plain.ready();
    const res = await plain.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(404);
    await plain.close();
  });
});
