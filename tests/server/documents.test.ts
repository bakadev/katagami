import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";

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
