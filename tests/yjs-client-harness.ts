import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import { encoding, decoding } from "lib0";

const MSG_SYNC = 0;

export interface YjsTestClient {
  ydoc: Y.Doc;
  ws: WebSocket;
}

export async function connectYClient(url: string): Promise<YjsTestClient> {
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

/**
 * Polls `predicate` every 20ms until it returns true or `timeoutMs` elapses.
 * Replaces bare setTimeout() "sync wait" patterns in integration tests with
 * deterministic condition-based waits.
 */
export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await predicate()) return;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 20));
  }
}
