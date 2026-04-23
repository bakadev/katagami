import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

describe("admin routes", () => {
  let app: FastifyInstance;
  let projectId: string;
  let documentId: string;
  let creatorToken: string;
  let editToken: string;

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
    projectId = body.project.id;
    documentId = body.document.id;
    creatorToken = body.creatorToken;
    editToken = body.permissions.editToken;
  });

  describe("PATCH /api/projects/:id", () => {
    it("renames with a valid creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        headers: { "x-creator-token": creatorToken },
        payload: { name: "My Spec" },
      });
      expect(res.statusCode).toBe(200);
      const project = await db.project.findUnique({ where: { id: projectId } });
      expect(project!.name).toBe("My Spec");
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        payload: { name: "x" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("returns 403 with the wrong creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        headers: { "x-creator-token": "not-the-right-token" },
        payload: { name: "x" },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/docs/:id", () => {
    it("deletes a document with a valid creator token", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/docs/${documentId}`,
        headers: { "x-creator-token": creatorToken },
      });
      expect(res.statusCode).toBe(204);
      const doc = await db.document.findUnique({ where: { id: documentId } });
      expect(doc).toBeNull();
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({ method: "DELETE", url: `/api/docs/${documentId}` });
      expect(res.statusCode).toBe(403);
    });

    it("returns 403 with the wrong creator token", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/docs/${documentId}`,
        headers: { "x-creator-token": "not-the-right-token" },
      });
      expect(res.statusCode).toBe(403);
      const doc = await db.document.findUnique({ where: { id: documentId } });
      expect(doc).not.toBeNull();
    });
  });

  describe("POST /api/docs/:id/rotate-keys", () => {
    it("generates new permission tokens and invalidates the old ones", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/docs/${documentId}/rotate-keys`,
        headers: { "x-creator-token": creatorToken },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(body.viewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(body.editToken).not.toBe(editToken);

      // Old token no longer works
      const check = await app.inject({
        method: "GET",
        url: `/api/docs/${documentId}?key=${editToken}`,
      });
      expect(check.statusCode).toBe(403);

      // New token does
      const check2 = await app.inject({
        method: "GET",
        url: `/api/docs/${documentId}?key=${body.editToken}`,
      });
      expect(check2.statusCode).toBe(200);
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/docs/${documentId}/rotate-keys`,
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
