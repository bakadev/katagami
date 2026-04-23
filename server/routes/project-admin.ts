import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validateCreatorTokenForProject } from "../auth/creator-token.js";
import type { ApiError } from "../../shared/types.js";

export async function projectAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: { name?: string } }>(
    "/api/projects/:id",
    async (req, reply) => {
      const { id } = req.params;
      const token = req.headers["x-creator-token"];
      const tokenStr = typeof token === "string" ? token : undefined;

      const ok = await validateCreatorTokenForProject(id, tokenStr);
      if (!ok) {
        const err: ApiError = {
          error: "forbidden",
          message: "Invalid or missing creator token",
        };
        return reply.code(403).send(err);
      }

      const { name } = req.body ?? {};
      const project = await db.project.update({
        where: { id },
        data: { name: name ?? null },
      });
      return reply.send({ project: { id: project.id, name: project.name } });
    },
  );
}
