import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { randomToken } from "../lib/random.js";
import type { CreateProjectResponse } from "../../shared/types.js";

export async function projectRoutes(app: FastifyInstance) {
  app.post("/api/projects", async (_req, reply) => {
    const creatorToken = randomToken(32);
    const editToken = randomToken(32);
    const viewToken = randomToken(32);

    const result = await db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { creatorToken },
      });
      const document = await tx.document.create({
        data: { projectId: project.id },
      });
      await tx.permission.createMany({
        data: [
          { documentId: document.id, level: "edit", token: editToken },
          { documentId: document.id, level: "view", token: viewToken },
        ],
      });
      return { project, document };
    });

    const body: CreateProjectResponse = {
      project: { id: result.project.id, name: result.project.name },
      document: { id: result.document.id },
      permissions: { editToken, viewToken },
      creatorToken,
    };
    reply.code(201).send(body);
  });
}
