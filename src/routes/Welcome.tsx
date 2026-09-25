import { useState } from "react";
import { Link } from "react-router";
import { SiteFooter } from "~/components/site/SiteFooter";
import { usePageMeta } from "~/hooks/usePageMeta";
import { ASANOHA } from "~/components/site/patterns";
import { RegMark } from "~/components/site/RegMark";

/**
 * After sign-in, option A: a full-page stepper on the asanoha ground.
 *
 * Three steps across the top: 1 Sign in (done), 2 Name your workspace
 * (active), 3 Invite people (later). Only step 2 is live. The greeting
 * shows the provider avatar and name so the person can see which identity
 * they came in with. The workspace name is prefilled from the email domain.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const USER = { name: "Priya Raman", email: "priya@acme.co", provider: "Google", initials: "PR" };

const STEPS = [
  { n: 1, label: "Sign in", state: "done" as const },
  { n: 2, label: "Name your workspace", state: "active" as const },
  { n: 3, label: "Invite people", state: "later" as const },
];

export default function Welcome() {
  usePageMeta({
    title: "Welcome",
    description: "You're signed in. Name your workspace.",
  });
  const [name, setName] = useState("Acme");

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
                <span
                  style={{ fontFamily: SERIF, clipPath: NOTCH }}
                  className={
                    "flex size-8 shrink-0 items-center justify-center text-sm " +
                    (s.state === "done"
                      ? "bg-[var(--indigo)] text-white"
                      : s.state === "active"
                        ? "bg-[var(--indigo)] p-px text-[var(--indigo)] dark:bg-blue-300 dark:text-blue-300"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {s.state === "done" ? (
                    <Check />
                  ) : s.state === "active" ? (
                    <span
                      style={{ clipPath: NOTCH_IN }}
                      className="flex size-full items-center justify-center bg-card"
                    >
                      {s.n}
                    </span>
                  ) : (
                    s.n
                  )}
                </span>
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
              {USER.initials}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                Signed in as {USER.name} via {USER.provider}
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
            <form
              style={{ clipPath: NOTCH }}
              className="border border-[var(--indigo)] bg-card p-6 shadow-md sm:p-8 dark:border-blue-300/60"
              onSubmit={(e) => e.preventDefault()}
            >
              <p className="text-xs text-muted-foreground">Step 2 of 3</p>
              <h2 style={{ fontFamily: SERIF }} className="mt-2 text-2xl">
                Name your workspace
              </h2>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                A workspace holds your projects and the people on them. We guessed
                from your email; change it if that's not the team.
              </p>

              <label className="mt-6 grid gap-1.5 text-sm">
                <span className="font-medium">Workspace name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-xs text-muted-foreground">
                  From {USER.email}. You can rename it later.
                </span>
              </label>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  style={{ clipPath: NOTCH }}
                  className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Create workspace
                </button>
                <Link
                  to="/"
                  className="text-sm text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                >
                  Skip for now
                </Link>
              </div>
            </form>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Step 3, inviting people, can wait. 5 seats are included on Team and you
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
