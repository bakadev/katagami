import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { connectYClient, waitFor } from "../yjs-client-harness.js";
import { db } from "../../server/db.js";

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

    const a = await connectYClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const b = await connectYClient(`${baseUrl}/ws/${docId}?key=${editToken}`);

    a.ydoc.getText("content").insert(0, "Alice wrote this. ");
    await waitFor(() => b.ydoc.getText("content").toString() === "Alice wrote this. ");

    b.ydoc.getText("content").insert(
      b.ydoc.getText("content").length,
      "Bob added this.",
    );
    await waitFor(
      () => a.ydoc.getText("content").toString() === "Alice wrote this. Bob added this.",
    );

    expect(a.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    expect(b.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");

    a.ws.close();
    b.ws.close();

    await waitFor(async () => {
      const doc = await db.document.findUnique({ where: { id: docId } });
      return !!doc?.yjsState && doc.yjsState.byteLength > 0;
    });

    const c = await connectYClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    await waitFor(
      () => c.ydoc.getText("content").toString() === "Alice wrote this. Bob added this.",
    );
    expect(c.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    c.ws.close();
  });

  it("view-only client cannot apply updates", async () => {
    const httpRes = await app.inject({ method: "POST", url: "/api/projects" });
    const project = httpRes.json();
    const docId = project.document.id;
    const editToken = project.permissions.editToken;
    const viewToken = project.permissions.viewToken;

    const editor = await connectYClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const viewer = await connectYClient(`${baseUrl}/ws/${docId}?key=${viewToken}`);

    editor.ydoc.getText("content").insert(0, "editor-only update");
    await waitFor(
      () => viewer.ydoc.getText("content").toString() === "editor-only update",
    );
    expect(viewer.ydoc.getText("content").toString()).toBe("editor-only update");

    // Viewer attempts to write; server should drop the update.
    viewer.ydoc.getText("content").insert(0, "viewer tried ");

    // Editor makes a follow-up edit. Once the viewer sees the follow-up,
    // any updates from the viewer that the server was going to accept would
    // already be on the editor. Because the server drops view-only writes,
    // the editor should only have the two editor-originated texts.
    const followUp = " (editor follow-up)";
    editor.ydoc.getText("content").insert(
      editor.ydoc.getText("content").length,
      followUp,
    );
    const expectedFinal = "editor-only update" + followUp;
    await waitFor(
      () => viewer.ydoc.getText("content").toString().includes(followUp),
    );

    // Viewer's own local doc will show its uncommitted "viewer tried " prefix
    // plus whatever the server has sent it — we only care that the editor
    // never saw the viewer's write.
    expect(editor.ydoc.getText("content").toString()).toBe(expectedFinal);

    editor.ws.close();
    viewer.ws.close();
  });
});
