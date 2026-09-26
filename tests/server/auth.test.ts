import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../server/index.js";
import { resetDb } from "../helpers.js";
import { db } from "../../server/db.js";
import type { OAuthProfile, OAuthProvider, ProviderMap } from "../../server/auth/providers.js";
import { hashToken } from "../../server/auth/session.js";
import { safeNext } from "../../server/routes/auth.js";
import { slugify } from "../../server/routes/teams.js";

/**
 * Sign-in against fake providers: the handshake, the user/account upsert,
 * sessions, workspaces and the claim flow. Real GitHub/Google are only
 * exercised by hand (docs/oauth-prep.md).
 */

const PRIYA: OAuthProfile = {
  providerId: "gh-1",
  email: "Priya@Acme.co",
  emailVerified: true,
  name: "Priya Raman",
  avatarUrl: "https://example.com/p.png",
};

function fakeProvider(name: "github" | "google", profile: OAuthProfile): OAuthProvider {
  return {
    name,
    label: name,
    usesPkce: name === "google",
    createAuthorizationURL(state) {
      return new URL(`https://provider.test/${name}/authorize?state=${state}`);
    },
    async exchange(code) {
      if (code === "bad") throw new Error("invalid code");
      return profile;
    },
  };
}

function cookieHeader(res: { cookies: { name: string; value: string }[] }, ...names: string[]) {
  return res.cookies
    .filter((c) => names.includes(c.name))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

/** Run the full handshake and return the session cookie header. */
async function signIn(
  app: FastifyInstance,
  provider = "github",
  next?: string,
): Promise<{ cookie: string; location: string }> {
  const start = await app.inject({
    method: "GET",
    url: `/api/auth/${provider}${next ? `?next=${encodeURIComponent(next)}` : ""}`,
  });
  expect(start.statusCode).toBe(302);
  const state = new URL(start.headers.location as string).searchParams.get("state")!;
  const cb = await app.inject({
    method: "GET",
    url: `/api/auth/${provider}/callback?code=ok&state=${state}`,
    headers: { cookie: cookieHeader(start, "katagami_oauth") },
  });
  expect(cb.statusCode).toBe(302);
  return { cookie: cookieHeader(cb, "katagami_session"), location: cb.headers.location as string };
}

describe("auth", () => {
  let app: FastifyInstance;
  const providers: ProviderMap = {
    github: fakeProvider("github", PRIYA),
    google: fakeProvider("google", { ...PRIYA, providerId: "goog-9", name: "Priya R" }),
  };

  beforeAll(async () => {
    app = await buildServer({ providers });
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
  });

  it("redirects to the provider with a signed handshake cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/github" });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/provider\.test\/github\/authorize\?state=/);
    const c = res.cookies.find((c) => c.name === "katagami_oauth")!;
    expect(c.httpOnly).toBe(true);
    expect(c.path).toBe("/api/auth");
  });

  it("sends the browser back to /signin when a provider isn't configured", async () => {
    const bare = await buildServer({ providers: {} });
    const res = await bare.inject({ method: "GET", url: "/api/auth/github" });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("http://localhost:5173/signin?error=provider_unavailable");
    await bare.close();
  });

  it("creates a user and account on first sign-in and sends them to /welcome", async () => {
    const { cookie, location } = await signIn(app);
    expect(location).toBe("http://localhost:5173/welcome");
    expect(cookie).toMatch(/^katagami_session=/);

    const user = await db.user.findUnique({ where: { email: "priya@acme.co" } });
    expect(user).not.toBeNull();
    expect(user!.name).toBe("Priya Raman");
    const accounts = await db.account.findMany({ where: { userId: user!.id } });
    expect(accounts.map((a) => a.provider)).toEqual(["github"]);

    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("priya@acme.co");
    expect(me.json().teams).toEqual([]);
    expect(me.json().plan).toBe("free");
  });

  it("sends a returning user home, or to a safe ?next", async () => {
    await signIn(app);
    const again = await signIn(app);
    expect(again.location).toBe("http://localhost:5173/documents");
    expect(await db.user.count()).toBe(1);

    const withNext = await signIn(app, "github", "/p/abc/d/def?key=x");
    expect(withNext.location).toBe("http://localhost:5173/p/abc/d/def?key=x");
  });

  it("links a second provider with the same email to the existing user", async () => {
    await signIn(app, "github");
    await signIn(app, "google");
    expect(await db.user.count()).toBe(1);
    const user = await db.user.findUnique({ where: { email: "priya@acme.co" } });
    const accounts = await db.account.findMany({ where: { userId: user!.id } });
    expect(accounts.map((a) => a.provider).sort()).toEqual(["github", "google"]);
  });

  it("rejects a callback whose state doesn't match the cookie", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/github" });
    const cb = await app.inject({
      method: "GET",
      url: "/api/auth/github/callback?code=ok&state=forged",
      headers: { cookie: cookieHeader(start, "katagami_oauth") },
    });
    expect(cb.statusCode).toBe(302);
    expect(cb.headers.location).toBe("http://localhost:5173/signin?error=state_mismatch");
    expect(await db.user.count()).toBe(0);
  });

  it("rejects a callback with no handshake cookie", async () => {
    const cb = await app.inject({ method: "GET", url: "/api/auth/github/callback?code=ok&state=x" });
    expect(cb.headers.location).toBe("http://localhost:5173/signin?error=state_missing");
  });

  it("refuses a profile without a verified email", async () => {
    const noEmail = await buildServer({
      providers: { github: fakeProvider("github", { ...PRIYA, emailVerified: false }) },
    });
    const start = await noEmail.inject({ method: "GET", url: "/api/auth/github" });
    const state = new URL(start.headers.location as string).searchParams.get("state")!;
    const cb = await noEmail.inject({
      method: "GET",
      url: `/api/auth/github/callback?code=ok&state=${state}`,
      headers: { cookie: cookieHeader(start, "katagami_oauth") },
    });
    expect(cb.headers.location).toBe("http://localhost:5173/signin?error=email_unverified");
    expect(await db.user.count()).toBe(0);
    await noEmail.close();
  });

  it("reports an exchange failure without creating anything", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/github" });
    const state = new URL(start.headers.location as string).searchParams.get("state")!;
    const cb = await app.inject({
      method: "GET",
      url: `/api/auth/github/callback?code=bad&state=${state}`,
      headers: { cookie: cookieHeader(start, "katagami_oauth") },
    });
    expect(cb.headers.location).toBe("http://localhost:5173/signin?error=exchange_failed");
    expect(await db.user.count()).toBe(0);
  });

  it("stores only a hash of the session token and honours sign-out", async () => {
    const { cookie } = await signIn(app);
    const token = cookie.split("=")[1];
    const session = await db.session.findUnique({ where: { id: hashToken(token) } });
    expect(session).not.toBeNull();
    expect(await db.session.findFirst({ where: { id: token } })).toBeNull();

    const out = await app.inject({ method: "POST", url: "/api/auth/signout", headers: { cookie } });
    expect(out.statusCode).toBe(200);
    expect(await db.session.count()).toBe(0);
    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });

  it("drops an expired session and renews one that is nearly over", async () => {
    const { cookie } = await signIn(app);
    const id = hashToken(cookie.split("=")[1]);

    await db.session.update({ where: { id }, data: { expiresAt: new Date(Date.now() + 5 * 864e5) } });
    const renewed = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(renewed.statusCode).toBe(200);
    const after = await db.session.findUnique({ where: { id } });
    expect(after!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 864e5);
    expect(renewed.cookies.some((c) => c.name === "katagami_session")).toBe(true);

    await db.session.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(expired.statusCode).toBe(401);
    expect(await db.session.count()).toBe(0);
  });

  it("only allows same-origin paths as a post-sign-in destination", () => {
    expect(safeNext("/pricing")).toBe("/pricing");
    expect(safeNext("/p/x/d/y?key=z")).toBe("/p/x/d/y?key=z");
    expect(safeNext("https://evil.test")).toBeNull();
    expect(safeNext("//evil.test")).toBeNull();
    expect(safeNext("/\\evil.test")).toBeNull();
    expect(safeNext("")).toBeNull();
    expect(safeNext(42)).toBeNull();
  });
});

describe("teams and claim", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildServer({ providers: { github: fakeProvider("github", PRIYA) } });
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
  });

  it("requires a session", async () => {
    const res = await app.inject({ method: "POST", url: "/api/teams", payload: { name: "Acme" } });
    expect(res.statusCode).toBe(401);
  });

  it("creates a team with the user as owner and a unique slug", async () => {
    const { cookie } = await signIn(app);
    const a = await app.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "Acme Co." } });
    expect(a.statusCode).toBe(201);
    expect(a.json().team).toMatchObject({ name: "Acme Co.", slug: "acme-co", role: "owner" });

    const b = await app.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "Acme Co." } });
    expect(b.json().team.slug).toMatch(/^acme-co-[a-z0-9]{4}$/);

    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(me.json().teams).toHaveLength(2);
    expect(me.json().plan).toBe("team");

    const bad = await app.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "   " } });
    expect(bad.statusCode).toBe(400);
  });

  it("slugifies names", () => {
    expect(slugify("Acme Co.")).toBe("acme-co");
    expect(slugify("Ünïcode Tëam")).toBe("unicode-team");
    expect(slugify("!!!")).toBe("workspace");
  });

  it("looks up and moves only projects whose creator token matches", async () => {
    const { cookie } = await signIn(app);
    const ws = (await app.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "Acme" } })).json().team;

    const p1 = (await app.inject({ method: "POST", url: "/api/projects" })).json();
    const p2 = (await app.inject({ method: "POST", url: "/api/projects" })).json();
    await db.document.updateMany({ where: { projectId: p1.project.id }, data: { title: "Checkout PRD" } });

    const candidates = [
      { projectId: p1.project.id, token: p1.creatorToken },
      { projectId: p2.project.id, token: "wrong-token" },
      { projectId: "00000000-0000-0000-0000-000000000000", token: "x" },
    ];
    const lookup = await app.inject({ method: "POST", url: "/api/claim/lookup", headers: { cookie }, payload: { projects: candidates } });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json().projects).toHaveLength(1);
    expect(lookup.json().projects[0]).toMatchObject({ id: p1.project.id, title: "Checkout PRD", documentCount: 1 });

    const claim = await app.inject({ method: "POST", url: "/api/claim", headers: { cookie }, payload: { teamId: ws.id, projects: candidates } });
    expect(claim.statusCode).toBe(200);
    expect(claim.json().moved).toEqual([p1.project.id]);
    expect((await db.project.findUnique({ where: { id: p1.project.id } }))!.workspaceId).toBe(ws.id);
    expect((await db.project.findUnique({ where: { id: p2.project.id } }))!.workspaceId).toBeNull();

    // Already claimed projects are not listed or moved again.
    const again = await app.inject({ method: "POST", url: "/api/claim/lookup", headers: { cookie }, payload: { projects: candidates } });
    expect(again.json().projects).toHaveLength(0);
  });

  it("refuses to move projects into a team the user isn't in", async () => {
    const { cookie } = await signIn(app);
    const other = await db.workspace.create({ data: { name: "Other", slug: "other" } });
    const p = (await app.inject({ method: "POST", url: "/api/projects" })).json();
    const res = await app.inject({ method: "POST", url: "/api/claim", headers: { cookie }, payload: { teamId: other.id, projects: [{ projectId: p.project.id, token: p.creatorToken }] } });
    expect(res.statusCode).toBe(403);
  });
});
