import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { env } from "../../server/env.js";
import { buildServer } from "../../server/index.js";
import { resetDb } from "../helpers.js";
import { db } from "../../server/db.js";
import type { OAuthProfile, OAuthProvider } from "../../server/auth/providers.js";

function fake(profile: OAuthProfile): OAuthProvider {
  return {
    name: "github",
    label: "GitHub",
    usesPkce: false,
    createAuthorizationURL: (state) => new URL(`https://p.test/a?state=${state}`),
    exchange: async () => profile,
  };
}
const ADMIN: OAuthProfile = { providerId: "1", email: "admin@acme.co", emailVerified: true, name: "Ada Min", avatarUrl: null };
const TESTER: OAuthProfile = { providerId: "2", email: "tester@acme.co", emailVerified: true, name: "Tess Ter", avatarUrl: null };

async function signIn(app: FastifyInstance): Promise<string> {
  const start = await app.inject({ method: "GET", url: "/api/auth/github" });
  const state = new URL(start.headers.location as string).searchParams.get("state")!;
  const oauth = start.cookies.find((c) => c.name === "katagami_oauth")!;
  const cb = await app.inject({
    method: "GET",
    url: `/api/auth/github/callback?code=ok&state=${state}`,
    headers: { cookie: `katagami_oauth=${oauth.value}` },
  });
  return `katagami_session=${cb.cookies.find((c) => c.name === "katagami_session")!.value}`;
}

describe("admin", () => {
  let adminApp: FastifyInstance;
  let testerApp: FastifyInstance;
  beforeAll(async () => {
    env.ADMIN_EMAILS.splice(0, env.ADMIN_EMAILS.length, "admin@acme.co");
    adminApp = await buildServer({ providers: { github: fake(ADMIN) } });
    testerApp = await buildServer({ providers: { github: fake(TESTER) } });
  });
  afterAll(async () => {
    env.ADMIN_EMAILS.splice(0, env.ADMIN_EMAILS.length);
    await adminApp.close();
    await testerApp.close();
  });
  beforeEach(async () => {
    await resetDb();
  });

  it("deletes a user with their projects, documents and lone teams", async () => {
    const admin = await signIn(adminApp);
    const tester = await signIn(testerApp);
    await testerApp.inject({ method: "POST", url: "/api/documents", headers: { cookie: tester }, payload: {} });
    const me = (await testerApp.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: tester } })).json();

    const self = await adminApp.inject({ method: "DELETE", url: `/api/admin/users/${me.user.id}`, headers: { cookie: tester } });
    expect(self.statusCode).toBe(403);
    const adminMe = (await adminApp.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: admin } })).json();
    const notMe = await adminApp.inject({ method: "DELETE", url: `/api/admin/users/${adminMe.user.id}`, headers: { cookie: admin } });
    expect(notMe.statusCode).toBe(400);

    const res = await adminApp.inject({ method: "DELETE", url: `/api/admin/users/${me.user.id}`, headers: { cookie: admin } });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toMatchObject({ projects: 1, documents: 1, teams: 1 });
    expect(await db.user.findUnique({ where: { id: me.user.id } })).toBeNull();
    expect(await db.workspace.count()).toBe(1);
    expect(await db.document.count()).toBe(0);
    expect((await testerApp.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: tester } })).statusCode).toBe(401);
  });

  it("is only for listed admins", async () => {
    const tester = await signIn(testerApp);
    expect((await testerApp.inject({ method: "GET", url: "/api/admin/overview" })).statusCode).toBe(401);
    const res = await testerApp.inject({ method: "GET", url: "/api/admin/overview", headers: { cookie: tester } });
    expect(res.statusCode).toBe(403);
    const me = await testerApp.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: tester } });
    expect(me.json().isAdmin).toBe(false);
  });

  it("lists users and teams and flips a person's plan", async () => {
    const admin = await signIn(adminApp);
    const tester = await signIn(testerApp);
    expect((await adminApp.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: admin } })).json().isAdmin).toBe(true);

    const before = (await adminApp.inject({ method: "GET", url: "/api/admin/overview", headers: { cookie: admin } })).json();
    expect(before.totals.users).toBe(2);
    // Default buckets and anonymous projects don't count as projects.
    await testerApp.inject({ method: "POST", url: "/api/documents", headers: { cookie: tester }, payload: {} });
    await testerApp.inject({ method: "POST", url: "/api/projects" });
    const counted = (await adminApp.inject({ method: "GET", url: "/api/admin/overview", headers: { cookie: admin } })).json();
    expect(counted.totals).toMatchObject({ projects: 0, documents: 2, anonymousDocuments: 1 });
    const row = before.users.find((u: { email: string }) => u.email === "tester@acme.co");
    expect(row).toMatchObject({ plan: "free", planOverride: null });
    expect(row.teams).toHaveLength(1);

    // Free → Team: the team made at sign-up becomes usable.
    const up = await adminApp.inject({ method: "PATCH", url: `/api/admin/users/${row.id}/plan`, headers: { cookie: admin }, payload: { planOverride: "team" } });
    expect(up.json()).toMatchObject({ planOverride: "team", plan: "team" });
    const home = (await testerApp.inject({ method: "GET", url: "/api/home", headers: { cookie: tester } })).json();
    expect(home.plan).toBe("team");
    expect(home.team.name).toBe("Acme");
    const proj = await testerApp.inject({ method: "POST", url: "/api/projects/new", headers: { cookie: tester }, payload: { name: "P" } });
    expect(proj.statusCode).toBe(201);

    // Forced back to Free, even with a team membership.
    await adminApp.inject({ method: "PATCH", url: `/api/admin/users/${row.id}/plan`, headers: { cookie: admin }, payload: { planOverride: "free" } });
    const freeHome = (await testerApp.inject({ method: "GET", url: "/api/home", headers: { cookie: tester } })).json();
    expect(freeHome.plan).toBe("free");
    expect((await testerApp.inject({ method: "POST", url: "/api/projects/new", headers: { cookie: tester }, payload: { name: "Q" } })).statusCode).toBe(403);

    const after = (await adminApp.inject({ method: "GET", url: "/api/admin/overview", headers: { cookie: admin } })).json();
    expect(after.teams).toHaveLength(2);
    const testerTeam = after.teams.find((t: { members: { email: string }[] }) => t.members[0].email === "tester@acme.co");
    expect(testerTeam.projectCount).toBe(1);

    const bad = await adminApp.inject({ method: "PATCH", url: `/api/admin/users/${row.id}/plan`, headers: { cookie: admin }, payload: { planOverride: "gold" } });
    expect(bad.statusCode).toBe(400);
  });
});
