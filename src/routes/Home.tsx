import { useCreateDoc } from "~/hooks/useCreateDoc";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";
import { ASANOHA, KOMON, SEIGAIHA } from "~/components/site/patterns";
import { RegMark } from "~/components/site/RegMark";

/**
 * Homepage (root). Aimed at product, design, content and business people
 * who need a team to agree on a spec. Developers have their own door at
 * /developers. Chosen from the Round 1 design exploration ("Product v2").
 *
 * The material: katagami (型紙) are hand-cut paper stencils used to dye
 * patterns into cloth, traditionally indigo. So the page borrows three
 * things from the craft:
 *
 * 1. Real stencil motifs as ground, not decoration: asanoha (hemp leaf)
 *    behind the hero, komon (fine dots) on the process band, seigaiha
 *    (waves) as the indigo ground of the quote block. All drawn as small
 *    inline SVG tiles at stencil-like low contrast.
 * 2. Cut paper: cards get notched corners like a stencil sheet, with the
 *    registration marks a dyer uses to align repeats. Section boundaries
 *    are a thin cut-edge strip instead of a plain rule.
 * 3. Aizome indigo as the one accent. The yellow anchor highlight stays
 *    because it's the product's own.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

/** Stencil-sheet corners: a small 45° notch cut from each corner. */
const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

export default function Home() {
  usePageMeta({
    title: "Katagami",
    description:
      "Write the spec together. Argue in the margins. Ship one version. Collaborative Markdown for product, design and engineering teams.",
    bare: true,
  });
  const { create, loading, error } = useCreateDoc();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <SiteHeader />

      <main>
        {/* Hero, on an asanoha ground that fades out toward the bottom */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
            style={{
              backgroundImage: ASANOHA,
              backgroundSize: "56px 97px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-[4fr_7fr] md:items-center md:px-10 md:pt-16">
            <div>
              <h1
                style={{ fontFamily: SERIF }}
                className="text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
              >
                Write the spec together. Argue in the margins. Ship one
                version.
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
                A shared document for product, design, content and engineering
                to draft, question and agree on what gets built. Comments sit
                on the exact sentence they're about, and every sign-off is a
                version you can go back to.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={create}
                  disabled={loading}
                  style={{ clipPath: NOTCH }}
                  className="h-11 bg-[var(--indigo)] px-6 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
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

            {/* Spec excerpt as a stencil sheet: notched corners, registration marks */}
            <div className="grid gap-4 sm:grid-cols-[1fr_15rem] sm:items-start">
              <div className="relative">
                <RegMark className="-left-3 -top-3" />
                <RegMark className="-right-3 -top-3" />
                <RegMark className="-bottom-3 -left-3" />
                <RegMark className="-bottom-3 -right-3" />
                <div
                  style={{ clipPath: NOTCH }}
                  className="border border-border bg-card p-6 shadow-sm sm:p-8"
                >
                  <p className="text-xs text-muted-foreground">
                    Checkout redesign · PRD · v3
                  </p>
                  <h2 style={{ fontFamily: SERIF }} className="mt-2 text-2xl">
                    Guest checkout
                  </h2>
                  <p className="mt-4 text-[15px] leading-7">
                    Shoppers can complete a purchase{" "}
                    <mark className="bg-[var(--anchor)] px-0.5 text-foreground">
                      without creating an account
                    </mark>
                    . We ask for an email for the receipt and offer account
                    creation on the confirmation screen.
                  </p>
                  <p className="mt-3 text-[15px] leading-7">
                    Success is measured as{" "}
                    <mark className="bg-[var(--anchor)] px-0.5 text-foreground">
                      checkout completion rate for first-time visitors
                    </mark>{" "}
                    over the four weeks after launch.
                    <CursorLabel name="Priya · PM" color="var(--indigo)" />
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                    Out of scope: saved payment methods, loyalty points.
                    <CursorLabel name="Jonas · Design" color="#b5452c" />
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:pt-10">
                <Thread
                  author="Jonas"
                  color="#b5452c"
                  time="2m"
                  body="Do we still ask for a phone number? Legal wanted it for fraud checks."
                  replies={2}
                />
                <Thread
                  author="Amara"
                  color="#3f7f9e"
                  time="just now"
                  body="Four weeks is tight for a metric. Can we say six?"
                  replies={0}
                />
              </div>
            </div>
          </div>
        </section>

        <CutEdge />

        {/* Process on a komon ground. Numbered because it is a sequence. */}
        <section
          id="process"
          className="relative text-foreground"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[var(--indigo)] opacity-[0.12] dark:text-blue-300 dark:opacity-[0.22]"
            style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10">
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

        <CutEdge />

        {/* Sign-off / history */}
        <section
          id="history"
          className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:px-10"
        >
          <div className="order-2 md:order-1">
            <div
              style={{ clipPath: NOTCH }}
              className="border border-border bg-card p-5"
            >
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

        <CutEdge />

        {/* Handoff */}
        <section id="handoff">
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

        {/* Quote + CTA: indigo cloth, seigaiha dyed through the stencil */}
        <section className="relative bg-[var(--indigo)] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-white opacity-[0.16]"
            style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10">
            <blockquote
              style={{ fontFamily: SERIF }}
              className="max-w-[36ch] text-2xl leading-snug sm:text-3xl"
            >
              "We stopped having the 'which doc is current' meeting. There's
              one, and the comments are on it."
            </blockquote>
            <p className="mt-4 text-sm text-white/70">
              Product lead, 40-person fintech team
            </p>
            <button
              type="button"
              onClick={create}
              disabled={loading}
              style={{ clipPath: NOTCH }}
              className="mt-10 h-11 bg-white px-6 text-sm font-medium text-[var(--indigo)] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
            >
              Start a spec
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

/** Thin strip of seigaiha standing in for a section rule: the cut edge of the sheet. */
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

function CursorLabel({ name, color }: { name: string; color: string }) {
  return (
    <span className="relative ml-0.5 inline-block align-baseline">
      <span
        aria-hidden
        className="inline-block h-[1.2em] w-[2px] translate-y-[3px]"
        style={{ background: color }}
      />
      <span
        className="absolute -top-[15px] left-0 whitespace-nowrap px-1 text-[9px] font-medium leading-[14px] text-white"
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
    <div
      style={{ clipPath: NOTCH }}
      className="border border-border bg-card p-3 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden
          className="inline-block size-2.5"
          style={{ background: color }}
        />
        <span className="font-medium">{author}</span>
        <span className="text-muted-foreground">{time}</span>
        {replies > 0 && (
          <span className="ml-auto bg-muted px-1.5 text-[10px] text-muted-foreground">
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
        style={{ fontFamily: SERIF, clipPath: NOTCH }}
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[var(--indigo)] text-sm text-white"
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
          "inline-block size-2 " +
          (named ? "bg-[var(--indigo)]" : "bg-muted-foreground/40")
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
    <div className="border-l-2 border-[var(--indigo)] pl-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
