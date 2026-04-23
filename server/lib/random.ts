import { randomBytes } from "node:crypto";

export function randomToken(length = 32): string {
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, length);
}
