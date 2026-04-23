import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { validatePermissionToken } from "../../server/auth/permission-token.js";

describe("validatePermissionToken", () => {
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

  it("returns 'edit' for a valid edit token", async () => {
    expect(await validatePermissionToken(documentId, editToken)).toBe("edit");
  });

  it("returns 'view' for a valid view token", async () => {
    expect(await validatePermissionToken(documentId, viewToken)).toBe("view");
  });

  it("returns null for a wrong token", async () => {
    expect(await validatePermissionToken(documentId, "nonsense")).toBeNull();
  });

  it("returns null for a token that belongs to a different doc", async () => {
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const otherBody = res.json();
    expect(await validatePermissionToken(documentId, otherBody.permissions.editToken)).toBeNull();
  });

  it("returns null for missing token", async () => {
    expect(await validatePermissionToken(documentId, undefined)).toBeNull();
    expect(await validatePermissionToken(documentId, "")).toBeNull();
  });
});
