// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import * as Y from "yjs";
import {
  createThread,
  addReply,
  setResolved,
  deleteReply,
  deleteThreadRoot,
  getThread,
  listThreads,
} from "../../src/lib/comments/threads";

describe("threads Y.Map helpers", () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
  });

  it("creates and reads a thread", () => {
    const id = createThread(ydoc, {
      authorName: "Sakura",
      authorColor: "#e11d48",
      body: "Nice doc!",
      createdAt: 1000,
    });
    const thread = getThread(ydoc, id);
    expect(thread).toMatchObject({
      id,
      authorName: "Sakura",
      authorColor: "#e11d48",
      body: "Nice doc!",
      createdAt: 1000,
      resolved: false,
      replies: [],
    });
  });

  it("adds replies", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "root",
      createdAt: 1,
    });
    addReply(ydoc, id, {
      authorName: "B",
      authorColor: "#fff",
      body: "reply",
      createdAt: 2,
    });
    const t = getThread(ydoc, id)!;
    expect(t.replies).toHaveLength(1);
    expect(t.replies[0]).toMatchObject({
      authorName: "B",
      body: "reply",
      createdAt: 2,
    });
    expect(t.replies[0].id).toMatch(/[0-9a-f-]{36}/);
  });

  it("toggles resolved", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    setResolved(ydoc, id, true);
    expect(getThread(ydoc, id)!.resolved).toBe(true);
    setResolved(ydoc, id, false);
    expect(getThread(ydoc, id)!.resolved).toBe(false);
  });

  it("deletes a reply", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    addReply(ydoc, id, { authorName: "C", authorColor: "#222", body: "y", createdAt: 3 });
    const replyId = getThread(ydoc, id)!.replies[0].id;
    deleteReply(ydoc, id, replyId);
    const t = getThread(ydoc, id)!;
    expect(t.replies).toHaveLength(1);
    expect(t.replies[0].body).toBe("y");
  });

  it("deletes a root with no replies → removes whole thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    deleteThreadRoot(ydoc, id);
    expect(getThread(ydoc, id)).toBeNull();
  });

  it("deletes a root with replies → marks rootDeleted, keeps thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    deleteThreadRoot(ydoc, id);
    const t = getThread(ydoc, id);
    expect(t).not.toBeNull();
    expect(t!.rootDeleted).toBe(true);
    expect(t!.body).toBe("");
    expect(t!.replies).toHaveLength(1);
  });

  it("deletes last reply on a rootDeleted thread → removes whole thread", () => {
    const id = createThread(ydoc, {
      authorName: "A",
      authorColor: "#000",
      body: "r",
      createdAt: 1,
    });
    addReply(ydoc, id, { authorName: "B", authorColor: "#111", body: "x", createdAt: 2 });
    deleteThreadRoot(ydoc, id);
    const replyId = getThread(ydoc, id)!.replies[0].id;
    deleteReply(ydoc, id, replyId);
    expect(getThread(ydoc, id)).toBeNull();
  });

  it("lists threads in insertion order", () => {
    const a = createThread(ydoc, { authorName: "A", authorColor: "#000", body: "1", createdAt: 1 });
    const b = createThread(ydoc, { authorName: "B", authorColor: "#111", body: "2", createdAt: 2 });
    const ids = listThreads(ydoc).map((t) => t.id);
    expect(ids).toEqual([a, b]);
  });
});
