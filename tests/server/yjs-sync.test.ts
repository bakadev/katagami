import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import { encoding, decoding } from "lib0";
import { makeTestApp, resetDb } from "../helpers.js";

const MSG_SYNC = 0;

async function connectYClient(url: string): Promise<{ ydoc: Y.Doc; ws: WebSocket }> {
  const ydoc = new Y.Doc();
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.on("message", (data: ArrayBuffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);
    if (messageType === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, null);
      if (encoding.length(encoder) > 1) {
        ws.send(encoding.toUint8Array(encoder));
      }
    }
  });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(encoding.toUint8Array(encoder));
    }
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

describe("Yjs WebSocket sync", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let baseUrl: string;

  beforeAll(async () => {
    app = await makeTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address();
    if (typeof address === "string" || !address) throw new Error("bad address");
    baseUrl = `ws://127.0.0.1:${address.port}`;
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

  it("rejects connections without a token", async () => {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`${baseUrl}/ws/${documentId}`);
      ws.on("unexpected-response", (_req, res) => {
        expect(res.statusCode).toBe(403);
        ws.terminate();
        resolve();
      });
      ws.on("error", () => resolve());
    });
  });

  it("accepts a connection with an edit token", async () => {
    const { ws } = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("syncs an edit from one client to another", async () => {
    const a = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    const b = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);

    const textA = a.ydoc.getText("content");
    textA.insert(0, "hello");

    await new Promise((r) => setTimeout(r, 200));

    expect(b.ydoc.getText("content").toString()).toBe("hello");
    a.ws.close();
    b.ws.close();
  });
});
