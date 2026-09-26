import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { db } from "../db.js";
import {
  validateCreatorTokenForProject,
  getCreatorTokenHeader,
} from "../auth/creator-token.js";
import type { ApiError } from "../../shared/types.js";
import { getSessionUser } from "../auth/session.js";
import { visibleProject } from "../auth/access.js";

export async function projectAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: { name?: string | null } }>(
    "/api/projects/:id",
    async (req, reply) => {
      const { id } = req.params;
      // Either the browser that created it (creator token) or a signed-in
      // person who can see it may rename a project.
      const user = await getSessionUser(req, reply);
      const ok =
        (user && (await visibleProject(user, id)) !== null) ||
        (await validateCreatorTokenForProject(id, getCreatorTokenHeader(req)));
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
