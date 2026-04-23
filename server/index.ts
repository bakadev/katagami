import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { documentRoutes } from "./routes/documents.js";
import type { ApiError } from "../shared/types.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);
  await app.register(projectRoutes);
  await app.register(documentRoutes);

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    const body: ApiError = {
      error: "internal_error",
      message: "An unexpected error occurred",
    };
    reply.code(500).send(body);
  });

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
