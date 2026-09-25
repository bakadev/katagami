import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";

/**
 * Sign in, option C: inline in the site.
 *
 * The site header and footer stay. The sign-in panel sits in the page flow
 * like a form, on a komon band, next to a "why an account" column in the
 * style of the Contact page's "what happens next" list. Feels like part of
 * the site rather than a gate in front of it.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const ASANOHA =
  tile(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/>
<path d='M28 0 L28 64 M0 16 L56 48 M56 16 L0 48'/>
<path d='M28 32 L56 16 M28 32 L0 16 M28 32 L0 48 M28 32 L56 48 M28 32 L28 0 M28 32 L28 64'/>
<path d='M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z' transform='translate(0,-16)'/>
<path d='M0 48 L28 64 M56 48 L28 64'/>
<path d='M0 80 L28 64 L56 80 M28 64 L28 97'/>
</g></svg>`);

const KOMON =
  tile(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<g fill='currentColor'><circle cx='4' cy='4' r='1.2'/><circle cx='12' cy='12' r='1.2'/></g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const WHY = [
  {
    title: "Projects hold many documents",
    body: "A spec is rarely one file. A project keeps the PRD, the research notes and the sign-off log together, with one set of people on all of them.",
  },
  {
    title: "Seats name the editors",
    body: "On Free, whoever holds the link can edit. On Team, editors are people with names, and you can remove one without rotating every link.",
  },
  {
    title: "History carries a signature",
    body: "Named snapshots record who took them. When someone asks when a decision was made, the answer has a person on it.",
  },
];

export default function SignInC() {
  usePageMeta({
    title: "Sign in",
    description: "Sign in to Katagami with GitHub or Google.",
  });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      <ExplorationBar round="auth" current="signin-c" />
      <SiteHeader />

      <main>
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[300px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-10 md:px-10 md:pt-16">
            <h1
              style={{ fontFamily: SERIF }}
              className="max-w-[18ch] text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              Sign in
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
              Accounts are needed for Team: projects, seats and named history.
              Free documents never need one.
            </p>
          </div>
        </section>

        <CutEdge />

        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[5fr_7fr] md:items-start md:px-10 md:py-20">
            {/* The panel */}
            <div>
              <div className="relative">
                <RegMark className="-left-3 -top-3" />
                <RegMark className="-right-3 -top-3" />
                <RegMark className="-bottom-3 -left-3" />
                <RegMark className="-bottom-3 -right-3" />
                <div
                  style={{ clipPath: NOTCH }}
                  className="border border-[var(--indigo)] bg-card p-6 shadow-md sm:p-8 dark:border-blue-300/60"
                >
                  <p className="text-xs text-muted-foreground">
                    Sign in or create an account
                  </p>
                  <div className="mt-4 grid gap-3">
                    <Provider icon={<GitHubIcon />}>
                      Continue with GitHub
                    </Provider>
                    <Provider icon={<GoogleIcon />}>
                      Continue with Google
                    </Provider>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    No password. Your first sign-in with a provider creates the
                    account.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm">
                    <Link
                      to="/"
                      className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                    >
                      Start a spec without an account
                    </Link>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                By continuing you agree to the{" "}
                <Link
                  to="/terms"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  privacy policy
                </Link>
                .
              </p>
            </div>

            {/* Why an account */}
            <div>
              <h2
                style={{ fontFamily: SERIF }}
                className="text-2xl leading-tight sm:text-3xl"
              >
                What an account is for
              </h2>
              <ol className="mt-8 space-y-8">
                {WHY.map((w, i) => (
                  <li key={w.title} className="flex gap-4">
                    <span
                      style={{ fontFamily: SERIF, clipPath: NOTCH }}
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[var(--indigo)] text-sm text-white"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium">{w.title}</h3>
                      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                        {w.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm text-muted-foreground">
                Not sure you need any of this?{" "}
                <Link
                  to="/pricing"
                  className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
                >
                  Compare Free and Team
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Provider({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
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
        <span className="inline-flex size-5 items-center justify-center">
          {icon}
        </span>
        {children}
      </span>
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function CutEdge() {
  return <div aria-hidden className="cut-edge" />;
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
