import { useState } from "react";
import { useNavigate } from "react-router";
import { createProject } from "~/lib/api";
import { createDocument } from "~/lib/api/auth";
import { useAuth } from "~/lib/auth/AuthProvider";
import { storeCreatorToken } from "~/lib/creator-token";

/**
 * Start a spec. Signed out: a new anonymous project with one document, and
 * the creator key kept in this browser. Signed in: a document in the given
 * project, or the person's default one.
 */
export function useCreateDoc(projectId?: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const body = user ? await createDocument(projectId) : await createProject();
      if (!user) storeCreatorToken(body.project.id, body.creatorToken);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return { create, loading, error };
}
