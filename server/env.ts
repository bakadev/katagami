import { config } from "dotenv";

config();

function required(key: string): string {
  const v = process.env[key]?.trim();
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

function parsePort(raw: string | undefined): number {
  const value = raw?.trim() ?? "3001";
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid PORT: "${value}" (must be integer 1-65535)`);
  }
  return n;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: parsePort(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV?.trim() ?? "development",
};
