import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db.js";
import { env } from "../env.js";
import { randomToken } from "../lib/random.js";

/**
 * Cookie sessions. The cookie holds a random token; the database holds its
 * sha256 so a leaked table can't be replayed. Thirty days, renewed when a
 * request arrives with under fifteen days left.
 */

export const SESSION_COOKIE = "katagami_session";
const SESSION_DAYS = 30;
const RENEW_UNDER_DAYS = 15;
const DAY = 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * DAY / 1000,
  };
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(48);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.session.deleteMany({ where: { id: hashToken(token) } });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  color: string | null;
  planOverride: string | null;
}

/**
 * Resolve the request's session, if any. Expired sessions are deleted on
 * sight; healthy ones near expiry are extended and the cookie re-set.
 */
export async function getSessionUser(
  req: FastifyRequest,
  reply?: FastifyReply,
): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const id = hashToken(token);
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id } }).catch(() => undefined);
    return null;
  }
  if (session.expiresAt.getTime() - now < RENEW_UNDER_DAYS * DAY) {
    const expiresAt = new Date(now + SESSION_DAYS * DAY);
    await db.session.update({ where: { id }, data: { expiresAt } });
    reply?.setCookie(SESSION_COOKIE, token, sessionCookieOptions());
  }
  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    color: user.color,
    planOverride: user.planOverride,
  };
}
