import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { usePageMeta } from "~/hooks/usePageMeta";
import { SiteFooter } from "~/components/site/SiteFooter";
import { SiteHeader } from "~/components/site/SiteHeader";

/**
 * Privacy policy.
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
      id: "what-we-collect",
      title: "What we collect",
      short:
        "The documents you write, a display name you choose, and the technical minimum needed to serve the page.",
      body: (
        <>
          <p>
            Katagami has no accounts today, so there is nothing to sign up
            with and no profile to fill in. What it holds is small and
            specific.
          </p>
          <ul>
            <li>
              <strong>Document content.</strong> The text of every document
              you create or edit, including comments and their replies, is
              stored so that it can be shared and synced between the people
              in it.
            </li>
            <li>
              <strong>A display name.</strong> The first time you open a
              document you are asked for a name. It appears on your cursor
              and on comments you leave. It is stored in your browser, and it
              is written into the document alongside the comments you make
              and into snapshots taken while you are active.
            </li>
            <li>
              <strong>Tokens.</strong> Each document has an edit token and a
              view token that live in its share links. The browser that
              created a document also keeps a creator token, which lets that
              browser rename, delete or rotate the links for it.
            </li>
            <li>
              <strong>Timestamps.</strong> When a document was created,
              last changed, and when each snapshot was taken.
            </li>
            <li>
              <strong>Connection data.</strong> To deliver the page and keep a
              live editing session open, the server necessarily sees your IP
              address and the request it is answering. Standard web server
              logs may record this for a short time for operations and
              debugging. They are not used to build a profile of you.
            </li>
          </ul>
          <p>
            If a contact form is added, it will collect whatever you type into
            it, including an email address if you give one, for the sole
            purpose of replying.
          </p>
        </>
      ),
    },
    {
      id: "what-we-dont",
      title: "What we don't collect",
      short:
        "No accounts, no email, no analytics, no advertising trackers, no third-party scripts.",
      body: (
        <>
          <p>
            There is no sign-up, so no email address, password, phone number
            or payment card is collected. Billing is not live; when it
            arrives, this policy will be updated before anything is charged.
          </p>
          <p>
            The site runs no analytics and no advertising or social trackers.
            There are no third-party scripts on the page, and the fonts used
            are the ones already on your device.
          </p>
          <p>
            Katagami does not read your documents for any purpose other than
            storing and serving them, and does not use them to train anything.
          </p>
        </>
      ),
    },
    {
      id: "where-its-stored",
      title: "Where it is stored",
      short:
        "On a single server in the United States (Hostinger, Boston), in a Postgres database.",
      body: (
        <>
          <p>
            Documents, snapshots, tokens and timestamps are stored in a
            PostgreSQL database on a virtual private server rented from
            Hostinger and located in Boston, Massachusetts, United States. If
            you are outside the United States, your content is transferred
            there when you use the service.
          </p>
          <p>
            The connection between your browser and the server is encrypted
            with TLS. Data at rest is protected by the access controls on the
            server. The host takes periodic snapshots of the whole server for
            disaster recovery, which means a copy of the database may exist in
            those backups for a while after something is deleted.
          </p>
        </>
      ),
    },
  ],
  [
    {
      id: "who-can-see",
      title: "Who can see a document",
      short:
        "Anyone who has the link. There is no login, so the link is the key.",
      body: (
        <>
          <p>
            Every document has two share links: an edit link and a view link.
            Each contains a long random token. The server checks the token on
            every load and every live connection, and that is the entire
            permission system. There is no account to log into and no list of
            allowed people.
          </p>
          <p>
            This is what that means in practice. Anyone who has a link can
            open the document, regardless of who they are or how they got it.
            If a link is forwarded, posted, or ends up in a chat history, the
            people who see it there can open the document too. A view link
            allows reading and seeing version history; an edit link also
            allows editing, commenting and restoring versions.
          </p>
          <p>
            The tokens are unguessable in any practical sense, and documents
            are not listed anywhere public, so a document is only reachable by
            someone who has been given its link. If a link has gone somewhere
            it should not, the browser that created the document can rotate
            the links, which makes the old ones stop working.
          </p>
          <p>
            Katagami staff do not open documents in the ordinary course of
            running the service. Someone with administrative access to the
            server could technically read the database; that access is used
            only to operate the service, respond to a request you make, or
            deal with abuse.
          </p>
        </>
      ),
    },
    {
      id: "snapshots",
      title: "Snapshots and retention",
      short:
        "Documents keep a short version history. Nothing is deleted automatically except old snapshots.",
      body: (
        <>
          <p>
            While a document is being edited, the server periodically takes a
            snapshot of its state so that earlier versions can be viewed and
            restored. Each snapshot records the time and the display name of
            whoever was active when it was taken. On Free, the most recent 20
            automatic snapshots are kept and older ones are discarded as new
            ones are taken. Named versions are kept until the document is
            deleted.
          </p>
          <p>
            Beyond that, content is kept for as long as the document exists.
            There is no automatic expiry for documents that go quiet. When a
            document is deleted, its content and snapshots are removed from
            the live database; copies may persist in server backups for a
            limited time afterwards.
          </p>
        </>
      ),
    },
    {
      id: "export-and-deletion",
      title: "Export and deletion",
      short:
        "Download your document as Markdown at any time. Ask and it will be deleted.",
      body: (
        <>
          <p>
            Any document can be exported as a Markdown file from inside the
            editor, at any time and on every plan. Comments travel with the
            export as frontmatter. What you download is the document itself,
            not a rendering of it.
          </p>
          <p>
            The browser that created a document can delete it from the
            editor. If you no longer have that browser, or you want a
            document removed that you did not create but that contains your
            words or your name, write to {CONTACT} with the document link.
            Requests are handled by hand, and deletion is not reversible.
          </p>
          <p>
            To remove your display name from your own browser, clear the
            site's data in your browser settings. Names already written into
            comments and snapshots stay with the document until it is
            deleted.
          </p>
        </>
      ),
    },
  ],
  [
    {
      id: "cookies",
      title: "Cookies and local storage",
      short:
        "No cookies. A few values in your browser's local storage, all of them functional.",
      body: (
        <>
          <p>
            Katagami sets no cookies. It uses your browser's local storage for
            a small number of values that the interface needs to work:
          </p>
          <ul>
            <li>your display name, so you are not asked for it on every visit;</li>
            <li>
              the creator token for each document you created in that browser,
              which is what allows you to manage it;
            </li>
            <li>your light or dark theme choice.</li>
          </ul>
          <p>
            None of these are sent anywhere except the creator token, which
            goes to the Katagami server when you perform a management action
            such as deleting a document. Clearing the site's data removes all
            of them. Documents and their share links keep working afterwards;
            you would only lose the ability to manage documents you created
            from that browser.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      short: "The service is not directed at children under 13.",
      body: (
        <p>
          Katagami is a tool for work and is not directed at children. It does
          not knowingly collect information from anyone under 13. Because
          there are no accounts, age is not verified. If you believe a child
          has put personal information into a document, write to {CONTACT}{" "}
          with the link and it will be removed.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      short:
        "This page is the record. The date at the top changes when the text does.",
      body: (
        <>
          <p>
            This policy will change as the product does, most obviously when
            accounts and billing arrive. The date at the top of the page is
            updated whenever the text is. Material changes will be noted on
            this page, and, once there is a way to reach you, sent to you
            directly.
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
      short: `Write to ${CONTACT} for anything to do with your data.`,
      body: (
        <p>
          Questions, export help, deletion requests and anything else about
          how Katagami handles your information go to{" "}
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

export default function Privacy() {
  usePageMeta({
    title: "Privacy",
    description:
      "What Katagami collects, what it does not, where documents are stored, and who can see them.",
  });
  const { error } = useCreateDoc();
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
      <SiteHeader />

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
              Privacy
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              Katagami keeps the documents you write and a name you choose,
              on one server in the United States, and nothing else about you.
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

      <SiteFooter />
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

