import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import type { DocumentMetadataResponse } from "../../shared/types.js";

export async function documentRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        return reply.code(404).send({ error: "not_found", message: "Document not found" });
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Invalid or missing permission token" });
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
      reply.send(body);
    },
  );
}
