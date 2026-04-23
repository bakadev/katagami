import { config } from "dotenv";

config();

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
