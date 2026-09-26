import { db } from "../db.js";
import { randomToken } from "../lib/random.js";
import type { SessionUser } from "./session.js";

/**
 * Who can see which project. A person sees projects they own and projects
 * in their teams. Their hidden default project holds documents "not in a
 * project"; it is created on first use.
 */

export type Plan = "free" | "team";

/**
 * Everyone has a team (made at sign-up), so membership says nothing about
 * the plan. Team comes from the admin override today and from a
 * subscription later. The teamCount argument is kept for that future.
 */
export function planFor(user: { planOverride: string | null }, _teamCount: number): Plan {
  if (user.planOverride === "free" || user.planOverride === "team") return user.planOverride;
  return "free";
}

export async function teamIdsFor(userId: string): Promise<string[]> {
  const rows = await db.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  return rows.map((r) => r.workspaceId);
}

export async function getOrCreateDefaultProject(userId: string) {
  const existing = await db.project.findFirst({ where: { ownerId: userId, isDefault: true } });
  if (existing) return existing;
  return db.project.create({
    data: { ownerId: userId, isDefault: true, creatorToken: randomToken(32) },
  });
}

/** The project, if the person may see it. */
export async function visibleProject(user: SessionUser, projectId: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return null;
  if (project.ownerId === user.id) return project;
  if (project.workspaceId && (await teamIdsFor(user.id)).includes(project.workspaceId)) {
    return project;
  }
  return null;
}

/** Whether the person may see this document, through its project. */
export async function canSeeDocument(user: SessionUser, documentId: string): Promise<boolean> {
  const doc = await db.document.findUnique({ where: { id: documentId }, select: { projectId: true } });
  if (!doc) return false;
  return (await visibleProject(user, doc.projectId)) !== null;
}
