import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";
import {
  __setIdleMsForTests,
  resetIdleTimer,
  clearIdleTimer,
  triggerIdleSnapshotForTests,
} from "../../server/ws/snapshot-timer.js";

const IDLE_MS_DEFAULT = 5 * 60 * 1000;

describe("snapshot-timer", () => {
  let app: FastifyInstance;
  let documentId: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    __setIdleMsForTests(50);
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
  });

  afterEach(() => {
    __setIdleMsForTests(IDLE_MS_DEFAULT);
    clearIdleTimer(documentId);
  });

  it("creates an auto-snapshot after the idle window expires", async () => {
    resetIdleTimer(documentId);
    // Wait 3x the shortened idle window
    await new Promise((r) => setTimeout(r, 150));
    const snaps = await db.snapshot.findMany({ where: { documentId } });
    expect(snaps).toHaveLength(1);
    expect(snaps[0].name).toBeNull();
  });

  it("rolling buffer: keeps only the latest 20 auto-snapshots", async () => {
    for (let i = 0; i < 25; i++) {
      await triggerIdleSnapshotForTests(documentId);
    }
    const snaps = await db.snapshot.findMany({
      where: { documentId, name: null },
    });
    expect(snaps).toHaveLength(20);
  });

  it("rolling buffer does NOT delete named snapshots", async () => {
    // Insert 1 named snapshot directly
    await db.snapshot.create({
      data: {
        documentId,
        yjsState: Buffer.from(new Uint8Array()),
        name: "keep-me",
      },
    });

    for (let i = 0; i < 25; i++) {
      await triggerIdleSnapshotForTests(documentId);
    }

    const named = await db.snapshot.findMany({
      where: { documentId, name: { not: null } },
    });
    expect(named.length).toBeGreaterThanOrEqual(1);
    expect(named.some((s) => s.name === "keep-me")).toBe(true);
  });

  it("clearIdleTimer cancels a pending snapshot", async () => {
    resetIdleTimer(documentId);
    clearIdleTimer(documentId);
    await new Promise((r) => setTimeout(r, 150));
    const snaps = await db.snapshot.findMany({ where: { documentId } });
    expect(snaps).toHaveLength(0);
  });
});
