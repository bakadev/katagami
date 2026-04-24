import type { FastifyInstance } from "fastify";
import * as Y from "yjs";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import { getLiveYDoc, applySnapshotToLiveDoc } from "../ws/yjs-handler.js";
import type {
  ApiError,
  SnapshotRecord,
  ListSnapshotsResponse,
  CreateSnapshotRequest,
  RenameSnapshotRequest,
} from "../../shared/types.js";

const PREVIEW_MAX = 120;

function previewFromState(state: Uint8Array): string {
  if (state.length === 0) return "";
  const ydoc = new Y.Doc();
  try {
    try {
      Y.applyUpdate(ydoc, state);
    } catch {
      return "";
    }
    const frag = ydoc.getXmlFragment("tiptap");
    // Trim before slicing so leading whitespace doesn't eat the visible preview.
    return frag.toString().replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, PREVIEW_MAX);
  } finally {
    ydoc.destroy();
  }
}

function toRecord(row: {
  id: string;
  name: string | null;
  takenAt: Date;
  takenByName: string | null;
  yjsState: Buffer;
}): SnapshotRecord {
  return {
    id: row.id,
    name: row.name,
    takenAt: row.takenAt.toISOString(),
    takenByName: row.takenByName,
    preview: previewFromState(new Uint8Array(row.yjsState)),
  };
}

export async function snapshotRoutes(app: FastifyInstance) {
  // GET /api/docs/:id/snapshots — any valid token
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id/snapshots",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        const err: ApiError = { error: "not_found", message: "Document not found" };
        return reply.code(404).send(err);
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing permission token",
        };
        return reply.code(403).send(err);
      }

      const rows = await db.snapshot.findMany({
        where: { documentId: id },
        orderBy: { takenAt: "desc" },
      });

      const body: ListSnapshotsResponse = {
        snapshots: rows.map(toRecord),
      };
      return reply.send(body);
    },
  );

  // POST /api/docs/:id/snapshots — edit token required
  app.post<{
    Params: { id: string };
    Querystring: { key?: string };
    Body: CreateSnapshotRequest;
  }>(
    "/api/docs/:id/snapshots",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        const err: ApiError = { error: "not_found", message: "Document not found" };
        return reply.code(404).send(err);
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing permission token",
        };
        return reply.code(403).send(err);
      }
      if (level !== "edit") {
        const err: ApiError = { error: "forbidden", message: "View-only token cannot create snapshots" };
        return reply.code(403).send(err);
      }

      // Validate name
      const body = req.body ?? {};
      let name: string | null = null;
      if (body.name !== undefined && body.name !== null) {
        if (typeof body.name !== "string") {
          const err: ApiError = { error: "bad_request", message: "name must be a string" };
          return reply.code(400).send(err);
        }
        const trimmed = body.name.trim();
        if (trimmed.length > 80) {
          const err: ApiError = { error: "bad_request", message: "name too long (max 80 chars)" };
          return reply.code(400).send(err);
        }
        name = trimmed.length > 0 ? trimmed : null;
      }

      // Capture current Y.Doc state
      const liveDoc = getLiveYDoc(id);
      let state: Uint8Array;
      if (liveDoc) {
        state = Y.encodeStateAsUpdate(liveDoc);
      } else if (doc.yjsState) {
        state = new Uint8Array(doc.yjsState);
      } else {
        state = new Uint8Array(0);
      }

      const snapshot = await db.snapshot.create({
        data: {
          documentId: id,
          name,
          yjsState: Buffer.from(state),
          takenByName: null,
        },
      });

      return reply.code(201).send(toRecord(snapshot));
    },
  );

  // POST /api/docs/:id/snapshots/:snapId/restore — edit token required
  app.post<{ Params: { id: string; snapId: string }; Querystring: { key?: string } }>(
    "/api/docs/:id/snapshots/:snapId/restore",
    async (req, reply) => {
      const { id, snapId } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        const err: ApiError = { error: "not_found", message: "Document not found" };
        return reply.code(404).send(err);
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing permission token",
        };
        return reply.code(403).send(err);
      }
      if (level !== "edit") {
        const err: ApiError = { error: "forbidden", message: "View-only token cannot restore snapshots" };
        return reply.code(403).send(err);
      }

      const snap = await db.snapshot.findUnique({ where: { id: snapId } });
      if (!snap || snap.documentId !== id) {
        const err: ApiError = { error: "not_found", message: "Snapshot not found" };
        return reply.code(404).send(err);
      }

      // Capture current state for the pre-restore auto-snapshot. We hold it
      // in memory and only persist after the apply succeeds, so a failed
      // apply doesn't leave an orphan auto-snapshot row behind. The narrow
      // window where another client edits between capture and apply is
      // acceptable — restores are rare, intentional operations.
      const liveDoc = getLiveYDoc(id);
      let currentState: Uint8Array;
      if (liveDoc) {
        currentState = Y.encodeStateAsUpdate(liveDoc);
      } else if (doc.yjsState) {
        currentState = new Uint8Array(doc.yjsState);
      } else {
        currentState = new Uint8Array(0);
      }

      // Apply the target snapshot's state first.
      const targetState = new Uint8Array(snap.yjsState);
      if (liveDoc) {
        applySnapshotToLiveDoc(liveDoc, targetState);
      } else {
        await db.document.update({
          where: { id },
          data: { yjsState: snap.yjsState },
        });
      }

      // Only after apply succeeds, persist the pre-restore snapshot so Undo
      // can rewind to it.
      const preRestoreSnap = await db.snapshot.create({
        data: {
          documentId: id,
          name: null,
          yjsState: Buffer.from(currentState),
          takenByName: null,
        },
      });

      return reply.send({
        restoredSnapshotId: snapId,
        preRestoreSnapshotId: preRestoreSnap.id,
      });
    },
  );

  // PATCH /api/docs/:id/snapshots/:snapId — edit token required
  app.patch<{
    Params: { id: string; snapId: string };
    Querystring: { key?: string };
    Body: RenameSnapshotRequest;
  }>(
    "/api/docs/:id/snapshots/:snapId",
    async (req, reply) => {
      const { id, snapId } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        const err: ApiError = { error: "not_found", message: "Document not found" };
        return reply.code(404).send(err);
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing permission token",
        };
        return reply.code(403).send(err);
      }
      if (level !== "edit") {
        const err: ApiError = { error: "forbidden", message: "View-only token cannot rename snapshots" };
        return reply.code(403).send(err);
      }

      const snap = await db.snapshot.findUnique({ where: { id: snapId } });
      if (!snap || snap.documentId !== id) {
        const err: ApiError = { error: "not_found", message: "Snapshot not found" };
        return reply.code(404).send(err);
      }

      // Validate name
      const body = req.body ?? {};
      if (typeof body.name !== "string") {
        const err: ApiError = { error: "bad_request", message: "name must be a string" };
        return reply.code(400).send(err);
      }
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        const err: ApiError = { error: "bad_request", message: "name required" };
        return reply.code(400).send(err);
      }
      if (trimmed.length > 80) {
        const err: ApiError = { error: "bad_request", message: "name too long" };
        return reply.code(400).send(err);
      }

      const updated = await db.snapshot.update({
        where: { id: snapId },
        data: { name: trimmed },
      });

      return reply.send(toRecord(updated));
    },
  );

  // DELETE /api/docs/:id/snapshots/:snapId — edit token required
  app.delete<{ Params: { id: string; snapId: string }; Querystring: { key?: string } }>(
    "/api/docs/:id/snapshots/:snapId",
    async (req, reply) => {
      const { id, snapId } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        const err: ApiError = { error: "not_found", message: "Document not found" };
        return reply.code(404).send(err);
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing permission token",
        };
        return reply.code(403).send(err);
      }
      if (level !== "edit") {
        const err: ApiError = { error: "forbidden", message: "View-only token cannot delete snapshots" };
        return reply.code(403).send(err);
      }

      const snap = await db.snapshot.findUnique({ where: { id: snapId } });
      if (!snap || snap.documentId !== id) {
        const err: ApiError = { error: "not_found", message: "Snapshot not found" };
        return reply.code(404).send(err);
      }

      if (snap.name === null) {
        const err: ApiError = { error: "bad_request", message: "Auto-snapshots cannot be deleted manually" };
        return reply.code(400).send(err);
      }

      await db.snapshot.delete({ where: { id: snapId } });

      return reply.code(204).send();
    },
  );
}
