import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import * as Y from "yjs";
import { makeTestApp, resetDb } from "../helpers.js";
import { connectYClient, waitFor } from "../yjs-client-harness.js";
import { db } from "../../server/db.js";

describe("Yjs persistence", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let baseUrl: string;

  beforeAll(async () => {
    app = await makeTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address();
    if (typeof addr === "string" || !addr) throw new Error("bad address");
    baseUrl = `ws://127.0.0.1:${addr.port}`;
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

  it("persists Y.Doc state on disconnect", async () => {
    const client = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    client.ydoc.getText("content").insert(0, "persisted hello");

    client.ws.close();

    // Wait for flushPersist to complete — poll the DB.
    await waitFor(async () => {
      const doc = await db.document.findUnique({ where: { id: documentId } });
      return !!doc?.yjsState && doc.yjsState.byteLength > 0;
    });

    const doc = await db.document.findUnique({ where: { id: documentId } });
    expect(doc!.yjsState).not.toBeNull();
    expect(doc!.yjsState!.byteLength).toBeGreaterThan(0);

    const restored = new Y.Doc();
    Y.applyUpdate(restored, new Uint8Array(doc!.yjsState!));
    expect(restored.getText("content").toString()).toBe("persisted hello");
  });

  it("rehydrates state on a new connection after all clients disconnected", async () => {
    const a = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    a.ydoc.getText("content").insert(0, "round trip");
    a.ws.close();

    await waitFor(async () => {
      const doc = await db.document.findUnique({ where: { id: documentId } });
      return !!doc?.yjsState && doc.yjsState.byteLength > 0;
    });

    const b = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    await waitFor(() => b.ydoc.getText("content").toString() === "round trip");
    expect(b.ydoc.getText("content").toString()).toBe("round trip");
    b.ws.close();
  });
});
