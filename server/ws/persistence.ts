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

export interface Editor {
  name: string;
  color: string;
}

/** Who last changed each live document, from their awareness state. */
const lastEditors = new Map<string, Editor>();

export function noteEditor(docId: string, editor: Editor) {
  lastEditors.set(docId, editor);
}

export function forgetEditor(docId: string) {
  lastEditors.delete(docId);
}

/**
 * Open comment threads and suggestions, read from the Yjs maps the client
 * writes (see src/lib/comments/threads.ts and src/lib/suggestions). Stored
 * on the document row so the home page can list counts without Yjs.
 */
export function countOpenItems(ydoc: Y.Doc): { openComments: number; openSuggestions: number } {
  let openComments = 0;
  ydoc.getMap<string>("threads").forEach((raw) => {
    try {
      const t = JSON.parse(raw) as { resolved?: boolean };
      if (!t.resolved) openComments++;
    } catch {
      // ignore malformed entries
    }
  });
  return { openComments, openSuggestions: ydoc.getMap<string>("suggestions").size };
}

async function writeState(docId: string, ydoc: Y.Doc) {
  const state = Y.encodeStateAsUpdate(ydoc);
  const editor = lastEditors.get(docId);
  try {
    await db.document.update({
      where: { id: docId },
      data: {
        yjsState: Buffer.from(state),
        ...countOpenItems(ydoc),
        ...(editor ? { lastEditedByName: editor.name, lastEditedByColor: editor.color } : {}),
      },
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
      await writeState(docId, ydoc);
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
  await writeState(docId, ydoc);
}
