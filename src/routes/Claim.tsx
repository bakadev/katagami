import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth/AuthProvider";
import { claimProjects, lookupClaims } from "~/lib/api/auth";
import { clearCreatorToken, listCreatorTokens } from "~/lib/creator-token";
import type { ClaimLookupResponse } from "../../shared/types";
import { SiteFooter } from "~/components/site/SiteFooter";
import { usePageMeta } from "~/hooks/usePageMeta";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMark } from "~/components/site/RegMark";
import { StencilMark } from "~/components/site/StencilMark";

/**
 * Claim a project, option B: a page.
 *
 * Left column explains, with the mark, what claiming means and what it
 * doesn't change. Right column is the list of documents found in this
 * browser as a notched table with checkboxes, all checked by default, so
 * the person can leave one behind. The primary button counts what's
 * selected. On a komon band like the Contact form.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

type Found = ClaimLookupResponse["projects"][number];

function formatEdited(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const days = (now.getTime() - d.getTime()) / 864e5;
  if (days < 7) {
    return `${d.toLocaleDateString([], { weekday: "short" })}, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Claim() {
  usePageMeta({
    title: "Claim your documents",
    description: "Move documents from this browser into your workspace.",
  });
  const { user, loading, workspaces } = useAuth();
  const navigate = useNavigate();
  const workspace = workspaces[0] ?? null;
  const [found, setFound] = useState<Found[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const candidates = listCreatorTokens();
    if (candidates.length === 0) {
      setFound([]);
      return;
    }
    let cancelled = false;
    lookupClaims(candidates)
      .then((res) => {
        if (cancelled) return;
        setFound(res.projects);
        setPicked(new Set(res.projects.map((p) => p.id)));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't look up documents");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!loading && !user) return <Navigate to="/signin?next=%2Fclaim" replace />;
  if (!loading && user && !workspace) return <Navigate to="/welcome" replace />;
  if (!user || !workspace) return null;

  const FOUND = found ?? [];
  const WORKSPACE = workspace.name;
  const all = FOUND.length > 0 && picked.size === FOUND.length;

  async function move() {
    if (busy || picked.size === 0 || !workspace) return;
    setBusy(true);
    setError(null);
    try {
      const tokens = listCreatorTokens().filter((c) => picked.has(c.projectId));
      const res = await claimProjects(workspace.id, tokens);
      // The key has done its job; the workspace owns these now.
      for (const id of res.moved) clearCreatorToken(id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't move the documents");
      setBusy(false);
    }
  }
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      <main className="relative flex-1">
        <div
          aria-hidden
          className="komon pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[5fr_7fr] md:items-start md:px-10 md:py-24">
          {/* Explanation */}
          <div>
            <StencilMark className="size-6" />
            <p className="mt-4 text-xs text-muted-foreground">Found in this browser</p>
            <h1 style={{ fontFamily: SERIF }} className="mt-2 text-3xl leading-tight sm:text-4xl">
              Bring your documents into {WORKSPACE}
            </h1>
            <p className="mt-5 max-w-[46ch] leading-relaxed text-muted-foreground">
              You wrote these before you had an account. This browser still holds the
              creator key for each one, which is how we know they're yours. Moving them
              in gives them the same seats and named history as the rest of the workspace.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Share links keep working. Everyone who has one opens the document at the same address.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Comments and history come along unchanged.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 bg-[var(--indigo)] dark:bg-blue-300" />
                Leave one unchecked and it stays a Free document you can claim later from this browser.
              </li>
            </ul>
          </div>

          {/* The table */}
          <div className="relative">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <NotchCard tone="indigo" shadow>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all documents"
                        checked={all}
                        onChange={() =>
                          setPicked(all ? new Set() : new Set(FOUND.map((d) => d.id)))
                        }
                        className="size-4 accent-[var(--indigo)]"
                      />
                    </th>
                    <th scope="col" className="py-3 pr-4 font-normal">
                      Document
                    </th>
                    <th scope="col" className="hidden py-3 pr-4 font-normal sm:table-cell">
                      Editing
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-normal">
                      Last edited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {found === null && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Looking for documents in this browser…
                      </td>
                    </tr>
                  )}
                  {found !== null && FOUND.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nothing to move. Documents you create while signed out will show up here.
                      </td>
                    </tr>
                  )}
                  {FOUND.map((d) => {
                    const on = picked.has(d.id);
                    return (
                      <tr key={d.id} className={on ? "" : "text-muted-foreground"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            id={`claim-${d.id}`}
                            checked={on}
                            onChange={() => toggle(d.id)}
                            className="size-4 accent-[var(--indigo)]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <label htmlFor={`claim-${d.id}`} className="block cursor-pointer">
                            {d.title ?? "Untitled"}
                          </label>
                        </td>
                        <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                          {d.documentCount === 1 ? "1 document" : `${d.documentCount} documents`}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-xs text-muted-foreground">
                          {formatEdited(d.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {error && (
                <p role="alert" className="border-t border-border px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-5">
                <p className="text-xs text-muted-foreground">
                  {picked.size} of {FOUND.length} selected
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/"
                    style={{ clipPath: NOTCH }}
                    className="group inline-block bg-border p-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      style={{ clipPath: NOTCH_IN }}
                      className="flex h-[42px] items-center bg-card px-5 text-sm font-medium group-hover:bg-muted/60"
                    >
                      Not now
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void move()}
                    disabled={busy || picked.size === 0}
                    style={{ clipPath: NOTCH }}
                    className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  >
                    {busy
                      ? "Moving…"
                      : `Move ${all ? "these" : picked.size} into ${WORKSPACE}`}
                  </button>
                </div>
              </div>
            </NotchCard>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
