import { db } from "../db.js";
import type { PermissionLevel } from "../../shared/types.js";

export async function validatePermissionToken(
  documentId: string,
  token: string | undefined | null,
): Promise<PermissionLevel | null> {
  if (!token) return null;

  const perm = await db.permission.findUnique({
    where: { token },
  });

  if (!perm || perm.documentId !== documentId) return null;
  if (perm.level !== "edit" && perm.level !== "view") return null;

  return perm.level as PermissionLevel;
}
