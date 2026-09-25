import { useState, type ReactNode } from "react";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";
import { ASANOHA, KOMON, SEIGAIHA } from "~/components/site/patterns";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMark } from "~/components/site/RegMark";
import { StencilMark } from "~/components/site/StencilMark";

/**
 * /contact. Chosen from the Round 3 design exploration (option B, pick a path).
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

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const TEAM_SIZES = ["Just me", "2 to 5", "6 to 20", "21 to 100", "More than 100"];

export default function Contact() {
  usePageMeta({
    title: "Contact",
    description:
      "Enterprise and pricing, help with a document, or press and partnerships. A person reads every message.",
  });
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
        ["--indigo-tint" as string]: `color-mix(in srgb, ${INDIGO} 16%, var(--card))`,
      }}
    >
      <SiteHeader />

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
                  className={
                    "notch group relative p-px text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (active ? "bg-brand-ink" : "bg-border")
                  }
                >
                  <span
                    className={
                      "notch-in block h-full p-6 " +
                      (active ? "bg-brand-tint" : "bg-card group-hover:bg-muted/60")
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
                  <NotchCard
                    as="form"
                    key={path}
                    tone="indigo"
                    shadow
                    className="grid gap-5 p-6 sm:p-8"
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
                  </NotchCard>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

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
      <NotchCard tone="indigo" className="p-8 text-center" role="status">
        <StencilMark className="dark:text-brand" />
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
      </NotchCard>
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
