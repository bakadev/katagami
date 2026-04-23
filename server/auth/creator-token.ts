import { db } from "../db.js";

export async function validateCreatorTokenForProject(
  projectId: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  return project.creatorToken === token;
}

export async function validateCreatorTokenForDocument(
  documentId: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc) return false;
  return doc.project.creatorToken === token;
}
