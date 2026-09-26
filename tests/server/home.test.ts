import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import * as Y from "yjs";
import { buildServer } from "../../server/index.js";
import { resetDb } from "../helpers.js";
import { db } from "../../server/db.js";
import type { OAuthProfile, OAuthProvider } from "../../server/auth/providers.js";
import { countOpenItems } from "../../server/ws/persistence.js";

/** The signed-in home: default project, visibility, projects, moves, deletes. */

function fake(profile: OAuthProfile): OAuthProvider {
  return {
    name: "github",
    label: "GitHub",
    usesPkce: false,
    createAuthorizationURL: (state) => new URL(`https://p.test/a?state=${state}`),
    exchange: async () => profile,
  };
}

const PRIYA: OAuthProfile = { providerId: "1", email: "priya@acme.co", emailVerified: true, name: "Priya Raman", avatarUrl: null };
const TOM: OAuthProfile = { providerId: "2", email: "tom@acme.co", emailVerified: true, name: "Tom Okafor", avatarUrl: null };

async function signIn(app: FastifyInstance): Promise<string> {
  const start = await app.inject({ method: "GET", url: "/api/auth/github" });
  const state = new URL(start.headers.location as string).searchParams.get("state")!;
  const oauth = start.cookies.find((c) => c.name === "katagami_oauth")!;
  const cb = await app.inject({
    method: "GET",
    url: `/api/auth/github/callback?code=ok&state=${state}`,
    headers: { cookie: `katagami_oauth=${oauth.value}` },
  });
  const session = cb.cookies.find((c) => c.name === "katagami_session")!;
  return `katagami_session=${session.value}`;
}

describe("signed-in home", () => {
  let priyaApp: FastifyInstance;
  let tomApp: FastifyInstance;
  beforeAll(async () => {
    priyaApp = await buildServer({ providers: { github: fake(PRIYA) } });
    tomApp = await buildServer({ providers: { github: fake(TOM) } });
  });
  afterAll(async () => {
    await priyaApp.close();
    await tomApp.close();
  });
  beforeEach(async () => {
    await resetDb();
  });

  it("requires a session", async () => {
    expect((await priyaApp.inject({ method: "GET", url: "/api/home" })).statusCode).toBe(401);
  });

  it("starts empty on Free and creates documents in a hidden default project", async () => {
    const cookie = await signIn(priyaApp);
    const home = await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } });
    expect(home.statusCode).toBe(200);
    expect(home.json()).toMatchObject({ plan: "free", team: null, projects: [], documents: [] });

    const created = await priyaApp.inject({ method: "POST", url: "/api/documents", headers: { cookie }, payload: {} });
    expect(created.statusCode).toBe(201);
    expect(created.json().permissions.editToken).toHaveLength(32);

    const again = (await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } })).json();
    expect(again.projects).toEqual([]);
    expect(again.documents).toHaveLength(1);
    expect(again.documents[0]).toMatchObject({ id: created.json().document.id, openComments: 0, editToken: created.json().permissions.editToken });

    // Free can't make projects or move documents.
    const proj = await priyaApp.inject({ method: "POST", url: "/api/projects/new", headers: { cookie }, payload: { name: "Checkout" } });
    expect(proj.statusCode).toBe(403);
    expect(proj.json().error).toBe("team_required");
    const dflt = await db.project.findFirst({ where: { isDefault: true } });
    expect(dflt!.ownerId).not.toBeNull();
  });

  it("on Team: creates, lists, renames, moves into and deletes projects", async () => {
    const cookie = await signIn(priyaApp);
    await priyaApp.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "Acme" } });
    const doc = (await priyaApp.inject({ method: "POST", url: "/api/documents", headers: { cookie }, payload: {} })).json();

    const proj = await priyaApp.inject({ method: "POST", url: "/api/projects/new", headers: { cookie }, payload: { name: "Checkout redesign" } });
    expect(proj.statusCode).toBe(201);
    const projectId = proj.json().project.id as string;

    const moved = await priyaApp.inject({ method: "PATCH", url: `/api/docs/${doc.document.id}/project`, headers: { cookie }, payload: { projectId } });
    expect(moved.statusCode).toBe(200);

    const home = (await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } })).json();
    expect(home.plan).toBe("team");
    expect(home.team.name).toBe("Acme");
    expect(home.documents).toEqual([]);
    expect(home.projects).toHaveLength(1);
    expect(home.projects[0]).toMatchObject({ id: projectId, name: "Checkout redesign", documentCount: 1 });

    const page = (await priyaApp.inject({ method: "GET", url: `/api/projects/${projectId}`, headers: { cookie } })).json();
    expect(page.documents.map((d: { id: string }) => d.id)).toEqual([doc.document.id]);

    const renamed = await priyaApp.inject({ method: "PATCH", url: `/api/projects/${projectId}`, headers: { cookie }, payload: { name: "Checkout v2" } });
    expect(renamed.json().project.name).toBe("Checkout v2");

    // A new spec inside the project lands there.
    const inProject = (await priyaApp.inject({ method: "POST", url: "/api/documents", headers: { cookie }, payload: { projectId } })).json();
    expect(inProject.project.id).toBe(projectId);

    // Back to the default bucket with null.
    await priyaApp.inject({ method: "PATCH", url: `/api/docs/${doc.document.id}/project`, headers: { cookie }, payload: { projectId: null } });
    expect((await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } })).json().documents).toHaveLength(1);

    // Deleting the project returns its remaining document to the default bucket.
    const gone = await priyaApp.inject({ method: "DELETE", url: `/api/projects/${projectId}`, headers: { cookie } });
    expect(gone.statusCode).toBe(204);
    const after = (await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } })).json();
    expect(after.projects).toEqual([]);
    expect(after.documents).toHaveLength(2);

    // Signed-in delete of a document.
    const del = await priyaApp.inject({ method: "DELETE", url: `/api/docs/${doc.document.id}`, headers: { cookie } });
    expect(del.statusCode).toBe(204);
  });

  it("keeps default projects private but shares team projects", async () => {
    const priya = await signIn(priyaApp);
    const tom = await signIn(tomApp);
    const team = (await priyaApp.inject({ method: "POST", url: "/api/teams", headers: { cookie: priya }, payload: { name: "Acme" } })).json().team;
    await db.workspaceMember.create({ data: { workspaceId: team.id, userId: (await db.user.findUnique({ where: { email: "tom@acme.co" } }))!.id, role: "editor" } });

    await priyaApp.inject({ method: "POST", url: "/api/documents", headers: { cookie: priya }, payload: {} });
    const project = (await priyaApp.inject({ method: "POST", url: "/api/projects/new", headers: { cookie: priya }, payload: { name: "Shared" } })).json().project;
    await priyaApp.inject({ method: "POST", url: "/api/documents", headers: { cookie: priya }, payload: { projectId: project.id } });

    const tomHome = (await tomApp.inject({ method: "GET", url: "/api/home", headers: { cookie: tom } })).json();
    expect(tomHome.documents).toEqual([]);
    expect(tomHome.projects.map((p: { id: string }) => p.id)).toEqual([project.id]);
    const tomPage = await tomApp.inject({ method: "GET", url: `/api/projects/${project.id}`, headers: { cookie: tom } });
    expect(tomPage.json().documents).toHaveLength(1);

    // A stranger's default project is invisible.
    const priyaDefault = await db.project.findFirst({ where: { isDefault: true, owner: { email: "priya@acme.co" } } });
    const peek = await tomApp.inject({ method: "GET", url: `/api/projects/${priyaDefault!.id}`, headers: { cookie: tom } });
    expect(peek.statusCode).toBe(404);
  });

  it("claiming a project makes the claimer its owner", async () => {
    const cookie = await signIn(priyaApp);
    const team = (await priyaApp.inject({ method: "POST", url: "/api/teams", headers: { cookie }, payload: { name: "Acme" } })).json().team;
    const anon = (await priyaApp.inject({ method: "POST", url: "/api/projects" })).json();
    await priyaApp.inject({ method: "POST", url: "/api/claim", headers: { cookie }, payload: { teamId: team.id, projects: [{ projectId: anon.project.id, token: anon.creatorToken }] } });
    const home = (await priyaApp.inject({ method: "GET", url: "/api/home", headers: { cookie } })).json();
    expect(home.projects.map((p: { id: string }) => p.id)).toEqual([anon.project.id]);
  });

  it("counts open threads and suggestions from the Yjs maps", () => {
    const ydoc = new Y.Doc();
    const threads = ydoc.getMap<string>("threads");
    threads.set("a", JSON.stringify({ id: "a", resolved: false }));
    threads.set("b", JSON.stringify({ id: "b", resolved: true }));
    threads.set("c", "not json");
    ydoc.getMap<string>("suggestions").set("s1", "{}");
    expect(countOpenItems(ydoc)).toEqual({ openComments: 1, openSuggestions: 1 });
  });
});
