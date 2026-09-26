import { Link } from "react-router";
import { X } from "lucide-react";
import { NotchCard } from "~/components/site/NotchCard";
import { StencilMark } from "~/components/site/StencilMark";
import { listCreatorTokens } from "~/lib/creator-token";

/**
 * The slim indigo-tinted strip about documents still on this browser. It
 * stays until dismissed; a dismissal remembers which keys it covered, so a
 * new key brings it back.
 */

const DISMISSED_KEY = "katagami:claim-dismissed";

/** A stable fingerprint of the creator keys this browser holds (djb2 over sorted ids). */
export function claimFingerprint(tokens: { projectId: string }[]): string {
  const s = tokens
    .map((t) => t.projectId)
    .sort()
    .join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${tokens.length}:${(h >>> 0).toString(16)}`;
}

/** Keys held right now, and whether the strip should show for them. */
export function claimState(): { count: number; fingerprint: string; dismissed: boolean } {
  const tokens = listCreatorTokens();
  const fingerprint = claimFingerprint(tokens);
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISSED_KEY) === fingerprint;
  } catch {
    // storage blocked: never dismissed
  }
  return { count: tokens.length, fingerprint, dismissed };
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
