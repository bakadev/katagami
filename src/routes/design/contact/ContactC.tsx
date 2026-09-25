import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ExplorationBar } from "../DesignIndex";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * Contact option C — a conversation.
 *
 * Four questions, one at a time, on a single stencil sheet. The cut edge
 * along the top fills in as you go, and a summary on the left restates what
 * you've said in a sentence, including what the team size means for price.
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

/** Same notch, 1px smaller, for the inner face of an outlined shape. */
const NOTCH_IN =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0 calc(100% - 9px), 0 9px)";

export default function ContactC() {
  const { create, loading } = useCreateDoc();
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [seats, setSeats] = useState(8);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const steps = ["Why", "Team", "Reply to", "Details"];
  const canNext =
    step === 0 ? reason !== null : step === 2 ? name.trim() !== "" && /.+@.+\..+/.test(email) : true;

  function reset() {
    setSent(false);
    setStep(0);
    setReason(null);
    setMessage("");
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
      }}
    >
      <ExplorationBar round="contact" current="c" />
      <Header create={create} loading={loading} />

      <main>
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage: "linear-gradient(to bottom, black 0%, black 35%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 35%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-[5fr_7fr] md:items-start md:px-10 md:pt-16">
            <div>
              <h1
                style={{ fontFamily: SERIF }}
                className="text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
              >
                Four short questions.
              </h1>
              <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
                Enough for us to reply properly, not enough to feel like a form.
              </p>

              {/* Live summary */}
              <div className="mt-10 border-l-2 border-[var(--indigo)] pl-4 text-sm">
                <p className="text-xs text-muted-foreground">So far</p>
                <p className="mt-1 leading-relaxed">
                  {reason ? (
                    <>
                      <span className="text-foreground">{REASONS.find((r) => r.id === reason)?.summary}</span>
                      {step >= 1 && (
                        <>
                          {" "}for a team of <span className="text-foreground">{seats}</span>
                          {seats <= 2 ? ", which fits on Free" : seats <= 5 ? ", within Team's five seats" : `, about $${39 + (seats - 5) * 8} a month on Team`}
                        </>
                      )}
                      {name && step >= 2 && (
                        <>
                          . We'll reply to <span className="text-foreground">{name}</span>
                          {company && <> at <span className="text-foreground">{company}</span></>}
                        </>
                      )}
                      .
                    </>
                  ) : (
                    <span className="text-muted-foreground">Nothing yet.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="relative">
              <RegMark className="-left-3 -top-3" />
              <RegMark className="-right-3 -top-3" />
              <RegMark className="-bottom-3 -left-3" />
              <RegMark className="-bottom-3 -right-3" />
              {sent ? (
                <Sent email={email} onReset={reset} />
              ) : (
                <div style={{ clipPath: NOTCH }} className="border border-[var(--indigo)] bg-card shadow-md">
                  {/* Progress: the cut edge fills in as you go */}
                  <div className="flex" aria-hidden>
                    {steps.map((s, i) => (
                      <div
                        key={s}
                        className={
                          "h-1.5 flex-1 " +
                          (i <= step ? "bg-[var(--indigo)] dark:bg-blue-300" : "bg-border")
                        }
                      />
                    ))}
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="text-xs text-muted-foreground">
                      {step + 1} of {steps.length} · {steps[step]}
                    </p>

                    {step === 0 && (
                      <fieldset className="mt-3">
                        <legend style={{ fontFamily: SERIF }} className="text-2xl">
                          What brings you here?
                        </legend>
                        <div className="mt-5 grid gap-3">
                          {REASONS.map((r) => (
                            <Outlined key={r.id} full active={reason === r.id} onClick={() => setReason(r.id)}>
                              {r.label}
                            </Outlined>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {step === 1 && (
                      <div className="mt-3">
                        <p style={{ fontFamily: SERIF }} className="text-2xl">
                          How many people would edit?
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          People who only read or comment don't count.
                        </p>
                        <div className="mt-6 flex items-center justify-between">
                          <label htmlFor="seats" className="text-sm font-medium">People who edit</label>
                          <div className="flex items-center gap-2">
                            <Stepper label="Fewer" onClick={() => setSeats((s) => Math.max(1, s - 1))} disabled={seats <= 1}>–</Stepper>
                            <span style={{ fontFamily: SERIF }} className="w-10 text-center text-2xl tabular-nums">{seats}</span>
                            <Stepper label="More" onClick={() => setSeats((s) => Math.min(200, s + 1))} disabled={seats >= 200}>+</Stepper>
                          </div>
                        </div>
                        <input
                          id="seats"
                          type="range"
                          min={1}
                          max={200}
                          value={seats}
                          onChange={(e) => setSeats(Number(e.target.value))}
                          className="mt-5 w-full accent-[var(--indigo)]"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>1</span><span>5 in Team</span><span>200</span>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="mt-3 grid gap-5">
                        <p style={{ fontFamily: SERIF }} className="text-2xl">
                          Where should we reply?
                        </p>
                        <Field label="Your name">
                          <input required className={INPUT} placeholder="Priya Raman" value={name} onChange={(e) => setName(e.target.value)} />
                        </Field>
                        <Field label="Work email">
                          <input required type="email" className={INPUT} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </Field>
                        <Field label="Company" hint="optional">
                          <input className={INPUT} placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </Field>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="mt-3 grid gap-5">
                        <p style={{ fontFamily: SERIF }} className="text-2xl">
                          Anything else we should know?
                        </p>
                        <Field label="Message" hint="optional">
                          <textarea rows={5} className={INPUT + " h-auto py-2"} placeholder="Tools you use today, a deadline, a question." value={message} onChange={(e) => setMessage(e.target.value)} />
                        </Field>
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0}
                        className="text-sm text-muted-foreground hover:text-foreground disabled:invisible"
                      >
                        Back
                      </button>
                      {step < steps.length - 1 ? (
                        <Primary onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                          Next
                        </Primary>
                      ) : (
                        <Primary onClick={() => setSent(true)}>Send</Primary>
                      )}
                    </div>
                  </div>
                </div>
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

/** Outlined notch: indigo outer face + card inner face, because a CSS border is cut off at the notches. */
function Outlined({
  children,
  onClick,
  active,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ clipPath: NOTCH }}
      className={
        "group h-11 bg-[var(--indigo)] p-px text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-blue-300 " +
        (full ? "w-full " : "") +
        (active ? "text-white" : "text-[var(--indigo)] dark:text-blue-300")
      }
    >
      <span
        style={{ clipPath: NOTCH_IN }}
        className={
          "flex h-full w-full items-center justify-center px-5 " +
          (active
            ? "bg-[var(--indigo)] dark:bg-[var(--indigo)] dark:text-white"
            : "bg-card group-hover:bg-[var(--indigo-soft)]")
        }
      >
        {children}
      </span>
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

const REASONS = [
  { id: "enterprise", label: "Enterprise and pricing", summary: "Enterprise and pricing" },
  { id: "help", label: "Help with a document", summary: "Help with a document" },
  { id: "press", label: "Press or partnerships", summary: "Press or partnerships" },
  { id: "other", label: "Something else", summary: "Something else" },
];

function Stepper({
  children,
  label,
  onClick,
  disabled,
}: {
  children: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{ clipPath: NOTCH }}
      className="group size-8 bg-[var(--indigo)] p-px text-lg leading-none text-[var(--indigo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 dark:bg-blue-300 dark:text-blue-300"
    >
      <span
        style={{ clipPath: NOTCH_IN }}
        className="flex h-full w-full items-center justify-center bg-card group-hover:bg-[var(--indigo-soft)]"
      >
        {children}
      </span>
    </button>
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
