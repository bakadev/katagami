import { Link } from "react-router";
import { X } from "lucide-react";
import { NotchCard } from "~/components/site/NotchCard";
import { StencilMark } from "~/components/site/StencilMark";
import { lookupClaims } from "~/lib/api/auth";
import { clearCreatorToken, listCreatorTokens } from "~/lib/creator-token";
import type { ClaimLookupResponse } from "../../../../shared/types";

/**
 * The slim indigo-tinted strip about documents still on this browser. It
 * stays until dismissed; a dismissal remembers which projects it covered,
 * so a new key brings it back.
 *
 * The count comes from the server, not from the keys in localStorage: a key
 * whose project is gone, already claimed or mismatched is stale, and the
 * lookup drops those from storage so the number never drifts.
 */

const DISMISSED_KEY = "katagami:claim-dismissed";

export type VerifiedClaims = {
  projects: ClaimLookupResponse["projects"];
  /** Documents across the verified projects, for the copy. */
  documentCount: number;
  fingerprint: string;
  dismissed: boolean;
};

/** A stable fingerprint of the verified projects (djb2 over sorted ids). */
export function claimFingerprint(projects: { id: string }[]): string {
  const s = projects
    .map((p) => p.id)
    .sort()
    .join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${projects.length}:${(h >>> 0).toString(16)}`;
}

function isDismissed(fingerprint: string): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === fingerprint;
  } catch {
    return false; // storage blocked: never dismissed
  }
}

/**
 * Ask the server which of this browser's creator keys still open an
 * unclaimed project, and forget the ones that don't. Resolves with an empty
 * result when there are no keys at all (no request made).
 */
export async function verifyClaims(): Promise<VerifiedClaims> {
  const tokens = listCreatorTokens();
  if (tokens.length === 0) {
    return { projects: [], documentCount: 0, fingerprint: claimFingerprint([]), dismissed: false };
  }
  const { projects } = await lookupClaims(tokens);
  pruneStaleTokens(tokens, projects);
  const fingerprint = claimFingerprint(projects);
  return {
    projects,
    documentCount: projects.reduce((n, p) => n + p.documentCount, 0),
    fingerprint,
    dismissed: isDismissed(fingerprint),
  };
}

/** Drop the keys the server didn't return: their project is gone, claimed, or the token is wrong. */
export function pruneStaleTokens(tokens: { projectId: string }[], projects: { id: string }[]) {
  const live = new Set(projects.map((p) => p.id));
  for (const t of tokens) if (!live.has(t.projectId)) clearCreatorToken(t.projectId);
}

export function dismissClaim(fingerprint: string) {
  try {
    localStorage.setItem(DISMISSED_KEY, fingerprint);
  } catch {
    // storage blocked: the strip comes back next visit
  }
}

export function ClaimStrip({ count, onDismiss }: { count: number; onDismiss: () => void }) {
  return (
    <NotchCard tone="indigo" fill="tint" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 text-sm">
      <p className="flex items-center gap-3">
        <StencilMark className="size-4 shrink-0" />
        <span>
          {count === 1
            ? "A document from before you signed in is still on this browser."
            : `${count} documents from before you signed in are still on this browser.`}
        </span>
      </p>
      <span className="flex items-center gap-2">
        <Link
          to="/claim"
          className="font-medium text-brand-ink underline underline-offset-4 hover:opacity-80"
        >
          {count === 1 ? "Bring it in" : "Bring them in"}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          title="Dismiss"
          className="-mr-1.5 inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-brand-ink/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </NotchCard>
  );
}
