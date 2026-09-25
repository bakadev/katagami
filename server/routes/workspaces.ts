import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { getSessionUser } from "../auth/session.js";
import { randomToken } from "../lib/random.js";
import type {
  ApiError,
  ClaimLookupRequest,
  ClaimLookupResponse,
  ClaimRequest,
  ClaimResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
} from "../../shared/types.js";

/**
 * Workspaces (the Team plan's home for projects) and the claim flow that
 * moves Free documents a browser created into one.
 */

const NAME_MAX = 80;
const CLAIM_MAX = 100;

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

function unauthenticated(): ApiError {
  return { error: "unauthenticated", message: "Sign in first" };
}

function validClaims(raw: unknown): { projectId: string; token: string }[] | null {
  if (!Array.isArray(raw) || raw.length > CLAIM_MAX) return null;
  const out: { projectId: string; token: string }[] = [];
  for (const item of raw) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { projectId?: unknown }).projectId !== "string" ||
      typeof (item as { token?: unknown }).token !== "string"
    ) {
      return null;
    }
    const { projectId, token } = item as { projectId: string; token: string };
    if (!/^[0-9a-f-]{36}$/.test(projectId) || token.length === 0 || token.length > 128) return null;
    out.push({ projectId, token });
  }
  return out;
}

export async function workspaceRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateWorkspaceRequest }>("/api/workspaces", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (name.length === 0 || name.length > NAME_MAX) {
      const body: ApiError = {
        error: "invalid_name",
        message: `Name must be 1 to ${NAME_MAX} characters`,
      };
      return reply.code(400).send(body);
    }

    const base = slugify(name);
    const workspace = await db.$transaction(async (tx) => {
      let slug = base;
      while (await tx.workspace.findUnique({ where: { slug } })) {
        slug = `${base}-${randomToken(4).toLowerCase()}`;
      }
      const ws = await tx.workspace.create({ data: { name, slug } });
      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId: user.id, role: "owner" },
      });
      return ws;
    });

    const body: CreateWorkspaceResponse = {
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, role: "owner" },
    };
    return reply.code(201).send(body);
  });

  /** Which of the browser's creator tokens still point at unclaimed projects. */
  app.post<{ Body: ClaimLookupRequest }>("/api/claim/lookup", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    const claims = validClaims(req.body?.projects);
    if (!claims) {
      const body: ApiError = { error: "invalid_body", message: "Expected projects[]" };
      return reply.code(400).send(body);
    }
    const projects = await db.project.findMany({
      where: { id: { in: claims.map((c) => c.projectId) }, workspaceId: null },
      include: {
        documents: { orderBy: { updatedAt: "desc" }, select: { title: true, updatedAt: true } },
      },
    });
    const byId = new Map(claims.map((c) => [c.projectId, c.token]));
    const body: ClaimLookupResponse = {
      projects: projects
        .filter((p) => byId.get(p.id) === p.creatorToken)
        .map((p) => ({
          id: p.id,
          title: p.name ?? p.documents[0]?.title ?? null,
          documentCount: p.documents.length,
          updatedAt: (p.documents[0]?.updatedAt ?? p.updatedAt).toISOString(),
        })),
    };
    return body;
  });

  /** Move projects into a workspace the user belongs to. Invalid tokens are skipped. */
  app.post<{ Body: ClaimRequest }>("/api/claim", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    const claims = validClaims(req.body?.projects);
    const workspaceId = req.body?.workspaceId;
    if (!claims || typeof workspaceId !== "string") {
      const body: ApiError = {
        error: "invalid_body",
        message: "Expected workspaceId and projects[]",
      };
      return reply.code(400).send(body);
    }
    const membership = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!membership) {
      const body: ApiError = { error: "forbidden", message: "Not a member of that workspace" };
      return reply.code(403).send(body);
    }
    const projects = await db.project.findMany({
      where: { id: { in: claims.map((c) => c.projectId) }, workspaceId: null },
    });
    const byId = new Map(claims.map((c) => [c.projectId, c.token]));
    const ids = projects.filter((p) => byId.get(p.id) === p.creatorToken).map((p) => p.id);
    if (ids.length > 0) {
      await db.project.updateMany({ where: { id: { in: ids } }, data: { workspaceId } });
    }
    const body: ClaimResponse = { moved: ids };
    return body;
  });
}
