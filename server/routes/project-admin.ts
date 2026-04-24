import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { db } from "../db.js";
import {
  validateCreatorTokenForProject,
  getCreatorTokenHeader,
} from "../auth/creator-token.js";
import type { ApiError } from "../../shared/types.js";

export async function projectAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: { name?: string | null } }>(
    "/api/projects/:id",
    async (req, reply) => {
      const { id } = req.params;
      const ok = await validateCreatorTokenForProject(id, getCreatorTokenHeader(req));
      if (!ok) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing creator token",
        };
        return reply.code(403).send(err);
      }

      const body = req.body ?? {};
      const update: Prisma.ProjectUpdateInput = {};
      if ("name" in body) {
        // Explicitly provided — accept string or null (to clear).
        update.name = body.name ?? null;
      }
      const project = await db.project.update({ where: { id }, data: update });
      return reply.send({ project: { id: project.id, name: project.name } });
    },
  );
}
