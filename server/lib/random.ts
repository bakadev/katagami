import { randomBytes } from "node:crypto";

export function randomToken(length = 32): string {
  if (length <= 0) {
    throw new RangeError(`randomToken length must be positive, got ${length}`);
  }
  // ceil(length * 3/4) bytes base64url-encode to at least `length` unpadded chars.
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes.toString("base64url").slice(0, length);
}
