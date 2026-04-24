import * as Y from "yjs";
import { Prisma } from "@prisma/client";
import { db } from "../db.js";

const DEBOUNCE_MS = 2_000;
const pending = new Map<string, NodeJS.Timeout>();

function isRecordNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

export async function loadDocState(docId: string): Promise<Uint8Array | null> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) return null;
  if (!doc.yjsState) return null;
  return new Uint8Array(doc.yjsState);
}

async function writeState(docId: string, state: Uint8Array) {
  try {
    await db.document.update({
      where: { id: docId },
      data: { yjsState: Buffer.from(state) },
    });
  } catch (err) {
    if (isRecordNotFound(err)) {
      // Document was deleted while we were still connected — nothing to persist.
      return;
    }
    throw err;
  }
}

export function schedulePersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pending.delete(docId);
    try {
      await writeState(docId, Y.encodeStateAsUpdate(ydoc));
    } catch (err) {
      console.error("[persistence] failed to save Y.Doc for", docId, err);
    }
  }, DEBOUNCE_MS);
  timer.unref();

  pending.set(docId, timer);
}

export async function flushPersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) {
    clearTimeout(existing);
    pending.delete(docId);
  }
  await writeState(docId, Y.encodeStateAsUpdate(ydoc));
}
