import type { FastifyInstance } from "fastify";
import { buildServer } from "../server/index.js";
import { db } from "../server/db.js";

/**
 * Build a fresh Fastify test app. Kept as a helper so future test config
 * overrides (e.g. alternative env, mock providers) happen in one place.
 */
export async function makeTestApp(): Promise<FastifyInstance> {
  return buildServer();
}

/**
 * Wipe all DB tables in FK-dependency order.
 * NOTE: when a new table with foreign keys is added to `prisma/schema.prisma`,
 * add a deleteMany() call here in the correct dependency order.
 */
export async function resetDb() {
  await db.permission.deleteMany();
  await db.snapshot.deleteMany();
  await db.document.deleteMany();
  await db.project.deleteMany();
}
