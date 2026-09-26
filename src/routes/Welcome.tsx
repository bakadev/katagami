import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth/AuthProvider";
import { createTeam } from "~/lib/api/auth";
import { listCreatorTokens } from "~/lib/creator-token";
import { SiteFooter } from "~/components/site/SiteFooter";
import { usePageMeta } from "~/hooks/usePageMeta";
import { ASANOHA } from "~/components/site/patterns";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMark } from "~/components/site/RegMark";

/**
 * After sign-in, option A: a full-page stepper on the asanoha ground.
 *
 * Three steps across the top: 1 Sign in (done), 2 Name your team
 * (active), 3 Invite people (later). Only step 2 is live. The greeting
 * shows the provider avatar and name so the person can see which identity
 * they came in with. The team name is prefilled from the email domain.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** "priya@acme.co" → "Acme"; personal mailboxes fall back to the first name. */
export function guessTeamName(email: string, name: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const label = domain.split(".")[0] ?? "";
  const personal = new Set([
    "gmail", "googlemail", "yahoo", "outlook", "hotmail", "live", "icloud", "me", "proton",
    "protonmail", "aol", "msn", "fastmail", "hey", "pm",
  ]);
  if (label && !personal.has(label)) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const first = name.trim().split(/\s+/)[0] || "My";
  return `${first}'s team`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function Welcome() {
  usePageMeta({
    title: "Welcome",
    description: "You're signed in. Name your team.",
  });
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const hasUnclaimed = useMemo(() => listCreatorTokens().length > 0, []);
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && !user) return <Navigate to="/signin?next=%2Fwelcome" replace />;
  if (!user) return null;

  const value = name ?? guessTeamName(user.email, user.name);
  const STEPS = [
    { n: 1, label: "Sign in", state: "done" as const },
    { n: 2, label: "Name your team", state: "active" as const },
    hasUnclaimed
      ? { n: 3, label: "Move your documents", state: "later" as const }
      : { n: 3, label: "Invite people", state: "later" as const },
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createTeam(value.trim());
      await refresh();
      navigate(hasUnclaimed ? "/claim" : "/documents", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the team");
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-tint" as string]: `color-mix(in srgb, ${INDIGO} 16%, var(--card))`,
      }}
    >
      <main className="relative flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
          style={{
            backgroundImage: ASANOHA,
            backgroundSize: "56px 97px",
            maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-12 md:pt-16">
          {/* Stepper */}
          <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Setup steps">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                {s.state === "active" ? (
                  <NotchCard
                    as="span"
                    tone="indigo"
                    outerClassName="size-8 shrink-0"
                    style={{ fontFamily: SERIF }}
                    className="flex items-center justify-center text-sm text-[var(--indigo)] dark:text-blue-300"
                  >
                    {s.n}
                  </NotchCard>
                ) : (
                  <span
                    style={{ fontFamily: SERIF, clipPath: NOTCH }}
                    className={
                      "flex size-8 shrink-0 items-center justify-center text-sm " +
                      (s.state === "done"
                        ? "bg-[var(--indigo)] text-white"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {s.state === "done" ? <Check /> : s.n}
                  </span>
                )}
                <span
                  className={
                    "text-xs sm:text-sm " +
                    (s.state === "active"
                      ? "font-medium"
                      : s.state === "done"
                        ? "text-foreground/80"
                        : "text-muted-foreground")
                  }
                >
                  {s.label}
                  {s.state === "later" && (
                    <span className="hidden text-muted-foreground sm:inline"> · later</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4" aria-hidden>
            {STEPS.map((s) => (
              <div
                key={s.n}
                className={
                  "h-0.5 " +
                  (s.state === "later" ? "bg-border" : "bg-[var(--indigo)] dark:bg-blue-300")
                }
              />
            ))}
          </div>

          {/* Greeting */}
          <div className="mt-14 flex items-center gap-4">
            <span
              style={{ fontFamily: SERIF, clipPath: NOTCH }}
              className="flex size-14 shrink-0 items-center justify-center bg-[var(--indigo-tint)] text-xl text-[var(--indigo)] dark:text-blue-300"
              aria-hidden
            >
              {initialsOf(user.name)}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                Signed in as {user.name}
              </p>
              <h1 style={{ fontFamily: SERIF }} className="mt-1 text-3xl leading-tight sm:text-4xl">
                You're signed in.
              </h1>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative mt-10">
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
            <NotchCard
              as="form"
              tone="indigo"
              shadow
              className="p-6 sm:p-8"
              onSubmit={submit}
            >
              <p className="text-xs text-muted-foreground">Step 2 of 3</p>
              <h2 style={{ fontFamily: SERIF }} className="mt-2 text-2xl">
                Name your team
              </h2>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                A team holds your projects and the people on them. We guessed the
                name from your email; change it if that's not right.
              </p>

              <label className="mt-6 grid gap-1.5 text-sm">
                <span className="font-medium">Team name</span>
                <input
                  value={value}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  className="h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-xs text-muted-foreground">
                  From {user.email}. You can rename it later.
                </span>
              </label>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={busy || value.trim().length === 0}
                  style={{ clipPath: NOTCH }}
                  className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {busy ? "Creating…" : "Create team"}
                </button>
                <Link
                  to={hasUnclaimed ? "/claim" : "/documents"}
                  className="text-sm text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                >
                  Skip for now
                </Link>
              </div>
            </NotchCard>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            {hasUnclaimed
              ? "Step 3 moves the documents this browser created before you signed in. "
              : "Step 3, inviting people, can wait. "}
            5 seats are included on Team and you can add people any time. 5 seats are included on Team and you
            can add people any time.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
