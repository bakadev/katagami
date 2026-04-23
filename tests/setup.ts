import { beforeAll, afterAll } from "vitest";
import { db } from "../server/db.js";

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
});
