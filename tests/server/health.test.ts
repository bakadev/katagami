import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../server/index.js";

describe("GET /api/health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns ok: true", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
