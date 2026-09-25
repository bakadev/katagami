import { ExplorationBar, useCreateDoc } from "../DesignIndex";

/**
 * Homepage option B — Product / Business user.
 *
 * Persona: a PO, PM, BA or strategist who has to get a mixed team to agree
 * on a spec before engineering (or an AI agent) builds from it. They live in
 * Google Docs and Slack threads today. The page is editorial: a serif
 * headline, wide margins, a spec excerpt with real-looking cursors and two
 * open comment threads. Sage green is the one accent; the yellow anchor
 * highlight is borrowed straight from the editor.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

export default function HomeProduct() {
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--sage" as string]: "#2f7a6d",
        ["--sage-soft" as string]: "color-mix(in oklch, #2f7a6d 12%, transparent)",
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <ExplorationBar round="home" current="product" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <span style={{ fontFamily: SERIF }} className="text-xl">
          Katagami
        </span>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          <a href="#process" className="hover:text-foreground">
            How teams use it
          </a>
          <a href="#history" className="hover:text-foreground">
            Sign-off
          </a>
          <a href="#handoff" className="hover:text-foreground">
            Handoff
          </a>
          <button
            type="button"
            onClick={create}
            disabled={loading}
            className="rounded-full bg-[var(--sage)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            Start a spec
          </button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-[4fr_7fr] md:items-center md:px-10 md:pt-16">
          <div>
            <h1
              style={{ fontFamily: SERIF }}
              className="text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              Write the spec together. Argue in the margins. Ship one version.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              A shared document for product, design, content and engineering
              to draft, question and agree on what gets built. Comments sit on
              the exact sentence they're about, and every sign-off is a
              version you can go back to.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={create}
                disabled={loading}
                className="h-11 rounded-full bg-[var(--sage)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {loading ? "Opening…" : "Start a spec"}
              </button>
              <span className="text-sm text-muted-foreground">
                No sign-up. Share a link, everyone's in.
              </span>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                Couldn't create the doc: {error}
              </p>
            )}
          </div>

          {/* Spec excerpt with cursors + threads, side by side */}
          <div className="grid gap-4 sm:grid-cols-[1fr_15rem] sm:items-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="text-xs text-muted-foreground">
                Checkout redesign · PRD · v3
              </p>
              <h2
                style={{ fontFamily: SERIF }}
                className="mt-2 text-2xl"
              >
                Guest checkout
              </h2>
              <p className="mt-4 text-[15px] leading-7">
                Shoppers can complete a purchase{" "}
                <mark className="rounded-sm bg-[var(--anchor)] px-0.5 text-foreground">
                  without creating an account
                </mark>
                . We ask for an email for the receipt and offer account
                creation on the confirmation screen.
              </p>
              <p className="mt-3 text-[15px] leading-7">
                Success is measured as{" "}
                <mark className="rounded-sm bg-[var(--anchor)] px-0.5 text-foreground">
                  checkout completion rate for first-time visitors
                </mark>{" "}
                over the four weeks after launch.
                <CursorLabel name="Priya · PM" color="var(--sage)" />
              </p>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                Out of scope: saved payment methods, loyalty points.
                <CursorLabel name="Jonas · Design" color="#c2563a" />
              </p>
            </div>

            {/* Threads */}
            <div className="space-y-3 sm:pt-10">
              <Thread
                author="Jonas"
                color="#c2563a"
                time="2m"
                body="Do we still ask for a phone number? Legal wanted it for fraud checks."
                replies={2}
              />
              <Thread
                author="Amara"
                color="#5b8def"
                time="just now"
                body="Four weeks is tight for a metric. Can we say six?"
                replies={0}
              />
            </div>
          </div>
        </section>

        {/* Process — this genuinely is a sequence, so steps are numbered */}
        <section id="process" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
            <h2
              style={{ fontFamily: SERIF }}
              className="max-w-[24ch] text-3xl leading-tight sm:text-4xl"
            >
              From a rough draft to a spec the whole team stands behind
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              <Step
                n={1}
                title="Draft in the open"
                body="Start with bullet points. Teammates see your cursor and can fill in their section while you write yours. No versions to email around."
              />
              <Step
                n={2}
                title="Question the sentence, not the doc"
                body="Select any phrase and leave a comment. The thread stays attached to that text even as the paragraph around it changes."
              />
              <Step
                n={3}
                title="Resolve and name the version"
                body="When a thread is settled, resolve it. When the doc is agreed, save a named snapshot. That's the version engineering builds from."
              />
            </ol>
          </div>
        </section>

        {/* Sign-off / history */}
        <section id="history" className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:px-10">
          <div className="order-2 md:order-1">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Version history</p>
              <ul className="mt-3 divide-y divide-border">
                <Snap name="v3 · approved by stakeholders" who="Priya" when="Today, 4:12 PM" named />
                <Snap name="v2 · after design review" who="Priya" when="Tue, 11:30 AM" named />
                <Snap name="Auto-snapshot" who="" when="Tue, 10:55 AM" />
                <Snap name="v1 · first full draft" who="Amara" when="Mon, 3:02 PM" named />
              </ul>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2
              style={{ fontFamily: SERIF }}
              className="text-3xl leading-tight sm:text-4xl"
            >
              Sign-off you can point to
            </h2>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
              Name a version when a decision is made. Later, when someone asks
              "when did we agree to that?", open the snapshot and see exactly
              what the doc said and which threads were resolved. Restore any
              version in one click if the conversation goes backwards.
            </p>
          </div>
        </section>

        {/* Handoff */}
        <section id="handoff" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
            <h2
              style={{ fontFamily: SERIF }}
              className="max-w-[24ch] text-3xl leading-tight sm:text-4xl"
            >
              Hand it to engineering, or to an agent, as plain Markdown
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <Hand
                title="Engineers"
                body="Download the .md and drop it in the repo next to the code. It reads the same in GitHub as it did in the review."
              />
              <Hand
                title="AI coding agents"
                body="Markdown is what agents read best. A finished spec is already a prompt; no reformatting, no copy-paste from a doc that fights you."
              />
              <Hand
                title="Documentation"
                body="Publish the same file to your docs site. The spec you agreed on becomes the reference, not a stale rewrite of it."
              />
            </div>
          </div>
        </section>

        {/* Quote + CTA */}
        <section className="bg-[var(--sage-soft)]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
            <blockquote
              style={{ fontFamily: SERIF }}
              className="max-w-[36ch] text-2xl leading-snug sm:text-3xl"
            >
              "We stopped having the 'which doc is current' meeting. There's
              one, and the comments are on it."
            </blockquote>
            <p className="mt-4 text-sm text-muted-foreground">
              Product lead, 40-person fintech team
            </p>
            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="mt-10 h-11 rounded-full bg-[var(--sage)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              Start a spec
            </button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground md:px-10">
        <span style={{ fontFamily: SERIF }}>Katagami</span>
        <span>型紙 — a stencil the whole team fills in</span>
      </footer>
    </div>
  );
}

function CursorLabel({ name, color }: { name: string; color: string }) {
  return (
    <span className="relative ml-0.5 inline-block align-baseline">
      <span
        aria-hidden
        className="inline-block h-[1.2em] w-[2px] translate-y-[3px]"
        style={{ background: color }}
      />
      <span
        className="absolute -top-[15px] left-0 whitespace-nowrap rounded-sm px-1 text-[9px] font-medium leading-[14px] text-white"
        style={{ background: color }}
      >
        {name}
      </span>
    </span>
  );
}

function Thread({
  author,
  color,
  time,
  body,
  replies,
}: {
  author: string;
  color: string;
  time: string;
  body: string;
  replies: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full"
          style={{ background: color }}
        />
        <span className="font-medium">{author}</span>
        <span className="text-muted-foreground">{time}</span>
        {replies > 0 && (
          <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
            {replies} replies
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-snug">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span
        style={{ fontFamily: SERIF }}
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--sage)] text-sm text-white"
      >
        {n}
      </span>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </li>
  );
}

function Snap({
  name,
  who,
  when,
  named,
}: {
  name: string;
  who: string;
  when: string;
  named?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span
        aria-hidden
        className={
          "inline-block size-2 rounded-full " +
          (named ? "bg-[var(--sage)]" : "bg-muted-foreground/40")
        }
      />
      <span className={named ? "" : "text-muted-foreground"}>{name}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {who && `${who} · `}
        {when}
      </span>
    </li>
  );
}

function Hand({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-[var(--sage)] pl-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
