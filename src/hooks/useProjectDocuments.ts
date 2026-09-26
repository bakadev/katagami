import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectPageResponse } from "@shared/types";
import { getProject } from "~/lib/api/auth";
import { useAuth } from "~/lib/auth/AuthProvider";

export type ProjectDocsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ProjectPageResponse }
  /** 404: the person's hidden default bucket, or a project they can't see. */
  | { status: "not-in-project" }
  | { status: "error" };

/**
 * The documents in the current document's project, for the right rail's
 * Documents tab. Fetches lazily the first time `enabled` turns true (the tab
 * is open) and only when signed in; the answer is cached here so switching
 * tabs doesn't refetch. Reopening the tab refreshes quietly in the background
 * while the cached list stays on screen.
 */
export function useProjectDocuments(
  projectId: string | null,
  enabled: boolean,
): { state: ProjectDocsState; refresh: () => void } {
  const userId = useAuth().user?.id ?? null;
  const [state, setState] = useState<ProjectDocsState>({ status: "idle" });
  const fetchedFor = useRef<string | null>(null);
  // Bumped by refresh() to refetch (after a rename from the tab).
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!projectId || !userId || !enabled) return;
    const firstTime = fetchedFor.current !== projectId;
    fetchedFor.current = projectId;
    if (firstTime) setState({ status: "loading" });
    let cancelled = false;
    getProject(projectId)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "";
        setState(message === "404" ? { status: "not-in-project" } : { status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the tab opens again (enabled flips) so the list stays fresh.
  }, [projectId, userId, enabled, tick]);

  // Signed out (or signed out later): nothing to show.
  useEffect(() => {
    if (!userId) {
      fetchedFor.current = null;
      setState({ status: "idle" });
    }
  }, [userId]);

  return { state, refresh };
}
