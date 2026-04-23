import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import { encoding, decoding } from "lib0";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

const MSG_SYNC = 0;

async function connectClient(url: string) {
  const ydoc = new Y.Doc();
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.on("message", (data: ArrayBuffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const mt = decoding.readVarUint(decoder);
    if (mt === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, null);
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder));
    }
  });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    if (ws.readyState === WebSocket.OPEN) ws.send(encoding.toUint8Array(encoder));
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      ws.send(encoding.toUint8Array(encoder));
      resolve();
    });
    ws.once("error", reject);
  });

  return { ydoc, ws };
}

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
    const client = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    client.ydoc.getText("content").insert(0, "persisted hello");

    await new Promise((r) => setTimeout(r, 300));
    client.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const doc = await db.document.findUnique({ where: { id: documentId } });
    expect(doc!.yjsState).not.toBeNull();
    expect(doc!.yjsState!.byteLength).toBeGreaterThan(0);

    // Rehydrate from saved state
    const restored = new Y.Doc();
    Y.applyUpdate(restored, new Uint8Array(doc!.yjsState!));
    expect(restored.getText("content").toString()).toBe("persisted hello");
  });

  it("rehydrates state on a new connection after all clients disconnected", async () => {
    const a = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    a.ydoc.getText("content").insert(0, "round trip");
    await new Promise((r) => setTimeout(r, 300));
    a.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const b = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    await new Promise((r) => setTimeout(r, 300));
    expect(b.ydoc.getText("content").toString()).toBe("round trip");
    b.ws.close();
  });
});
