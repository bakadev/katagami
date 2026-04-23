import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

describe("POST /api/projects", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates a project, one document, edit + view permissions, returns creator token", async () => {
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.project.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.document.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.permissions.editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.permissions.viewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.creatorToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.permissions.editToken).not.toBe(body.permissions.viewToken);
    expect(body.creatorToken).not.toBe(body.permissions.editToken);
    expect(body.creatorToken).not.toBe(body.permissions.viewToken);

    const project = await db.project.findUnique({ where: { id: body.project.id } });
    expect(project).not.toBeNull();
    expect(project!.creatorToken).toBe(body.creatorToken);

    const doc = await db.document.findUnique({ where: { id: body.document.id } });
    expect(doc).not.toBeNull();
    expect(doc!.projectId).toBe(body.project.id);

    const perms = await db.permission.findMany({ where: { documentId: body.document.id } });
    expect(perms).toHaveLength(2);
    expect(perms.map((p) => p.level).sort()).toEqual(["edit", "view"]);
  });
});
