import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";

describe("GET /api/docs/:id/snapshots", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let viewToken: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
    viewToken = body.permissions.viewToken;
  });

  it("returns empty list for a new doc (any valid token)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}/snapshots?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.snapshots).toEqual([]);
  });

  it("rejects with 403 when key is wrong", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}/snapshots?key=wrong-token`,
    });
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  it("returns snapshots newest-first", async () => {
    await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "A" },
    });
    // Small delay to ensure different takenAt timestamps
    await new Promise((r) => setTimeout(r, 10));
    await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "B" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.snapshots).toHaveLength(2);
    expect(body.snapshots[0].name).toBe("B");
    expect(body.snapshots[1].name).toBe("A");
  });
});

describe("POST /api/docs/:id/snapshots", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let viewToken: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
    viewToken = body.permissions.viewToken;
  });

  it("creates named snapshot with edit token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe("v1");
    expect(typeof body.id).toBe("string");
    expect(typeof body.takenAt).toBe("string");
    expect(Number.isNaN(Date.parse(body.takenAt))).toBe(false);
    expect(typeof body.preview).toBe("string");
  });

  it("rejects named snapshot with view token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${viewToken}`,
      payload: { name: "v1" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("accepts empty body and creates unnamed snapshot", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBeNull();
  });

  it("creates unnamed snapshot when name is only whitespace", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "   " },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBeNull();
  });

  it("rejects name longer than 80 chars", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "a".repeat(81) },
    });
    expect(res.statusCode).toBe(400);
  });
});
