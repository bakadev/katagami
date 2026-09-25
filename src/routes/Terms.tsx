import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * Terms of use.
 *
 * A long-form reading page in the Product v2 visual system (serif display,
 * aizome indigo, stencil tiles, notched corners, cut edges). Sticky table of
 * contents on the left, text at a comfortable measure on the right. Each
 * section opens with a one-line "In short" box, then the full text.
 *
 * Helpers are copied from src/routes/Pricing.tsx, not shared; the page is
 * self-contained on purpose.
 *
 * The text describes what the product does today, per docs/mvp-spec.md
 * sections 6 to 8 and docs/design-explorations/two-tier-proposal.md
 * section 5. It is a working draft and has not been reviewed by a lawyer.
 */

const SERIF =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

const INDIGO = "#274b8f";

// Placeholder contact address. Replace with the real inbox before launch.
const CONTACT = "hello@katagami.app";

const LAST_UPDATED = "2026-09-25";

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

const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

/* ---- content ------------------------------------------------------------ */

type Section = {
  id: string;
  title: string;
  short: string;
  body: ReactNode;
};

/** Sections in reading order, grouped. A cut edge separates the groups. */
const GROUPS: Section[][] = [
  [
    {
      id: "the-service",
      title: "The service",
      short:
        "Katagami is a collaborative Markdown editor. Using it means you agree to these terms.",
      body: (
        <>
          <p>
            Katagami is a browser-based editor for writing specification
            documents together. It lets a group of people edit the same
            Markdown document at the same time, comment on it, look back
            through its history, and export it.
          </p>
          <p>
            By opening a document or creating one, you agree to these terms
            and to the{" "}
            <Link
              to="/privacy"
              className="text-[var(--indigo)] underline underline-offset-2 dark:text-blue-300"
            >
              privacy policy
            </Link>
            . If you do not agree, do not use the service.
          </p>
          <p>
            Today Katagami has one plan, Free, which needs no account. A Team
            plan with accounts and billing, and an Enterprise plan with a
            separate agreement, are planned but not live. Where these terms
            mention them, they describe what is intended, and they will be
            revised before either goes live.
          </p>
        </>
      ),
    },
    {
      id: "your-content",
      title: "Your content and your rights to it",
      short:
        "What you write is yours. Katagami only stores it and serves it to the people you share it with.",
      body: (
        <>
          <p>
            You keep every right you have in the documents, comments and
            other content you put into Katagami. Nothing here transfers
            ownership to Katagami.
          </p>
          <p>
            To run the service, Katagami needs permission to store your
            content, make copies of it in snapshots and backups, send it to
            the browsers of people who hold a share link, and convert it into
            an export when asked. You grant that permission for as long as
            the content is in the service. It is used for nothing else.
          </p>
          <p>
            You are responsible for what you put in a document. You confirm
            that you have the right to use and share it, and that it does not
            break the law or these terms.
          </p>
          <p>
            You can take your content out at any time as a Markdown file. See{" "}
            <a
              href="#termination"
              className="text-[var(--indigo)] underline underline-offset-2 dark:text-blue-300"
            >
              termination and deletion
            </a>{" "}
            for how to remove it.
          </p>
        </>
      ),
    },
    {
      id: "share-links",
      title: "Share links and responsibility for them",
      short:
        "The link is the only key to a document. Anyone you give it to can pass it on. Guard it accordingly.",
      body: (
        <>
          <p>
            Documents are reached by share links. Each document has an edit
            link and a view link, and each link contains a token that the
            server checks. There is no login. Holding the link is holding the
            permission, and there is no way for Katagami to tell one holder
            from another.
          </p>
          <p>
            That puts the decision about who sees a document in your hands.
            Before you send a link, decide whether the people you send it to
            should be able to forward it, because they will be able to. Send
            the view link when someone only needs to read. Do not post an
            edit link anywhere public.
          </p>
          <p>
            Katagami is not responsible for who a link reaches after you have
            shared it, or for what someone who holds an edit link does to the
            document. If a link has gone somewhere it should not, the browser
            that created the document can rotate its links, after which the
            old ones stop working.
          </p>
          <p>
            If you did not create a document, do not try to gain more access
            to it than the link you were given allows.
          </p>
        </>
      ),
    },
  ],
  [
    {
      id: "acceptable-use",
      title: "Acceptable use",
      short:
        "Use it for writing and working together. Do not use it to harm people or the service.",
      body: (
        <>
          <p>Do not use Katagami to:</p>
          <ul>
            <li>
              store or share content that is illegal, or that you do not
              have the right to share;
            </li>
            <li>
              harass, threaten or deceive people, including by impersonating
              someone in the display name you choose;
            </li>
            <li>
              distribute malware, phishing content, or spam;
            </li>
            <li>
              probe, overload or interfere with the service, its servers, or
              other people's documents, or attempt to guess or forge tokens;
            </li>
            <li>
              scrape or bulk-copy content you do not have a share link for.
            </li>
          </ul>
          <p>
            Katagami may remove content or block access that breaks these
            rules, with or without notice, and will report illegal content to
            the authorities where required.
          </p>
        </>
      ),
    },
    {
      id: "availability",
      title: "Availability",
      short:
        "The service is provided as it is, with no uptime guarantee on Free or Team. Keep exports of anything that matters.",
      body: (
        <>
          <p>
            Katagami runs on a single server and is maintained by a small
            team. It may be unavailable at times, for maintenance, because of
            a fault, or because the host has a problem. There is no service
            level agreement on Free, and there will not be one on Team when
            it launches. An uptime commitment is part of the Enterprise
            agreement only.
          </p>
          <p>
            Reasonable care is taken to keep documents safe, and the host
            takes periodic snapshots of the server. That is not the same as a
            guarantee against loss. If a document matters, export it as
            Markdown and keep the file somewhere you control.
          </p>
          <p>
            Features may be added, changed or removed at any time. Limits on
            Free, such as the number of documents, the number of people
            editing at once and the number of versions kept, may change; the
            current limits are listed on the{" "}
            <Link
              to="/pricing"
              className="text-[var(--indigo)] underline underline-offset-2 dark:text-blue-300"
            >
              pricing page
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      id: "enterprise",
      title: "Enterprise agreements",
      short:
        "If your organisation has a signed agreement with Katagami, that agreement wins wherever the two differ.",
      body: (
        <>
          <p>
            Organisations on an Enterprise plan sign a separate agreement
            that covers things these terms do not, such as uptime, data
            retention, security commitments and support. Where that
            agreement and these terms say different things, the agreement
            applies. Where it is silent, these terms fill the gap.
          </p>
          <p>
            No Enterprise agreements exist yet. Until one does, everyone
            using Katagami is on these terms.
          </p>
        </>
      ),
    },
  ],
  [
    {
      id: "termination",
      title: "Termination and deletion",
      short:
        "Stop any time. Delete from the editor, or ask and it will be deleted for you.",
      body: (
        <>
          <p>
            You can stop using Katagami whenever you like, and there is
            nothing to cancel because there is no account. The browser that
            created a document can delete it from the editor. If you no
            longer have that browser, write to {CONTACT} with the document
            link and it will be deleted by hand.
          </p>
          <p>
            Deletion removes the document, its comments and its snapshots
            from the live database. Copies may persist in server backups for
            a limited time afterwards. Deletion cannot be undone, so export
            first if you might want the content back.
          </p>
          <p>
            Katagami may suspend or remove a document, or block access to the
            service, if these terms are broken or if the law requires it.
            Where practical, you will be told why.
          </p>
        </>
      ),
    },
    {
      id: "liability",
      title: "Liability in plain words",
      short:
        "The service is free and offered as it is. Katagami is not liable for loss that comes from using it, beyond what the law says cannot be excluded.",
      body: (
        <>
          <p>
            Katagami is provided as it is and as it is available. No promise
            is made that it will be uninterrupted, error-free, or fit for any
            particular purpose, or that content will never be lost.
          </p>
          <p>
            To the fullest extent the law allows, Katagami is not liable for
            any loss or damage that comes from using the service or from not
            being able to use it, including lost content, lost work, lost
            profit, or a document reaching someone it should not have. Where
            liability cannot be excluded, it is limited to the amount you paid
            for the service in the twelve months before the claim, which on
            Free is nothing.
          </p>
          <p>
            Nothing in these terms takes away rights that the law gives you
            and does not let you give up.
          </p>
        </>
      ),
    },
    {
      id: "governing-law",
      title: "Governing law",
      short: "Placeholder. The jurisdiction has not been chosen yet.",
      body: (
        <>
          <p>
            These terms will be governed by the law of a jurisdiction that
            has not yet been decided, and disputes will be handled in its
            courts. This section will be completed, with legal review, before
            the terms are final.
          </p>
          <p>
            Until then, if there is a disagreement, write to {CONTACT} first.
            Most things can be sorted out that way.
          </p>
        </>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      short:
        "This page is the record. The date at the top changes when the text does.",
      body: (
        <>
          <p>
            These terms will change as the product does, most obviously when
            accounts and billing arrive. The date at the top of the page is
            updated whenever the text is. Material changes will be noted on
            this page, and, once there is a way to reach you, sent to you
            directly. Continuing to use the service after a change means you
            accept the new terms.
          </p>
          <p>
            This is a working draft. It describes the product honestly but
            has not been reviewed by a lawyer, and it may be reorganised
            substantially before launch.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      short: `Write to ${CONTACT} for anything about these terms.`,
      body: (
        <p>
          Questions about these terms, reports of misuse, and deletion
          requests go to{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-[var(--indigo)] underline underline-offset-2 dark:text-blue-300"
          >
            {CONTACT}
          </a>
          . Include the document link if the question is about a specific
          document.
        </p>
      ),
    },
  ],
];

const ALL = GROUPS.flat();
const ALL_IDS = ALL.map((s) => s.id);

/* ---- page --------------------------------------------------------------- */

export default function Terms() {
  const { create, loading, error } = useCreateDoc();
  const active = useActiveSection(ALL_IDS);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        ["--indigo" as string]: INDIGO,
        ["--indigo-soft" as string]: `color-mix(in oklch, ${INDIGO} 10%, transparent)`,
        ["--anchor" as string]: "color-mix(in oklch, #f2c94c 35%, transparent)",
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <StencilMark />
          <span style={{ fontFamily: SERIF }} className="text-xl">
            Katagami
          </span>
        </Link>
        <nav className="flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/" className="hidden hover:text-foreground sm:inline">
            For teams
          </Link>
          <Link
            to="/developers"
            className="hidden hover:text-foreground sm:inline"
          >
            For developers
          </Link>
          <Link to="/pricing" className="hidden hover:text-foreground sm:inline">
            Pricing
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

      <main>
        {/* Title on a fading asanoha ground */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[360px] text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.22]"
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
              className="max-w-[20ch] text-5xl leading-[1.05] tracking-[-0.01em] sm:text-6xl"
            >
              Terms of use
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              What you write is yours, the link is the only key to it, and
              the service is offered as it is while it is free.
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <dt>Last updated</dt>
                <dd className="text-foreground tabular-nums">{LAST_UPDATED}</dd>
              </div>
              <div className="flex gap-2">
                <dt>Status</dt>
                <dd className="text-foreground">
                  Working draft, not yet reviewed by a lawyer
                </dd>
              </div>
            </dl>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                Couldn't create the doc: {error}
              </p>
            )}
          </div>
        </section>

        {/* Body: sticky contents on the left, text on the right */}
        <div className="mx-auto max-w-6xl px-6 pb-20 md:grid md:grid-cols-[13rem_1fr] md:gap-16 md:px-10 lg:grid-cols-[15rem_1fr]">
          <aside className="mb-10 md:mb-0">
            <nav
              aria-label="Contents"
              className="md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contents
              </p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {ALL.map((s, i) => {
                  const current = active === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={current ? "location" : undefined}
                        className={
                          "flex gap-2.5 border-l-2 py-0.5 pl-3 transition-none " +
                          (current
                            ? "border-[var(--indigo)] text-foreground dark:border-blue-300"
                            : "border-transparent text-muted-foreground hover:text-foreground")
                        }
                      >
                        <span
                          style={{ fontFamily: SERIF }}
                          className="w-5 shrink-0 tabular-nums text-muted-foreground/70"
                        >
                          {i + 1}
                        </span>
                        <span>{s.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            {GROUPS.map((group, gi) => (
              <div key={gi}>
                {gi > 0 && (
                  <div className="my-14">
                    <CutEdge />
                  </div>
                )}
                {group.map((s) => (
                  <Article key={s.id} section={s} index={ALL.indexOf(s) + 1} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground md:px-10">
        <span className="flex items-center gap-2">
          <StencilMark small />
          <span style={{ fontFamily: SERIF }}>Katagami</span>
        </span>
        <span>型紙 — a stencil the whole team fills in</span>
      </footer>
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Article({ section, index }: { section: Section; index: number }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="scroll-mt-10 max-w-[65ch] [&+&]:mt-14"
    >
      <h2
        id={`${section.id}-title`}
        style={{ fontFamily: SERIF }}
        className="flex items-baseline gap-3 text-2xl leading-tight sm:text-3xl"
      >
        <span className="text-base tabular-nums text-muted-foreground/70">
          {index}
        </span>
        {section.title}
      </h2>

      <div className="relative mt-5">
        <RegMark className="-left-2 -top-2" />
        <RegMark className="-bottom-2 -right-2" />
        <p
          style={{ clipPath: NOTCH }}
          className="bg-[var(--indigo-soft)] px-5 py-4 text-sm leading-relaxed"
        >
          <span className="font-medium text-[var(--indigo)] dark:text-blue-300">
            In short:
          </span>{" "}
          {section.short}
        </p>
      </div>

      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90 [&_li]:mt-2 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
        {section.body}
      </div>
    </section>
  );
}

/** Track which section is nearest the top of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    function update() {
      const line = window.innerHeight * 0.25;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      // At the very bottom, mark the last section so the list can finish.
      const bottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      setActive(bottom ? els[els.length - 1].id : current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

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
