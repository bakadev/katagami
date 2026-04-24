import * as Y from "yjs";
import type { Reply, Thread } from "./types";

const MAP_NAME = "threads";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export function getThreadsMap(ydoc: Y.Doc): Y.Map<string> {
  return ydoc.getMap<string>(MAP_NAME);
}

function readThread(map: Y.Map<string>, id: string): Thread | null {
  const raw = map.get(id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Thread;
  } catch {
    return null;
  }
}

function writeThread(map: Y.Map<string>, thread: Thread): void {
  map.set(thread.id, JSON.stringify(thread));
}

export function getThread(ydoc: Y.Doc, id: string): Thread | null {
  return readThread(getThreadsMap(ydoc), id);
}

export function listThreads(ydoc: Y.Doc): Thread[] {
  const map = getThreadsMap(ydoc);
  const threads: Thread[] = [];
  for (const id of map.keys()) {
    const t = readThread(map, id);
    if (t) threads.push(t);
  }
  return threads;
}

export function createThread(
  ydoc: Y.Doc,
  input: Pick<Thread, "authorName" | "authorColor" | "body" | "createdAt">,
): string {
  const id = randomId();
  const thread: Thread = {
    id,
    authorName: input.authorName,
    authorColor: input.authorColor,
    body: input.body,
    createdAt: input.createdAt,
    resolved: false,
    replies: [],
  };
  ydoc.transact(() => {
    writeThread(getThreadsMap(ydoc), thread);
  });
  return id;
}

export function addReply(
  ydoc: Y.Doc,
  threadId: string,
  input: Omit<Reply, "id">,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.replies.push({ id: randomId(), ...input });
  ydoc.transact(() => writeThread(map, thread));
}

export function setResolved(
  ydoc: Y.Doc,
  threadId: string,
  resolved: boolean,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.resolved = resolved;
  ydoc.transact(() => writeThread(map, thread));
}

export function deleteReply(
  ydoc: Y.Doc,
  threadId: string,
  replyId: string,
): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  thread.replies = thread.replies.filter((r) => r.id !== replyId);
  ydoc.transact(() => {
    // If rootDeleted and no replies remain, remove the whole thread.
    if (thread.rootDeleted && thread.replies.length === 0) {
      map.delete(threadId);
    } else {
      writeThread(map, thread);
    }
  });
}

export function deleteThreadRoot(ydoc: Y.Doc, threadId: string): void {
  const map = getThreadsMap(ydoc);
  const thread = readThread(map, threadId);
  if (!thread) return;
  ydoc.transact(() => {
    if (thread.replies.length === 0) {
      map.delete(threadId);
      return;
    }
    thread.body = "";
    thread.rootDeleted = true;
    writeThread(map, thread);
  });
}
