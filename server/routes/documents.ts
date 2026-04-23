import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import type { DocumentMetadataResponse, ApiError } from "../../shared/types.js";

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
}
