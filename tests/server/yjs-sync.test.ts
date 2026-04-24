import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import { makeTestApp, resetDb } from "../helpers.js";
import { connectYClient, waitFor } from "../yjs-client-harness.js";

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

    a.ydoc.getText("content").insert(0, "hello");

    await waitFor(() => b.ydoc.getText("content").toString() === "hello");

    expect(b.ydoc.getText("content").toString()).toBe("hello");
    a.ws.close();
    b.ws.close();
  });
});
