import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import {
  validateCreatorTokenForDocument,
  getCreatorTokenHeader,
} from "../auth/creator-token.js";
import { randomToken } from "../lib/random.js";
import type {
  DocumentMetadataResponse,
  ApiError,
  PermissionTokens,
  UpdateDocumentRequest,
} from "../../shared/types.js";

export async function documentRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id",
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

      const body: DocumentMetadataResponse = {
        document: {
          id: doc.id,
          projectId: doc.projectId,
          title: doc.title,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        },
        permissionLevel: level,
      };
      return reply.send(body);
    },
  );

  app.patch<{
    Params: { id: string };
    Querystring: { key?: string };
    Body: UpdateDocumentRequest;
  }>("/api/docs/:id", async (req, reply) => {
    const { id } = req.params;
    const { key } = req.query;

    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) {
      const err: ApiError = { error: "not_found", message: "Document not found" };
      return reply.code(404).send(err);
    }

    const level = await validatePermissionToken(id, key);
    if (!level) {
      const err: ApiError = { error: "forbidden", message: "Invalid or missing permission token" };
      return reply.code(403).send(err);
    }
    if (level !== "edit") {
      const err: ApiError = { error: "forbidden", message: "View-only token cannot edit" };
      return reply.code(403).send(err);
    }

    const body = req.body ?? {};
    if (body.title !== null && body.title !== undefined) {
      if (typeof body.title !== "string") {
        const err: ApiError = { error: "bad_request", message: "title must be a string or null" };
        return reply.code(400).send(err);
      }
      if (body.title.length > 120) {
        const err: ApiError = { error: "bad_request", message: "title too long" };
        return reply.code(400).send(err);
      }
    }

    const updated = await db.document.update({
      where: { id },
      data: { title: body.title === undefined ? doc.title : body.title },
    });

    return reply.send({
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt.toISOString(),
    });
  });

  app.delete<{ Params: { id: string } }>("/api/docs/:id", async (req, reply) => {
    const { id } = req.params;
    const ok = await validateCreatorTokenForDocument(id, getCreatorTokenHeader(req));
    if (!ok) {
      const err: ApiError = {
        error: "forbidden",
        message: "Invalid or missing creator token",
      };
      return reply.code(403).send(err);
    }

    await db.document.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>(
    "/api/docs/:id/rotate-keys",
    async (req, reply) => {
      const { id } = req.params;
      const ok = await validateCreatorTokenForDocument(id, getCreatorTokenHeader(req));
      if (!ok) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing creator token",
        };
        return reply.code(403).send(err);
      }

      const editToken = randomToken(32);
      const viewToken = randomToken(32);

      await db.$transaction([
        db.permission.update({
          where: { documentId_level: { documentId: id, level: "edit" } },
          data: { token: editToken },
        }),
        db.permission.update({
          where: { documentId_level: { documentId: id, level: "view" } },
          data: { token: viewToken },
        }),
      ]);

      const body: PermissionTokens = { editToken, viewToken };
      return reply.send(body);
    },
  );
}
