import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * Contact option B — pick a path, then a short form.
 *
 * Three doors (Enterprise and pricing, help with a document, press and
 * partnerships). The chosen door reshapes the form so it only asks for what
 * that conversation needs.
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

const KOMON = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<g fill='currentColor'><circle cx='4' cy='4' r='1.2'/><circle cx='12' cy='12' r='1.2'/></g></svg>`);

const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

const TEAM_SIZES = ["Just me", "2 to 5", "6 to 20", "21 to 100", "More than 100"];

export default function ContactB() {
  const { create, loading } = useCreateDoc();
  const [sent, setSent] = useState(false);
  const [path, setPath] = useState<PathId>("enterprise");
  const [email, setEmail] = useState("");
  const door = DOORS.find((d) => d.id === path)!;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
        // Opaque tint for faces that sit on a coloured outer layer.
        ["--indigo-tint" as string]: `color-mix(in oklch, ${INDIGO} 14%, var(--card))`,
      }}
    >
      <ExplorationBar round="contact" current="b" />
      <Header create={create} loading={loading} />

      <main>
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[360px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-10 text-center md:px-10 md:pt-16">
            <h1
              style={{ fontFamily: SERIF }}
              className="mx-auto max-w-[18ch] text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              What do you need?
            </h1>
            <p className="mx-auto mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
              Pick the door. The form below only asks for what that
              conversation needs.
            </p>
          </div>

          {/* Three doors */}
          <div className="relative mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3 md:px-10" role="tablist" aria-label="Reason for contact">
            {DOORS.map((d) => {
              const active = d.id === path;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setPath(d.id);
                    setSent(false);
                  }}
                  style={{ clipPath: NOTCH }}
                  className={
                    "group relative p-px text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (active ? "bg-[var(--indigo)] dark:bg-blue-300" : "bg-border")
                  }
                >
                  <span
                    style={{ clipPath: NOTCH_IN }}
                    className={
                      "block h-full p-6 " +
                      (active ? "bg-[var(--indigo-tint)]" : "bg-card group-hover:bg-muted/60")
                    }
                  >
                    <span className="flex items-center justify-between">
                      <span style={{ fontFamily: SERIF }} className="text-xl">
                        {d.title}
                      </span>
                      <span
                        aria-hidden
                        className={
                          "inline-block size-2.5 " +
                          (active ? "bg-[var(--indigo)] dark:bg-blue-300" : "bg-muted-foreground/30")
                        }
                      />
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                      {d.blurb}
                    </span>
                    <span className="mt-4 block text-xs text-muted-foreground">{d.reply}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <CutEdge />

        {/* Form on komon, shaped by the chosen door */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[5fr_7fr] md:items-start md:px-10">
            <div>
              <p className="text-xs text-muted-foreground">You picked</p>
              <h2 style={{ fontFamily: SERIF }} className="mt-2 text-3xl leading-tight sm:text-4xl">
                {door.heading}
              </h2>
              <p className="mt-4 max-w-[44ch] leading-relaxed text-muted-foreground">{door.lead}</p>
              <p className="mt-6 text-sm text-muted-foreground">
                Or email{" "}
                <a href="mailto:hello@katagami.app" className="text-[var(--indigo)] underline underline-offset-4 dark:text-blue-300">
                  hello@katagami.app
                </a>
                .
              </p>
            </div>

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
                    key={path}
                    style={{ clipPath: NOTCH }}
                    className="grid gap-5 border border-[var(--indigo)] bg-card p-6 shadow-md sm:p-8"
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

                    {path === "enterprise" && (
                      <>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Company">
                            <input required className={INPUT} placeholder="Company name" />
                          </Field>
                          <Field label="People who would edit">
                            <select className={INPUT} defaultValue="21 to 100">
                              {TEAM_SIZES.map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </Field>
                        </div>
                        <fieldset className="grid gap-2 text-sm">
                          <legend className="font-medium">What matters most</legend>
                          {["Single sign-on", "Retention and legal hold", "Domain-restricted links", "Uptime SLA"].map((o) => (
                            <label key={o} className="flex items-center gap-2 text-muted-foreground">
                              <input type="checkbox" className="size-4 accent-[var(--indigo)]" /> {o}
                            </label>
                          ))}
                        </fieldset>
                      </>
                    )}

                    {path === "help" && (
                      <Field label="Document link" hint="optional, we can only see it if you paste the key too">
                        <input className={INPUT} placeholder="https://katagami.bakadev.cloud/p/…/d/…?key=…" />
                      </Field>
                    )}

                    {path === "press" && (
                      <Field label="Outlet or organisation">
                        <input className={INPUT} placeholder="Where you write, or who you represent" />
                      </Field>
                    )}

                    <Field label={door.messageLabel}>
                      <textarea required rows={5} className={INPUT + " h-auto py-2"} placeholder={door.placeholder} />
                    </Field>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">Reply within one business day.</p>
                      <Primary type="submit">{door.cta}</Primary>
                    </div>
                  </form>
                </>
              )}
            </div>
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

type PathId = "enterprise" | "help" | "press";

const DOORS: {
  id: PathId;
  title: string;
  blurb: string;
  reply: string;
  heading: string;
  lead: string;
  messageLabel: string;
  placeholder: string;
  cta: string;
}[] = [
  {
    id: "enterprise",
    title: "Enterprise and pricing",
    blurb: "Sign-on, retention, seat agreements, or a walkthrough with your own spec.",
    reply: "Reply within one business day",
    heading: "Let's look at your spec together",
    lead: "Tell us roughly how many people edit and what your security team will ask about. We'll come back with a 30-minute slot and answers to the obvious questions.",
    messageLabel: "What should we know before the call?",
    placeholder: "Team, tools you use today, anything your security review will need.",
    cta: "Request a walkthrough",
  },
  {
    id: "help",
    title: "Help with a document",
    blurb: "Something isn't syncing, a link stopped working, or a restore went wrong.",
    reply: "Reply within one business day",
    heading: "What's happening in the document?",
    lead: "The more exact the better: what you did, what you expected, what you saw. If two people saw different things, say who.",
    messageLabel: "What happened",
    placeholder: "Two of us were editing and…",
    cta: "Send",
  },
  {
    id: "press",
    title: "Press and partnerships",
    blurb: "Writing about Katagami, or building something that should talk to it.",
    reply: "Reply within two business days",
    heading: "Tell us what you're working on",
    lead: "We're happy to answer questions, share the story behind the name, or talk about integrations once the API is public.",
    messageLabel: "Your message",
    placeholder: "What are you writing or building, and when do you need an answer?",
    cta: "Send",
  },
];

function CutEdge() {
  return (
    <div
      aria-hidden
      className="h-3 w-full text-[var(--indigo)] opacity-30 dark:text-blue-300"
      style={{
        backgroundImage: SEIGAIHA,
        backgroundSize: "40px 20px",
        backgroundPosition: "center bottom",
      }}
    />
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
