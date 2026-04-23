import type { FastifyInstance } from "fastify";
import { buildServer } from "../server/index.js";
import { db } from "../server/db.js";

export async function makeTestApp(): Promise<FastifyInstance> {
  return buildServer();
}

export async function resetDb() {
  await db.permission.deleteMany();
  await db.snapshot.deleteMany();
  await db.document.deleteMany();
  await db.project.deleteMany();
}
