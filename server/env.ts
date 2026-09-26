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

function optional(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v ? v : undefined;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: parsePort(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV?.trim() ?? "development",

  // Auth. All optional: with none of them set, the sign-in routes answer
  // 503 and the rest of the app works exactly as before (Free documents
  // never need an account). See docs/oauth-prep.md.
  APP_URL: optional("APP_URL") ?? "http://localhost:5173",
  API_URL: optional("API_URL") ?? "http://localhost:3005",
  SESSION_SECRET: optional("SESSION_SECRET"),
  GITHUB_CLIENT_ID: optional("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: optional("GITHUB_CLIENT_SECRET"),
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
  /** Comma-separated emails allowed into /admin. */
  ADMIN_EMAILS: (optional("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};
