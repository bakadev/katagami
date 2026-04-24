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
    expect(res.statusCode).toBe(403);
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

describe("POST /api/docs/:id/snapshots/:snapId/restore", () => {
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

  it("creates a pre-restore auto-snapshot before applying the restore", async () => {
    // Create named snapshot "v1"
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    expect(createRes.statusCode).toBe(201);
    const snapId = createRes.json().id;

    // Restore that snapshot
    const restoreRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots/${snapId}/restore?key=${editToken}`,
    });
    expect(restoreRes.statusCode).toBe(200);
    const restoreBody = restoreRes.json();
    expect(restoreBody.restoredSnapshotId).toBe(snapId);
    expect(typeof restoreBody.preRestoreSnapshotId).toBe("string");

    // GET snapshots — list must contain "v1" AND at least one null-named auto-snapshot
    const listRes = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
    });
    expect(listRes.statusCode).toBe(200);
    const snaps = listRes.json().snapshots;
    const named = snaps.filter((s: { name: string | null }) => s.name === "v1");
    const auto = snaps.filter((s: { name: string | null }) => s.name === null);
    expect(named.length).toBeGreaterThanOrEqual(1);
    expect(auto.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects restore with view token", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots/${snapId}/restore?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 when snapshot does not belong to this doc", async () => {
    // Create a second doc
    const res2 = await app.inject({ method: "POST", url: "/api/projects" });
    const body2 = res2.json();
    const doc2Id = body2.document.id;
    const editToken2 = body2.permissions.editToken;

    // Create a snapshot on doc2
    const snapRes = await app.inject({
      method: "POST",
      url: `/api/docs/${doc2Id}/snapshots?key=${editToken2}`,
      payload: { name: "doc2-snap" },
    });
    const snap2Id = snapRes.json().id;

    // Try to restore doc2's snapshot via doc1's URL
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots/${snap2Id}/restore?key=${editToken}`,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /api/docs/:id/snapshots/:snapId", () => {
  let app: FastifyInstance;
  let documentId: string;
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
    documentId = body.document.id;
    editToken = body.permissions.editToken;
  });

  it("promotes an auto-snapshot to named", async () => {
    // Create unnamed snapshot
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: {},
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().name).toBeNull();
    const snapId = createRes.json().id;

    // PATCH to rename
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: "Promoted" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Promoted");
  });

  it("rejects empty name (whitespace only)", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: "   " },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects non-string name", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: 42 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects name longer than 80 chars", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: "a".repeat(81) },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/docs/:id/snapshots/:snapId", () => {
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

  it("deletes a named snapshot", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "to-delete" },
    });
    expect(createRes.statusCode).toBe(201);
    const snapId = createRes.json().id;

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
    });
    expect(delRes.statusCode).toBe(204);

    // Verify it's gone from the list
    const listRes = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
    });
    const snaps = listRes.json().snapshots;
    expect(snaps.find((s: { id: string }) => s.id === snapId)).toBeUndefined();
  });

  it("rejects deleting an auto-snapshot", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: {},
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().name).toBeNull();
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects deletion with view token", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/api/docs/${documentId}/snapshots?key=${editToken}`,
      payload: { name: "named" },
    });
    const snapId = createRes.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/docs/${documentId}/snapshots/${snapId}?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 for snapshot belonging to different doc", async () => {
    // Create a second doc
    const res2 = await app.inject({ method: "POST", url: "/api/projects" });
    const body2 = res2.json();
    const doc2Id = body2.document.id;
    const editToken2 = body2.permissions.editToken;

    // Create a snapshot on doc2
    const snapRes = await app.inject({
      method: "POST",
      url: `/api/docs/${doc2Id}/snapshots?key=${editToken2}`,
      payload: { name: "doc2-named" },
    });
    const snap2Id = snapRes.json().id;

    // Try to delete doc2's snapshot via doc1's URL
    const res = await app.inject({
      method: "DELETE",
      url: `/api/docs/${documentId}/snapshots/${snap2Id}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(404);
  });
});
