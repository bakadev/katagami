import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import cookie from "@fastify/cookie";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { documentRoutes } from "./routes/documents.js";
import { snapshotRoutes } from "./routes/snapshots.js";
import { projectAdminRoutes } from "./routes/project-admin.js";
import { authRoutes } from "./routes/auth.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { providersFromEnv, type ProviderMap } from "./auth/providers.js";
import { registerYjsHandler } from "./ws/yjs-handler.js";
import type { ApiError } from "../shared/types.js";
import { isClientRoute } from "./client-routes.js";

export interface BuildServerOptions {
  /**
   * Directory holding the built client (index.html + assets/). When set, the
   * server serves it and falls back to index.html for unknown non-API paths
   * so React Router can take over. Omitted in dev (Vite serves the client)
   * and in tests.
   */
  staticDir?: string;
  /** OAuth providers. Defaults to whatever the environment configures. */
  providers?: ProviderMap;
}

export async function buildServer(opts: BuildServerOptions = {}) {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie, {
    // Signs the OAuth handshake cookie. A missing secret only disables
    // sign-in; a random one keeps tests self-contained.
    secret: env.SESSION_SECRET ?? "unconfigured-" + Math.random().toString(36).slice(2),
  });
  await app.register(websocket);
  await app.register(healthRoutes);
  await app.register(projectRoutes);
  await app.register(documentRoutes);
  await app.register(snapshotRoutes);
  await app.register(projectAdminRoutes);
  await app.register(authRoutes, { providers: opts.providers ?? providersFromEnv() });
  await app.register(workspaceRoutes);

  registerYjsHandler(app);

  if (opts.staticDir) {
    await app.register(fastifyStatic, {
      root: opts.staticDir,
      wildcard: false,
      // Hashed Vite assets are safe to cache for a long time; index.html is
      // served through the fallback below and must not be cached.
      maxAge: "1y",
      immutable: true,
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/") || req.url.startsWith("/ws/")) {
        const body: ApiError = { error: "not_found", message: "Not found" };
        return reply.code(404).send(body);
      }
      return reply
        .code(isClientRoute(req.url) ? 200 : 404)
        .header("cache-control", "no-cache")
        .sendFile("index.html");
    });
  }

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

/** Resolve the client build relative to this file (dist/server/server → dist/client). */
function resolveClientDir(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidate = resolve(here, "../../client");
  return existsSync(candidate) ? candidate : undefined;
}

async function main() {
  const staticDir =
    env.NODE_ENV === "production" ? resolveClientDir() : undefined;
  const app = await buildServer({ staticDir });
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
