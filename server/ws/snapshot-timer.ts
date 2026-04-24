import * as Y from "yjs";
import { db } from "../db.js";
import { getLiveYDoc } from "./yjs-handler.js";

let IDLE_MS = 5 * 60 * 1000;
const MAX_AUTO_PER_DOC = 20;

const timers = new Map<string, NodeJS.Timeout>();

export function __setIdleMsForTests(ms: number): void {
  IDLE_MS = ms;
}

export function resetIdleTimer(docId: string): void {
  clearIdleTimer(docId);
  const t = setTimeout(() => {
    timers.delete(docId);
    void createAutoSnapshot(docId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[snapshot-timer] auto-snapshot failed", docId, err);
    });
  }, IDLE_MS);
  if (typeof t.unref === "function") t.unref();
  timers.set(docId, t);
}

export function clearIdleTimer(docId: string): void {
  const t = timers.get(docId);
  if (t) {
    clearTimeout(t);
    timers.delete(docId);
  }
}

export async function triggerIdleSnapshotForTests(docId: string): Promise<void> {
  await createAutoSnapshot(docId);
}

async function createAutoSnapshot(docId: string): Promise<void> {
  const live = getLiveYDoc(docId);
  let state: Uint8Array;
  if (live) {
    state = Y.encodeStateAsUpdate(live);
  } else {
    const doc = await db.document.findUnique({ where: { id: docId } });
    if (!doc) return; // doc deleted; nothing to snapshot
    state = doc.yjsState ? new Uint8Array(doc.yjsState) : new Uint8Array();
  }

  await db.snapshot.create({
    data: {
      documentId: docId,
      yjsState: Buffer.from(state),
      name: null,
    },
  });

  // Rolling buffer: trim auto-snapshots over the cap
  const autos = await db.snapshot.findMany({
    where: { documentId: docId, name: null },
    orderBy: { takenAt: "desc" },
    select: { id: true },
  });
  if (autos.length > MAX_AUTO_PER_DOC) {
    const toDelete = autos.slice(MAX_AUTO_PER_DOC).map((s) => s.id);
    await db.snapshot.deleteMany({ where: { id: { in: toDelete } } });
  }
}
