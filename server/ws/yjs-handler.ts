import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import { validatePermissionToken } from "../auth/permission-token.js";
import type { PermissionLevel } from "../../shared/types.js";
import { loadDocState, schedulePersist, flushPersist } from "./persistence.js";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface Room {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<WebSocket>;
  persistListener: (update: Uint8Array) => void;
}

const rooms = new Map<string, Room>();

async function getOrCreateRoom(docId: string): Promise<Room> {
  let room = rooms.get(docId);
  if (room) return room;

  const ydoc = new Y.Doc();
  const existingState = await loadDocState(docId);
  if (existingState) Y.applyUpdate(ydoc, existingState);

  const awareness = new awarenessProtocol.Awareness(ydoc);
  const persistListener = () => schedulePersist(docId, ydoc);
  ydoc.on("update", persistListener);

  room = { ydoc, awareness, connections: new Set(), persistListener };
  rooms.set(docId, room);
  return room;
}

interface AuthedRequest extends FastifyRequest {
  permLevel?: PermissionLevel;
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
          await reply.code(403).send({
            error: "forbidden",
            message: "Invalid or missing permission token",
          });
          return;
        }
        (req as AuthedRequest).permLevel = level;
      },
    },
    async (socket, req) => {
      const { docId } = req.params;
      const permLevel = (req as AuthedRequest).permLevel;
      const canEdit = permLevel === "edit";

      // Buffer messages that arrive while we're loading the room from Postgres.
      const earlyMessages: Array<ArrayBuffer | Buffer> = [];
      const earlyHandler = (data: ArrayBuffer | Buffer) => earlyMessages.push(data);
      socket.on("message", earlyHandler);

      const room = await getOrCreateRoom(docId);
      socket.off("message", earlyHandler);
      room.connections.add(socket);

      // Tracks awareness clientIDs this socket introduced, so we can
      // remove them when the socket disconnects.
      const controlledClientIds = new Set<number>();

      // Send sync step 1 to kick off state exchange
      {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeSyncStep1(encoder, room.ydoc);
        socket.send(encoding.toUint8Array(encoder));
      }

      // Send current awareness states to the new connection
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
        // Track IDs introduced/removed by this socket. Yjs passes the socket
        // as origin when we call applyAwarenessUpdate(_, _, socket).
        if (origin === socket) {
          added.forEach((id) => controlledClientIds.add(id));
          removed.forEach((id) => controlledClientIds.delete(id));
          return; // don't echo our own updates
        }
        // Broadcast peer awareness change to this socket
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
        try {
          const buf =
            data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
          const decoder = decoding.createDecoder(buf);
          const messageType = decoding.readVarUint(decoder);

          if (messageType === MSG_SYNC) {
            if (!canEdit) {
              // view-only clients: respond to step 1 with step 2, ignore everything else
              const subType = decoding.readVarUint(decoder);
              if (subType === syncProtocol.messageYjsSyncStep1) {
                const state = decoding.readVarUint8Array(decoder);
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, MSG_SYNC);
                syncProtocol.writeSyncStep2(encoder, room.ydoc, state);
                socket.send(encoding.toUint8Array(encoder));
              }
              return;
            }

            // Edit path: apply the sync message. readSyncMessage handles
            // step1/step2/update sub-types, applies updates to room.ydoc
            // (which fires the "update" event → docUpdateHandler broadcasts
            // a framed writeUpdate to every other peer), and writes any
            // needed reply (e.g. step2 after step1) to `encoder`.
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, MSG_SYNC);
            syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, socket);
            if (encoding.length(encoder) > 1) {
              socket.send(encoding.toUint8Array(encoder));
            }
          } else if (messageType === MSG_AWARENESS) {
            const awarenessUpdate = decoding.readVarUint8Array(decoder);
            awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, socket);
          }
        } catch (err) {
          req.log.error({ err }, "malformed yjs message; closing socket");
          if (socket.readyState === 1) {
            socket.close(1002, "protocol_error");
          }
        }
      });

      // Replay any messages that arrived while we were loading the room.
      for (const msg of earlyMessages) {
        socket.emit("message", msg);
      }

      socket.on("close", async () => {
        room.ydoc.off("update", docUpdateHandler);
        room.awareness.off("update", awarenessUpdateHandler);
        if (controlledClientIds.size > 0) {
          awarenessProtocol.removeAwarenessStates(
            room.awareness,
            Array.from(controlledClientIds),
            null,
          );
        }
        room.connections.delete(socket);
        if (room.connections.size === 0) {
          try {
            await flushPersist(docId, room.ydoc);
          } finally {
            room.ydoc.off("update", room.persistListener);
            room.ydoc.destroy();
            room.awareness.destroy();
            rooms.delete(docId);
          }
        }
      });
    },
  );
}
