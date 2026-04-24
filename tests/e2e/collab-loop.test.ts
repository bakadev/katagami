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

describe("full collab loop", () => {
  let app: FastifyInstance;
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
  });

  it("create → two clients edit → sync → persist → rehydrate in new client", async () => {
    const httpRes = await app.inject({ method: "POST", url: "/api/projects" });
    const project = httpRes.json();
    const docId = project.document.id;
    const editToken = project.permissions.editToken;

    const a = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const b = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);

    a.ydoc.getText("content").insert(0, "Alice wrote this. ");
    await new Promise((r) => setTimeout(r, 200));
    b.ydoc.getText("content").insert(b.ydoc.getText("content").length, "Bob added this.");
    await new Promise((r) => setTimeout(r, 200));

    expect(a.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    expect(b.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");

    a.ws.close();
    b.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const stored = await db.document.findUnique({ where: { id: docId } });
    expect(stored!.yjsState).not.toBeNull();
    expect(stored!.yjsState!.byteLength).toBeGreaterThan(0);

    const c = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    await new Promise((r) => setTimeout(r, 300));
    expect(c.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    c.ws.close();
  });

  it("view-only client cannot apply updates", async () => {
    const httpRes = await app.inject({ method: "POST", url: "/api/projects" });
    const project = httpRes.json();
    const docId = project.document.id;
    const editToken = project.permissions.editToken;
    const viewToken = project.permissions.viewToken;

    const editor = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const viewer = await connectClient(`${baseUrl}/ws/${docId}?key=${viewToken}`);

    editor.ydoc.getText("content").insert(0, "editor-only update");
    await new Promise((r) => setTimeout(r, 300));

    // Viewer sees the edit (because they successfully requested sync step 2)
    expect(viewer.ydoc.getText("content").toString()).toBe("editor-only update");

    // Viewer tries to write — server drops the update
    viewer.ydoc.getText("content").insert(0, "viewer tried ");
    await new Promise((r) => setTimeout(r, 300));

    // Editor should NOT see the viewer's write
    expect(editor.ydoc.getText("content").toString()).toBe("editor-only update");

    editor.ws.close();
    viewer.ws.close();
  });
});
