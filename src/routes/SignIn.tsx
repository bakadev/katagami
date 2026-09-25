import { Link } from "react-router";
import { SiteHeader } from "~/components/site/SiteHeader";
import { SiteFooter } from "~/components/site/SiteFooter";
import { StencilMark } from "~/components/site/StencilMark";
import { RegMarks } from "~/components/site/RegMark";
import { usePageMeta } from "~/hooks/usePageMeta";

/**
 * /signin. Accounts arrive with the Team plan, through GitHub or Google;
 * there is no email and password. Until OAuth ships this page states that
 * plainly rather than pretending. Round 6 of the design exploration holds
 * the candidate designs for the real page.
 */
export default function SignIn() {
  usePageMeta({
    title: "Sign in",
    description:
      "Sign in to Katagami with GitHub or Google. Free documents never need an account.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div
          aria-hidden
          className="komon pointer-events-none absolute inset-0 text-brand-ink opacity-[0.10] dark:opacity-[0.16]"
        />
        <div className="relative w-full max-w-sm">
          <RegMarks />
          <div className="notch bg-border p-px">
            <div className="notch-in bg-card p-8">
              <div className="flex items-center gap-2.5">
                <StencilMark />
                <span className="font-serif text-xl">Katagami</span>
              </div>
              <h1 className="mt-6 font-serif text-3xl leading-tight">Sign in</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Accounts are needed for Team: projects, seats and named
                history. Free documents never need one.
              </p>
              <div className="mt-6 grid gap-2">
                {["Continue with GitHub", "Continue with Google"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title="Accounts arrive with the Team plan"
                    className="notch-sm h-11 w-full bg-brand text-sm font-medium text-brand-foreground disabled:opacity-60"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sign-in opens with the Team plan. Nothing to set up yet.
              </p>
              <p className="mt-6 text-sm">
                <Link to="/" className="text-brand-ink underline underline-offset-4">
                  Start a spec without an account
                </Link>
              </p>
              <p className="mt-6 text-xs text-muted-foreground">
                By signing in you agree to the{" "}
                <Link to="/terms" className="underline underline-offset-4">
                  terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline underline-offset-4">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
