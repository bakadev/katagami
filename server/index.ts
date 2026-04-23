import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);
  await app.register(projectRoutes);

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
