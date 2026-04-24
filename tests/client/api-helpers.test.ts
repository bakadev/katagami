// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listSnapshots,
  createSnapshot,
  restoreSnapshot,
  renameSnapshot,
  deleteSnapshot,
} from "~/lib/api/snapshots";
import { updateDocumentTitle } from "~/lib/api/documents";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("snapshots API helpers", () => {
  it("listSnapshots calls GET with key query", async () => {
    const spy = mockFetch(200, { snapshots: [] });
    await listSnapshots("doc-1", "key-1");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots?key=key-1"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createSnapshot POSTs name in body when provided", async () => {
    const spy = mockFetch(201, {
      id: "s1", name: "v1", takenAt: new Date().toISOString(),
      takenByName: null, preview: "",
    });
    const s = await createSnapshot("doc-1", "key-1", "v1");
    expect(s.name).toBe("v1");
    const callInit = (spy.mock.calls[0]?.[1] ?? {}) as RequestInit;
    expect(callInit.method).toBe("POST");
    expect(callInit.body).toBe(JSON.stringify({ name: "v1" }));
  });

  it("createSnapshot POSTs empty object when name is omitted", async () => {
    const spy = mockFetch(201, {
      id: "s1", name: null, takenAt: new Date().toISOString(),
      takenByName: null, preview: "",
    });
    await createSnapshot("doc-1", "key-1");
    const callInit = (spy.mock.calls[0]?.[1] ?? {}) as RequestInit;
    expect(callInit.body).toBe(JSON.stringify({}));
  });

  it("restoreSnapshot returns preRestoreSnapshotId", async () => {
    mockFetch(200, { restoredSnapshotId: "s1", preRestoreSnapshotId: "s0" });
    const r = await restoreSnapshot("doc-1", "s1", "key-1");
    expect(r.preRestoreSnapshotId).toBe("s0");
  });

  it("renameSnapshot PATCHes name", async () => {
    const spy = mockFetch(200, {
      id: "s1", name: "renamed", takenAt: new Date().toISOString(),
      takenByName: null, preview: "",
    });
    const r = await renameSnapshot("doc-1", "s1", "key-1", "renamed");
    expect(r.name).toBe("renamed");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots/s1?key=key-1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("deleteSnapshot DELETEs and resolves on 204", async () => {
    const spy = mockFetch(204, undefined);
    await expect(deleteSnapshot("doc-1", "s1", "key-1")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots/s1?key=key-1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch(403, { error: "view only" });
    await expect(createSnapshot("doc-1", "view-key", "v1")).rejects.toThrow();
  });

  it("URL-encodes docId and key with special characters", async () => {
    const spy = mockFetch(200, { snapshots: [] });
    await listSnapshots("doc/with slash", "key with space");
    const calledUrl = String(spy.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("doc%2Fwith%20slash");
    expect(calledUrl).toContain("key%20with%20space");
  });
});

describe("documents API helpers", () => {
  it("updateDocumentTitle PATCHes with title body", async () => {
    const spy = mockFetch(200, {
      id: "doc-1", title: "New", updatedAt: new Date().toISOString(),
    });
    const r = await updateDocumentTitle("doc-1", "key-1", "New");
    expect(r.title).toBe("New");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1?key=key-1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "New" }) }),
    );
  });

  it("updateDocumentTitle can clear title with null", async () => {
    const spy = mockFetch(200, {
      id: "doc-1", title: null, updatedAt: new Date().toISOString(),
    });
    const r = await updateDocumentTitle("doc-1", "key-1", null);
    expect(r.title).toBeNull();
    const callInit = (spy.mock.calls[0]?.[1] ?? {}) as RequestInit;
    expect(callInit.body).toBe(JSON.stringify({ title: null }));
  });

  it("updateDocumentTitle throws on non-ok", async () => {
    mockFetch(400, { error: "title too long" });
    await expect(updateDocumentTitle("doc-1", "key-1", "a".repeat(121))).rejects.toThrow();
  });
});
