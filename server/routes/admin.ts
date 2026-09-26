import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db.js";
import { env } from "../env.js";
import { getSessionUser, type SessionUser } from "../auth/session.js";
import { planFor } from "../auth/access.js";
import type {
  AdminOverviewResponse,
  AdminSetPlanRequest,
  ApiError,
} from "../../shared/types.js";

/**
 * Admin MVP: see users and teams, and flip a person between Free and Team
 * for testing. Who is an admin comes from ADMIN_EMAILS in the environment;
 * there is no UI to grant it.
 */

async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<SessionUser | null> {
  const user = await getSessionUser(req, reply);
  if (!user) {
    const body: ApiError = { error: "unauthenticated", message: "Sign in first" };
    reply.code(401).send(body);
    return null;
  }
  if (!env.ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    const body: ApiError = { error: "forbidden", message: "Admins only" };
    reply.code(403).send(body);
    return null;
  }
  return user;
}

/**
 * Remove a person and everything only they own: their projects (including
 * the hidden default one) with all documents, and any team where they were
 * the last member, with that team's projects. Teams with other members are
 * left alone; the person just leaves them.
 */
export async function deleteUserCompletely(userId: string): Promise<{ projects: number; documents: number; teams: number }> {
  return db.$transaction(async (tx) => {
    const memberships = await tx.workspaceMember.findMany({ where: { userId } });
    let teams = 0;
    for (const m of memberships) {
      const others = await tx.workspaceMember.count({
        where: { workspaceId: m.workspaceId, userId: { not: userId } },
      });
      if (others === 0) {
        // Cascades to the team's projects and their documents.
        await tx.workspace.delete({ where: { id: m.workspaceId } });
        teams++;
      }
    }
    const owned = await tx.project.findMany({ where: { ownerId: userId }, select: { id: true } });
    const documents = await tx.document.count({ where: { projectId: { in: owned.map((p) => p.id) } } });
    await tx.project.deleteMany({ where: { ownerId: userId } });
    await tx.user.delete({ where: { id: userId } });
    return { projects: owned.length, documents, teams };
  });
}

export async function adminRoutes(app: FastifyInstance) {
  app.delete<{ Params: { id: string } }>("/api/admin/users/:id", async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    if (req.params.id === admin.id) {
      const body: ApiError = { error: "not_yourself", message: "You can't delete your own account from here" };
      return reply.code(400).send(body);
    }
    const target = await db.user.findUnique({ where: { id: req.params.id } });
    if (!target) {
      const body: ApiError = { error: "not_found", message: "No such user" };
      return reply.code(404).send(body);
    }
    const removed = await deleteUserCompletely(target.id);
    return { id: target.id, removed };
  });

  app.get("/api/admin/overview", async (req, reply) => {
    if (!(await requireAdmin(req, reply))) return;

    const [users, teams, totals] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          workspaces: { include: { workspace: true } },
          projects: { select: { _count: { select: { documents: true } } } },
        },
      }),
      db.workspace.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          members: { include: { user: true } },
          projects: { select: { _count: { select: { documents: true } } } },
        },
      }),
      Promise.all([
        db.user.count(),
        db.workspace.count(),
        db.project.count({ where: { isDefault: false, ownerId: { not: null } } }),
        db.document.count(),
        db.document.count({ where: { project: { ownerId: null, workspaceId: null } } }),
      ]),
    ]);

    const body: AdminOverviewResponse = {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
        plan: planFor(u, u.workspaces.length),
        planOverride:
          u.planOverride === "free" || u.planOverride === "team" ? u.planOverride : null,
        teams: u.workspaces.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })),
        documentCount: u.projects.reduce((n, p) => n + p._count.documents, 0),
      })),
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        createdAt: t.createdAt.toISOString(),
        members: t.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })),
        projectCount: t.projects.length,
        documentCount: t.projects.reduce((n, p) => n + p._count.documents, 0),
      })),
      totals: {
        users: totals[0],
        teams: totals[1],
        projects: totals[2],
        documents: totals[3],
        anonymousDocuments: totals[4],
      },
    };
    return body;
  });

  /**
   * Flip a person's plan. Setting "team" for someone with no team also
   * creates a personal team so projects have somewhere to live.
   */
  app.patch<{ Params: { id: string }; Body: AdminSetPlanRequest }>(
    "/api/admin/users/:id/plan",
    async (req, reply) => {
      if (!(await requireAdmin(req, reply))) return;
      const value = req.body?.planOverride;
      if (value !== "free" && value !== "team" && value !== null) {
        const body: ApiError = { error: "invalid_plan", message: "planOverride must be free, team or null" };
        return reply.code(400).send(body);
      }
      const target = await db.user.findUnique({
        where: { id: req.params.id },
        include: { workspaces: true },
      });
      if (!target) {
        const body: ApiError = { error: "not_found", message: "No such user" };
        return reply.code(404).send(body);
      }
      await db.user.update({ where: { id: target.id }, data: { planOverride: value } });
      let teamCount = target.workspaces.length;
      if (value === "team" && teamCount === 0) {
        const base = target.name.trim().split(/\s+/)[0] || "Personal";
        let slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "team";
        while (await db.workspace.findUnique({ where: { slug } })) slug += "-x";
        await db.workspace.create({
          data: {
            name: `${base}'s team`,
            slug,
            members: { create: { userId: target.id, role: "owner" } },
          },
        });
        teamCount = 1;
      }
      return { id: target.id, planOverride: value, plan: planFor({ planOverride: value }, teamCount) };
    },
  );
}
