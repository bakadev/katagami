import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import { validatePermissionToken } from "../auth/permission-token.js";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface Room {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<WebSocket>;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(docId: string): Room {
  let room = rooms.get(docId);
  if (!room) {
    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);
    room = { ydoc, awareness, connections: new Set() };
    rooms.set(docId, room);
  }
  return room;
}

function broadcast(room: Room, message: Uint8Array, exclude?: WebSocket) {
  for (const conn of room.connections) {
    if (conn === exclude) continue;
    if (conn.readyState === 1) conn.send(message);
  }
}

export function registerYjsHandler(app: FastifyInstance) {
  app.get<{ Params: { docId: string }; Querystring: { key?: string } }>(
    "/ws/:docId",
    {
      websocket: true,
      preValidation: async (req, reply) => {
        const { docId } = req.params as { docId: string };
        const { key } = req.query as { key?: string };
        const level = await validatePermissionToken(docId, key);
        if (!level) {
          await reply.code(403).send({ error: "forbidden" });
        } else {
          // Attach level to request for use in handler
          (req as typeof req & { permLevel: string }).permLevel = level;
        }
      },
    },
    (socket, req) => {
      const { docId } = req.params;
      const canEdit = (req as typeof req & { permLevel: string }).permLevel === "edit";

      const room = getOrCreateRoom(docId);
      room.connections.add(socket);

      // Send sync step 1
      {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeSyncStep1(encoder, room.ydoc);
        socket.send(encoding.toUint8Array(encoder));
      }

      // Send current awareness states
      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            room.awareness,
            Array.from(awarenessStates.keys()),
          ),
        );
        socket.send(encoding.toUint8Array(encoder));
      }

      const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
        if (origin === socket) return;
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeUpdate(encoder, update);
        if (socket.readyState === 1) {
          socket.send(encoding.toUint8Array(encoder));
        }
      };
      room.ydoc.on("update", docUpdateHandler);

      const awarenessUpdateHandler = (
        {
          added,
          updated,
          removed,
        }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin === socket) return;
        const changed = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed),
        );
        if (socket.readyState === 1) {
          socket.send(encoding.toUint8Array(encoder));
        }
      };
      room.awareness.on("update", awarenessUpdateHandler);

      socket.on("message", (data: ArrayBuffer | Buffer) => {
        const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
        const decoder = decoding.createDecoder(buf);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === MSG_SYNC) {
          if (!canEdit) {
            // view-only clients: respond to step 1 with step 2, ignore everything else
            const subType = decoding.readVarUint(decoder);
            if (subType === syncProtocol.messageYjsSyncStep1) {
              const state = decoding.readVarUint8Array(decoder);
              const encoder2 = encoding.createEncoder();
              encoding.writeVarUint(encoder2, MSG_SYNC);
              syncProtocol.writeSyncStep2(encoder2, room.ydoc, state);
              socket.send(encoding.toUint8Array(encoder2));
            }
            return;
          }

          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, socket);
          if (encoding.length(encoder) > 1) {
            socket.send(encoding.toUint8Array(encoder));
          }

          // Re-broadcast the original update to peers so they stay in sync
          if (buf.length > 1) {
            broadcast(room, buf, socket);
          }
        } else if (messageType === MSG_AWARENESS) {
          const awarenessUpdate = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, socket);
        }
      });

      socket.on("close", () => {
        room.ydoc.off("update", docUpdateHandler);
        room.awareness.off("update", awarenessUpdateHandler);
        awarenessProtocol.removeAwarenessStates(
          room.awareness,
          [room.awareness.clientID],
          socket,
        );
        room.connections.delete(socket);
        if (room.connections.size === 0) {
          room.ydoc.destroy();
          room.awareness.destroy();
          rooms.delete(docId);
        }
      });
    },
  );
}
