import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";

describe("PATCH /api/docs/:id", () => {
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

  it("updates title when caller has edit token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}?key=${editToken}`,
      payload: { title: "Spec v1" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.title).toBe("Spec v1");
  });

  it("rejects with 403 when caller has view-only token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}?key=${viewToken}`,
      payload: { title: "hacked" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("rejects titles longer than 120 chars", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}?key=${editToken}`,
      payload: { title: "a".repeat(121) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts null to clear the title", async () => {
    await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}?key=${editToken}`,
      payload: { title: "Hello" },
    });
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}?key=${editToken}`,
      payload: { title: null },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.title).toBeNull();
  });
});

describe("GET /api/docs/:id", () => {
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

  it("returns metadata + 'edit' for a valid edit token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.document.id).toBe(documentId);
    expect(body.document.projectId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.document.title).toBeNull();
    expect(typeof body.document.createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(body.document.createdAt))).toBe(false);
    expect(typeof body.document.updatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(body.document.updatedAt))).toBe(false);
    expect(body.permissionLevel).toBe("edit");
  });

  it("returns metadata + 'view' for a valid view token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().permissionLevel).toBe("view");
  });

  it("returns 403 when the token is wrong", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=nonsense`,
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 403 when the token is missing", async () => {
    const res = await app.inject({ method: "GET", url: `/api/docs/${documentId}` });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 when the document does not exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/00000000-0000-0000-0000-000000000000?key=${editToken}`,
    });
    expect(res.statusCode).toBe(404);
  });
});
