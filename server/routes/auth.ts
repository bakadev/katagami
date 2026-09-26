import type { FastifyInstance, FastifyReply } from "fastify";
import * as arctic from "arctic";
import { db } from "../db.js";
import { env } from "../env.js";
import type { ApiError, MeResponse, UpdateMeRequest } from "../../shared/types.js";
import { planFor } from "../auth/access.js";
import { createTeamFor } from "./teams.js";
import { guessTeamName } from "../lib/team-name.js";
import type { OAuthProfile, ProviderMap, ProviderName } from "../auth/providers.js";
import {
  SESSION_COOKIE,
  createSession,
  deleteSessionByToken,
  getSessionUser,
  sessionCookieOptions,
} from "../auth/session.js";

/**
 * Sign-in with GitHub or Google.
 *
 *   GET  /api/auth/:provider            → redirect to the provider
 *   GET  /api/auth/:provider/callback   → exchange code, create session, redirect
 *   GET  /api/auth/me                   → { user, workspaces } or 401
 *   POST /api/auth/signout              → clear session
 *
 * The handshake state (CSRF token, PKCE verifier, where to go afterwards)
 * rides in a short-lived cookie. Email is the identity: the same address
 * on a second provider links to the existing user.
 */

const STATE_COOKIE = "katagami_oauth";
const STATE_MAX_AGE = 10 * 60; // seconds

interface HandshakeState {
  provider: ProviderName;
  state: string;
  verifier: string;
  next: string;
}

function isProviderName(v: string): v is ProviderName {
  return v === "github" || v === "google";
}

/** Only same-origin paths may be used as a post-sign-in destination. */
export function safeNext(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

function appRedirect(reply: FastifyReply, path: string) {
  return reply.redirect(`${env.APP_URL.replace(/\/$/, "")}${path}`);
}

function fail(reply: FastifyReply, reason: string) {
  return appRedirect(reply, `/signin?error=${encodeURIComponent(reason)}`);
}

/** Find or create the user for a provider profile. */
export async function upsertUserFromProfile(
  provider: ProviderName,
  profile: OAuthProfile,
): Promise<{ userId: string; created: boolean }> {
  const email = profile.email.trim().toLowerCase();
  return db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { provider_providerId: { provider, providerId: profile.providerId } },
    });
    if (account) {
      await tx.user.update({
        where: { id: account.userId },
        data: { name: profile.name, avatarUrl: profile.avatarUrl ?? undefined },
      });
      return { userId: account.userId, created: false };
    }
    const existing = await tx.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await tx.user.create({
        data: { email, name: profile.name, avatarUrl: profile.avatarUrl },
      }));
    await tx.account.create({
      data: { provider, providerId: profile.providerId, userId: user.id },
    });
    return { userId: user.id, created: !existing };
  });
}

export interface AuthRoutesOptions {
  providers: ProviderMap;
}

export async function authRoutes(app: FastifyInstance, opts: AuthRoutesOptions) {
  const { providers } = opts;

  app.get<{ Params: { provider: string }; Querystring: { next?: string } }>(
    "/api/auth/:provider",
    async (req, reply) => {
      const name = req.params.provider;
      const provider = isProviderName(name) ? providers[name] : undefined;
      if (!provider || !isProviderName(name)) {
        // A browser landed here from a sign-in button; send it back with a
        // message rather than showing JSON.
        return fail(reply, "provider_unavailable");
      }
      const state = arctic.generateState();
      const verifier = provider.usesPkce ? arctic.generateCodeVerifier() : "";
      const handshake: HandshakeState = {
        provider: name,
        state,
        verifier,
        next: safeNext(req.query.next) ?? "",
      };
      reply.setCookie(STATE_COOKIE, JSON.stringify(handshake), {
        path: "/api/auth",
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: STATE_MAX_AGE,
        signed: true,
      });
      return reply.redirect(provider.createAuthorizationURL(state, verifier).toString());
    },
  );

  app.get<{
    Params: { provider: string };
    Querystring: { code?: string; state?: string; error?: string };
  }>("/api/auth/:provider/callback", async (req, reply) => {
    const name = req.params.provider;
    const provider = isProviderName(name) ? providers[name] : undefined;
    if (!provider || !isProviderName(name)) return fail(reply, "provider_unavailable");

    const raw = req.cookies?.[STATE_COOKIE];
    const unsigned = raw ? reply.unsignCookie(raw) : null;
    reply.clearCookie(STATE_COOKIE, { path: "/api/auth" });
    if (!unsigned?.valid || !unsigned.value) return fail(reply, "state_missing");
    let handshake: HandshakeState;
    try {
      handshake = JSON.parse(unsigned.value) as HandshakeState;
    } catch {
      return fail(reply, "state_invalid");
    }
    if (req.query.error) return fail(reply, "denied");
    if (
      handshake.provider !== name ||
      !req.query.state ||
      req.query.state !== handshake.state ||
      !req.query.code
    ) {
      return fail(reply, "state_mismatch");
    }

    let profile: OAuthProfile;
    try {
      profile = await provider.exchange(req.query.code, handshake.verifier);
    } catch (err) {
      req.log.warn({ err }, "oauth exchange failed");
      return fail(reply, "exchange_failed");
    }
    if (!profile.email || !profile.emailVerified) return fail(reply, "email_unverified");

    const { userId, created } = await upsertUserFromProfile(name, profile);
    if (created) {
      // Every account gets a team, named from the email. Free never sees
      // it; Team can rename it from the account menu.
      await createTeamFor(userId, guessTeamName(profile.email, profile.name));
    }
    const session = await createSession(userId);
    reply.setCookie(SESSION_COOKIE, session.token, sessionCookieOptions());

    const next = handshake.next || "/documents";
    return appRedirect(reply, next);
  });

  app.get("/api/auth/me", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) {
      const body: ApiError = { error: "unauthenticated", message: "Not signed in" };
      return reply.code(401).send(body);
    }
    const memberships = await db.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    const body: MeResponse = {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, color: user.color },
      teams: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role as "owner" | "editor",
      })),
      plan: planFor(user, memberships.length),
      isAdmin: env.ADMIN_EMAILS.includes(user.email.toLowerCase()),
    };
    return body;
  });

  /** Visible name and caret colour. */
  app.patch<{ Body: UpdateMeRequest }>("/api/auth/me", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) {
      const body: ApiError = { error: "unauthenticated", message: "Not signed in" };
      return reply.code(401).send(body);
    }
    const data: { name?: string; color?: string } = {};
    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 1 || name.length > 40) {
        const body: ApiError = { error: "invalid_name", message: "Name must be 1 to 40 characters" };
        return reply.code(400).send(body);
      }
      data.name = name;
    }
    if (req.body?.color !== undefined) {
      const color = String(req.body.color).trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        const body: ApiError = { error: "invalid_color", message: "Colour must be a hex value" };
        return reply.code(400).send(body);
      }
      data.color = color;
    }
    const updated = await db.user.update({ where: { id: user.id }, data });
    return {
      user: { id: updated.id, email: updated.email, name: updated.name, avatarUrl: updated.avatarUrl, color: updated.color },
    };
  });

  app.post("/api/auth/signout", async (req, reply) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) await deleteSessionByToken(token);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });
}
