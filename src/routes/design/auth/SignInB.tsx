import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";

/**
 * Sign in, option B: split.
 *
 * Left half is indigo cloth with the seigaiha dyed through: a short serif
 * statement of what an account unlocks, three lines each with the mark.
 * Right half is the sign-in card on the plain ground. On a phone the
 * indigo half becomes a band above the card.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const UNLOCKS = [
  { title: "Projects", body: "Many documents under one name, with one set of people." },
  { title: "Seats", body: "Named editors instead of whoever holds the link." },
  { title: "Named history", body: "Every snapshot says who took it and who signed off." },
];

export default function SignInB() {
  usePageMeta({
    title: "Sign in",
    description: "Sign in to Katagami with GitHub or Google.",
  });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      <ExplorationBar round="auth" current="signin-b" />

      <main className="grid md:min-h-[calc(100vh-2.25rem)] md:grid-cols-2">
        {/* Indigo half */}
        <section className="relative bg-[var(--indigo)] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-white opacity-[0.16]"
            style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
          />
          <div className="relative flex h-full flex-col px-6 py-10 md:px-12 md:py-14 lg:px-16">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <StencilMark white />
              <span style={{ fontFamily: SERIF }} className="text-xl">
                Katagami
              </span>
            </Link>

            <div className="my-auto max-w-[30ch] py-10 md:py-16">
              <h2 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
                Sign in to use Team. Free documents never need an account.
              </h2>
              <ul className="mt-10 space-y-6">
                {UNLOCKS.map((u) => (
                  <li key={u.title} className="flex gap-4">
                    <span className="mt-1 shrink-0">
                      <StencilMark white />
                    </span>
                    <div>
                      <p className="font-medium">{u.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/75">{u.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="hidden text-xs text-white/60 md:block">
              型紙, a stencil the whole team fills in.
            </p>
          </div>
        </section>

        {/* Plain half */}
        <section className="flex items-center justify-center px-6 py-14 md:px-12">
          <div className="w-full max-w-sm">
            <div className="relative">
              <RegMark className="-left-3 -top-3" />
              <RegMark className="-right-3 -top-3" />
              <RegMark className="-bottom-3 -left-3" />
              <RegMark className="-bottom-3 -right-3" />
              <div
                style={{ clipPath: NOTCH }}
                className="border border-border bg-card p-6 shadow-sm sm:p-8"
              >
                <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight">
                  Sign in
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Accounts are needed for Team: projects, seats and named history.
                  Free documents never need one.
                </p>

                <div className="mt-7 grid gap-3">
                  <Provider icon={<GitHubIcon />}>Continue with GitHub</Provider>
                  <Provider icon={<GoogleIcon />}>Continue with Google</Provider>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  First time with a provider creates your account. No password to keep.
                </p>

                <div className="mt-7 border-t border-border pt-5 text-sm">
                  <Link
                    to="/"
                    className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                  >
                    Start a spec without an account
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              By continuing you agree to the{" "}
              <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
                terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Provider({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      style={{ clipPath: NOTCH }}
      className="group w-full bg-[var(--indigo)] p-px text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-blue-300"
    >
      <span
        style={{ clipPath: NOTCH_IN }}
        className="flex h-11 items-center gap-3 bg-card px-4 text-sm font-medium group-hover:bg-muted/60"
      >
        <span className="inline-flex size-5 items-center justify-center">{icon}</span>
        {children}
      </span>
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function RegMark({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`absolute size-4 text-[var(--indigo)] opacity-60 dark:text-blue-300 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="8" cy="8" r="4" />
      <path d="M8 0v16M0 8h16" />
    </svg>
  );
}

function StencilMark({ white }: { white?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={"size-5 " + (white ? "text-white" : "text-[var(--indigo)] dark:text-blue-300")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
