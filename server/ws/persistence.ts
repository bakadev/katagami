import * as Y from "yjs";
import { db } from "../db.js";

const DEBOUNCE_MS = 2_000;
const pending = new Map<string, NodeJS.Timeout>();

export async function loadDocState(docId: string): Promise<Uint8Array | null> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) return null;
  if (!doc.yjsState) return null;
  return new Uint8Array(doc.yjsState);
}

export function schedulePersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pending.delete(docId);
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await db.document.update({
        where: { id: docId },
        data: { yjsState: Buffer.from(state) },
      });
    } catch (err) {
      console.error("[persistence] failed to save Y.Doc for", docId, err);
    }
  }, DEBOUNCE_MS);
  // Don't keep the Node event loop alive solely for a pending flush;
  // close handlers explicitly call flushPersist() when we need durability.
  timer.unref();

  pending.set(docId, timer);
}

export async function flushPersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) {
    clearTimeout(existing);
    pending.delete(docId);
  }
  const state = Y.encodeStateAsUpdate(ydoc);
  await db.document.update({
    where: { id: docId },
    data: { yjsState: Buffer.from(state) },
  });
}
