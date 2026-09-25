import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * Contact option A — one form, one promise.
 *
 * The form on a stencil sheet, and beside it a plain account of what
 * happens after you press send. Numbered because it really is a sequence.
 *
 * Forms here don't post anywhere yet: submit shows the "sent" state so the
 * flow can be reviewed. Wiring (email or an endpoint) comes with the build.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

/* ---- stencil tiles ------------------------------------------------------ */

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const ASANOHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/>
<path d='M28 0 L28 64 M0 16 L56 48 M56 16 L0 48'/>
<path d='M28 32 L56 16 M28 32 L0 16 M28 32 L0 48 M28 32 L56 48 M28 32 L28 0 M28 32 L28 64'/>
<path d='M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z' transform='translate(0,-16)'/>
<path d='M0 48 L28 64 M56 48 L28 64'/>
<path d='M0 80 L28 64 L56 80 M28 64 L28 97'/>
</g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";


const TEAM_SIZES = ["Just me", "2 to 5", "6 to 20", "21 to 100", "More than 100"];

export default function ContactA() {
  const { create, loading } = useCreateDoc();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
      }}
    >
      <ExplorationBar round="contact" current="a" />
      <Header create={create} loading={loading} />

      <main>
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-10 md:px-10 md:pt-16">
            <h1
              style={{ fontFamily: SERIF }}
              className="max-w-[20ch] text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              Talk to a person.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              Enterprise questions, help with a document, or anything else.
              One form, read by someone who works on Katagami.
            </p>
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 md:grid-cols-[7fr_5fr] md:items-start md:px-10">
            {/* Form on a stencil sheet */}
            <div className="relative">
              {sent ? (
                <Sent email={email} onReset={() => setSent(false)} />
              ) : (
                <>
                  <RegMark className="-left-3 -top-3" />
                  <RegMark className="-right-3 -top-3" />
                  <RegMark className="-bottom-3 -left-3" />
                  <RegMark className="-bottom-3 -right-3" />
                  <form
                    style={{ clipPath: NOTCH }}
                    className="grid gap-5 border border-border bg-card p-6 shadow-sm sm:p-8"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Your name">
                        <input required className={INPUT} placeholder="Priya Raman" />
                      </Field>
                      <Field label="Work email">
                        <input
                          required
                          type="email"
                          className={INPUT}
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Company" hint="optional">
                        <input className={INPUT} placeholder="Company name" />
                      </Field>
                      <Field label="Team size">
                        <select className={INPUT} defaultValue="6 to 20">
                          {TEAM_SIZES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="What is this about?">
                      <select className={INPUT} defaultValue="Enterprise and pricing">
                        <option>Enterprise and pricing</option>
                        <option>Help with a document</option>
                        <option>Press or partnerships</option>
                        <option>Something else</option>
                      </select>
                    </Field>
                    <Field label="Message">
                      <textarea
                        required
                        rows={5}
                        className={INPUT + " h-auto py-2"}
                        placeholder="What are you trying to do, and what's in the way?"
                      />
                    </Field>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        We use your email to reply and for nothing else.
                      </p>
                      <Primary type="submit">Send message</Primary>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* What happens next: a real sequence, so numbered */}
            <aside>
              <h2 style={{ fontFamily: SERIF }} className="text-2xl">
                What happens next
              </h2>
              <ol className="mt-6 space-y-6">
                {NEXT.map((n, i) => (
                  <li key={n.title} className="flex gap-4">
                    <span
                      style={{ fontFamily: SERIF, clipPath: NOTCH }}
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[var(--indigo)] text-sm text-white"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium">{n.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 border-l-2 border-[var(--indigo)] pl-4 text-sm">
                <p className="font-medium">Prefer email?</p>
                <p className="mt-1 text-muted-foreground">
                  <a href="mailto:hello@katagami.app" className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300">
                    hello@katagami.app
                  </a>{" "}
                  goes to the same people.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Header({ create, loading }: { create: () => void; loading: boolean }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
      <Link to="/" className="flex items-center gap-2.5">
        <StencilMark />
        <span style={{ fontFamily: SERIF }} className="text-xl">
          Katagami
        </span>
      </Link>
      <nav className="flex items-center gap-7 text-sm text-muted-foreground">
        <Link to="/pricing" className="hidden hover:text-foreground sm:inline">
          Pricing
        </Link>
        <span aria-current="page" className="hidden text-foreground sm:inline">
          Contact
        </span>
        <Link to="/developers" className="hidden hover:text-foreground sm:inline">
          For developers
        </Link>
        <button
          type="button"
          onClick={create}
          disabled={loading}
          className="bg-[var(--indigo)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          style={{ clipPath: NOTCH }}
        >
          Start a spec
        </button>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground md:px-10">
      <span className="flex items-center gap-2">
        <StencilMark small />
        <span style={{ fontFamily: SERIF }}>Katagami</span>
      </span>
      <span>型紙 — a stencil the whole team fills in</span>
    </footer>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const INPUT =
  "h-10 w-full border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Primary({
  children,
  onClick,
  type = "button",
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ clipPath: NOTCH }}
      className={
        "h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 " +
        (full ? "w-full" : "")
      }
    >
      {children}
    </button>
  );
}

function Sent({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="relative">
      <RegMark className="-left-3 -top-3" />
      <RegMark className="-right-3 -top-3" />
      <RegMark className="-bottom-3 -left-3" />
      <RegMark className="-bottom-3 -right-3" />
      <div
        style={{ clipPath: NOTCH }}
        className="border border-[var(--indigo)] bg-card p-8 text-center"
        role="status"
      >
        <StencilMark />
        <p style={{ fontFamily: SERIF }} className="mt-4 text-2xl">
          Sent.
        </p>
        <p className="mx-auto mt-2 max-w-[40ch] text-sm text-muted-foreground">
          A person reads every message. You'll hear back at{" "}
          <span className="text-foreground">{email || "the address you gave"}</span>{" "}
          within one business day.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 text-sm text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300"
        >
          Send another
        </button>
      </div>
    </div>
  );
}

const NEXT = [
  {
    title: "A person reads it",
    body: "Within one business day. No ticket number, no auto-reply, no queue.",
  },
  {
    title: "You get a reply from someone with a name",
    body: "If it's a quick answer, that's the reply. If it isn't, we say what we need from you.",
  },
  {
    title: "Enterprise: a 30-minute walkthrough",
    body: "Bring a real spec. We import it live and go through sign-on, retention and seats with your own document on screen.",
  },
];

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

function StencilMark({ small }: { small?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={small ? "size-3.5" : "size-5"}
      fill="none"
      stroke="var(--indigo)"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}
