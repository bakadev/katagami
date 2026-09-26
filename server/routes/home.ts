import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { getSessionUser } from "../auth/session.js";
import {
  getOrCreateDefaultProject,
  teamIdsFor,
  visibleProject,
} from "../auth/access.js";
import { randomToken } from "../lib/random.js";
import type {
  ApiError,
  CreateDocumentRequest,
  CreateProjectRequest,
  CreateProjectResponse,
  DocumentRow,
  EditorRef,
  HomeResponse,
  MoveDocumentRequest,
  ProjectCard,
  ProjectPageResponse,
} from "../../shared/types.js";

/**
 * The signed-in home (/documents) and project pages. See
 * docs/plans/2026-09-26-signed-in-home.md for the rules.
 */

const NAME_MAX = 80;

function unauthenticated(): ApiError {
  return { error: "unauthenticated", message: "Sign in first" };
}
function notFound(): ApiError {
  return { error: "not_found", message: "Not found" };
}
function teamOnly(): ApiError {
  return { error: "team_required", message: "Projects come with Team" };
}

type DocWithTokens = {
  id: string;
  projectId: string;
  title: string | null;
  updatedAt: Date;
  lastEditedByName: string | null;
  lastEditedByColor: string | null;
  openComments: number;
  openSuggestions: number;
  permissions: { level: string; token: string }[];
};

const DOC_SELECT = {
  id: true,
  projectId: true,
  title: true,
  updatedAt: true,
  lastEditedByName: true,
  lastEditedByColor: true,
  openComments: true,
  openSuggestions: true,
  permissions: { select: { level: true, token: true } },
} as const;

function editorOf(d: { lastEditedByName: string | null; lastEditedByColor: string | null }): EditorRef | null {
  return d.lastEditedByName && d.lastEditedByColor
    ? { name: d.lastEditedByName, color: d.lastEditedByColor }
    : null;
}

function toRow(d: DocWithTokens): DocumentRow {
  return {
    id: d.id,
    projectId: d.projectId,
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
    lastEditedBy: editorOf(d),
    openComments: d.openComments,
    openSuggestions: d.openSuggestions,
    editToken: d.permissions.find((p) => p.level === "edit")?.token ?? "",
  };
}

function toCard(
  p: { id: string; name: string | null; updatedAt: Date },
  docs: { updatedAt: Date; lastEditedByName: string | null; lastEditedByColor: string | null }[],
): ProjectCard {
  const sorted = [...docs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const editors: EditorRef[] = [];
  for (const d of sorted) {
    const e = editorOf(d);
    if (e && !editors.some((x) => x.name === e.name)) editors.push(e);
    if (editors.length === 5) break;
  }
  return {
    id: p.id,
    name: p.name,
    documentCount: docs.length,
    updatedAt: (sorted[0]?.updatedAt ?? p.updatedAt).toISOString(),
    lastEditedBy: sorted[0] ? editorOf(sorted[0]) : null,
    editors,
  };
}

function validName(raw: unknown): string | null {
  const name = typeof raw === "string" ? raw.trim() : "";
  return name.length > 0 && name.length <= NAME_MAX ? name : null;
}

async function createDocumentIn(projectId: string) {
  const editToken = randomToken(32);
  const viewToken = randomToken(32);
  const document = await db.$transaction(async (tx) => {
    const doc = await tx.document.create({ data: { projectId } });
    await tx.permission.createMany({
      data: [
        { documentId: doc.id, level: "edit", token: editToken },
        { documentId: doc.id, level: "view", token: viewToken },
      ],
    });
    return doc;
  });
  return { document, editToken, viewToken };
}

export async function homeRoutes(app: FastifyInstance) {
  app.get("/api/home", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());

    const teamIds = await teamIdsFor(user.id);
    const memberships = teamIds.length
      ? await db.workspaceMember.findMany({
          where: { userId: user.id },
          include: { workspace: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
    const first = memberships[0];
    const team = first
      ? {
          id: first.workspace.id,
          name: first.workspace.name,
          slug: first.workspace.slug,
          role: first.role as "owner" | "editor",
        }
      : null;

    const defaultProject = await getOrCreateDefaultProject(user.id);
    const projects = await db.project.findMany({
      where: {
        isDefault: false,
        OR: [{ ownerId: user.id }, ...(teamIds.length ? [{ workspaceId: { in: teamIds } }] : [])],
      },
      include: {
        documents: {
          select: { updatedAt: true, lastEditedByName: true, lastEditedByColor: true },
        },
      },
    });
    const documents = await db.document.findMany({
      where: { projectId: defaultProject.id },
      select: DOC_SELECT,
      orderBy: { updatedAt: "desc" },
    });

    const body: HomeResponse = {
      plan: teamIds.length > 0 ? "team" : "free",
      team,
      projects: projects
        .map((p) => toCard(p, p.documents))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      documents: documents.map(toRow),
    };
    return body;
  });

  app.get<{ Params: { id: string } }>("/api/projects/:id", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    const project = await visibleProject(user, req.params.id);
    if (!project || project.isDefault) return reply.code(404).send(notFound());
    const documents = await db.document.findMany({
      where: { projectId: project.id },
      select: DOC_SELECT,
      orderBy: { updatedAt: "desc" },
    });
    const body: ProjectPageResponse = {
      project: toCard(project, documents),
      documents: documents.map(toRow),
    };
    return body;
  });

  /** New spec for a signed-in person: in a project they can see, or their default one. */
  app.post<{ Body: CreateDocumentRequest }>("/api/documents", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    let project;
    if (req.body?.projectId) {
      project = await visibleProject(user, req.body.projectId);
      if (!project) return reply.code(404).send(notFound());
    } else {
      project = await getOrCreateDefaultProject(user.id);
    }
    const { document, editToken, viewToken } = await createDocumentIn(project.id);
    const body: CreateProjectResponse = {
      project: { id: project.id, name: project.name },
      document: { id: document.id },
      permissions: { editToken, viewToken },
      creatorToken: project.creatorToken,
    };
    return reply.code(201).send(body);
  });

  app.post<{ Body: CreateProjectRequest }>("/api/projects/new", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    const teamIds = await teamIdsFor(user.id);
    if (teamIds.length === 0) return reply.code(403).send(teamOnly());
    const name = validName(req.body?.name);
    if (!name) {
      const body: ApiError = { error: "invalid_name", message: `Name must be 1 to ${NAME_MAX} characters` };
      return reply.code(400).send(body);
    }
    const project = await db.project.create({
      data: { name, ownerId: user.id, workspaceId: teamIds[0], creatorToken: randomToken(32) },
    });
    return reply.code(201).send({ project: toCard(project, []) });
  });

  /** Deleting a project sends its documents back to the caller's default project. */
  app.delete<{ Params: { id: string } }>("/api/projects/:id", async (req, reply) => {
    const user = await getSessionUser(req, reply);
    if (!user) return reply.code(401).send(unauthenticated());
    const project = await visibleProject(user, req.params.id);
    if (!project || project.isDefault) return reply.code(404).send(notFound());
    const fallback = await getOrCreateDefaultProject(user.id);
    await db.$transaction([
      db.document.updateMany({ where: { projectId: project.id }, data: { projectId: fallback.id } }),
      db.project.delete({ where: { id: project.id } }),
    ]);
    return reply.code(204).send();
  });

  /** Move a document between projects the caller can see. */
  app.patch<{ Params: { id: string }; Body: MoveDocumentRequest }>(
    "/api/docs/:id/project",
    async (req, reply) => {
      const user = await getSessionUser(req, reply);
      if (!user) return reply.code(401).send(unauthenticated());
      const doc = await db.document.findUnique({ where: { id: req.params.id } });
      if (!doc || !(await visibleProject(user, doc.projectId))) {
        return reply.code(404).send(notFound());
      }
      let target;
      if (req.body?.projectId == null) {
        target = await getOrCreateDefaultProject(user.id);
      } else {
        const teamIds = await teamIdsFor(user.id);
        if (teamIds.length === 0) return reply.code(403).send(teamOnly());
        target = await visibleProject(user, req.body.projectId);
        if (!target) return reply.code(404).send(notFound());
      }
      await db.document.update({ where: { id: doc.id }, data: { projectId: target.id } });
      return { ok: true, projectId: target.id };
    },
  );
}
