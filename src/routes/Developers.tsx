import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCreateDoc } from "~/hooks/useCreateDoc";

/**
 * /developers — the developer door. Linked from the README, install
 * snippets and anywhere engineers arrive from; the root homepage is aimed
 * at product and business people. Chosen from the Round 1 design
 * exploration ("Developer v2").
 *
 * README-shaped column, monospace display type, a hero that types raw
 * Markdown on the left while the right pane renders it. Shares the
 * homepage's DNA so the two read as one site:
 *
 * - aizome indigo is the single accent (was amber)
 * - the stencil-cell wordmark glyph
 * - notched "cut paper" buttons
 * - registration marks on the split-pane demo, and a faint komon dot field
 *   behind it, the only pattern ground on the page
 * - seigaiha cut-edge strips in place of dashed rules
 *
 * Everything else stays quiet. A developer page carries the brand in its
 * details, not in its backgrounds.
 */

const SOURCE = `# Rate limiter RFC

**Status:** draft · **Owner:** @mira

## Problem

Bursty clients exhaust the shared quota
before steady clients get a turn.

## Proposal

- [x] Token bucket per API key
- [ ] Sliding window fallback
- [ ] Emit \`quota.exhausted\` event`;

const MONO =
  "ui-monospace, SFMono-Regular, Menlo, 'JetBrains Mono', Consolas, monospace";

const INDIGO = "#274b8f";

function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Komon: offset grid of tiny punched dots. */
const KOMON = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<g fill='currentColor'><circle cx='4' cy='4' r='1.2'/><circle cx='12' cy='12' r='1.2'/></g></svg>`);

/** Seigaiha: overlapping concentric arcs. */
const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);

const NOTCH =
  "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)";

export default function Developers() {
  const { create, loading, error } = useCreateDoc();
  const typed = useTypewriter(SOURCE);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ["--indigo" as string]: INDIGO }}
    >
      {/* Top bar */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2">
          <StencilMark />
          <span style={{ fontFamily: MONO }} className="text-sm font-semibold">
            katagami<span className="text-muted-foreground">.md</span>
          </span>
        </span>
        <nav
          style={{ fontFamily: MONO }}
          className="flex items-center gap-5 text-xs text-muted-foreground"
        >
          <a href="#how" className="hover:text-foreground">
            how it works
          </a>
          <a href="#keys" className="hover:text-foreground">
            shortcuts
          </a>
          <a href="#api" className="hover:text-foreground">
            api
          </a>
          <a
            href="https://github.com/bakadev/katagami"
            className="hover:text-foreground"
          >
            source
          </a>
          <Link
            to="/"
            className="text-[var(--indigo)] hover:underline dark:text-blue-300"
          >
            for teams →
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {/* Hero */}
        <section className="pt-12 pb-16">
          <h1
            style={{ fontFamily: MONO }}
            className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
          >
            Markdown, multiplayer.
            <br />
            <span className="text-muted-foreground">Still just a file.</span>
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg text-muted-foreground">
            Edit READMEs, RFCs and runbooks with your team in real time. The
            source stays visible while you type, and what you download is the
            exact text you wrote.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={create}
              disabled={loading}
              style={{ fontFamily: MONO, clipPath: NOTCH }}
              className="h-10 bg-[var(--indigo)] px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {loading ? "creating…" : "$ new doc"}
            </button>
            <span
              style={{ fontFamily: MONO }}
              className="text-xs text-muted-foreground"
            >
              no account. edit link + view link. that's it.
            </span>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Couldn't create the doc: {error}
            </p>
          )}

          {/* Split pane demo on a faint komon field, with registration marks */}
          <div className="relative mt-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 text-[var(--indigo)] opacity-[0.10] dark:text-blue-300 dark:opacity-[0.16]"
              style={{ backgroundImage: KOMON, backgroundSize: "16px 16px" }}
            />
            <RegMark className="-left-3 -top-3" />
            <RegMark className="-right-3 -top-3" />
            <RegMark className="-bottom-3 -left-3" />
            <RegMark className="-bottom-3 -right-3" />
          <div className="relative overflow-hidden border border-border bg-background">
            <div
              style={{ fontFamily: MONO }}
              className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground"
            >
              <span>rfc-rate-limiter.md</span>
              <span className="flex items-center gap-3">
                <Cursor name="mira" color="var(--indigo)" />
                <Cursor name="tomas" color="#b5452c" />
                <span>2 editing</span>
              </span>
            </div>
            <div className="grid min-h-[300px] sm:grid-cols-2">
              <pre
                style={{ fontFamily: MONO }}
                className="overflow-x-auto whitespace-pre-wrap border-b border-border p-4 text-[13px] leading-6 sm:border-b-0 sm:border-r"
              >
                {typed}
                <span
                  aria-hidden
                  className="inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--indigo)] motion-safe:animate-pulse dark:bg-blue-300"
                />
              </pre>
              <div className="p-4">
                <Rendered source={typed} />
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Three things, as a definition list not cards */}
        <CutEdge />
        <section id="how" className="py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-[var(--indigo)] dark:text-blue-300"
          >
            ## how it works
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            <Item
              term="CRDT sync"
              body="Edits merge without locks or conflicts. Go offline, keep typing, reconnect and it reconciles."
            />
            <Item
              term="Source stays visible"
              body="Syntax characters are dimmed, not hidden. Bold looks bold and the asterisks are still there."
            />
            <Item
              term="Comments anchor to text"
              body="Select a range, leave a thread. Resolve it when the diff lands. Threads live with the doc."
            />
          </dl>
        </section>

        {/* Shortcuts table */}
        <CutEdge />
        <section id="keys" className="py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-[var(--indigo)] dark:text-blue-300"
          >
            ## keyboard
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted-foreground">
            Hands stay on the keys. Every toolbar action has a chord.
          </p>
          <table
            style={{ fontFamily: MONO }}
            className="mt-6 w-full max-w-lg text-[13px]"
          >
            <tbody className="divide-y divide-border">
              {[
                ["⌘ B", "bold"],
                ["⌘ I", "italic"],
                ["⌘ K", "link"],
                ["⌘ ⇧ 1 / 2 / 3", "heading level"],
                ["⌘ ⇧ S", "save named snapshot"],
                ["⌘ ⏎", "post comment"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 pr-6 text-foreground">
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
                      {k}
                    </kbd>
                  </td>
                  <td className="py-2 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* API / no lock-in */}
        <CutEdge />
        <section id="api" className="py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-[var(--indigo)] dark:text-blue-300"
          >
            ## no lock-in
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted-foreground">
            Every document is reachable over plain HTTP. Pull the Markdown into
            CI, a static site, or a coding agent's context window.
          </p>
          <pre
            style={{ fontFamily: MONO }}
            className="mt-6 overflow-x-auto rounded-md border border-border bg-muted/40 p-4 text-[13px] leading-6"
          >
            <span className="text-muted-foreground"># create a project + first doc</span>
            {"\n"}curl -X POST https://katagami.app/api/projects
            {"\n\n"}
            <span className="text-muted-foreground"># fetch the raw markdown with the view key</span>
            {"\n"}curl "https://katagami.app/api/docs/$DOC?key=$VIEW" \
            {"\n"}  -H "accept: text/markdown" &gt; spec.md
          </pre>
          <ul
            style={{ fontFamily: MONO }}
            className="mt-6 grid gap-2 text-[13px] text-muted-foreground sm:grid-cols-2"
          >
            <li><Tick /> .md export is byte-for-byte your text</li>
            <li><Tick /> plain HTTP API, no SDK required</li>
            <li><Tick /> 20 auto-snapshots, named ones forever</li>
            <li><Tick /> free for you and one other editor</li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <CutEdge />
        <section className="py-14">
          <p
            style={{ fontFamily: MONO }}
            className="text-2xl font-semibold tracking-tight"
          >
            Open a doc. Send the link. Ship the RFC.
          </p>
          <button
            type="button"
            onClick={create}
            disabled={loading}
            style={{ fontFamily: MONO, clipPath: NOTCH }}
            className="mt-6 h-10 bg-[var(--indigo)] px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            $ new doc
          </button>
        </section>
      </main>

      <footer
        style={{ fontFamily: MONO }}
        className="mx-auto max-w-4xl px-6 py-8 text-[11px] text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <StencilMark small />
          katagami · 型紙 · built with tiptap, yjs, fastify, postgres
        </span>
      </footer>
    </div>
  );
}

function Item({ term, body }: { term: string; body: string }) {
  return (
    <div>
      <dt style={{ fontFamily: MONO }} className="text-sm font-semibold">
        {term}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </dd>
    </div>
  );
}

/** Thin seigaiha strip standing in for a section rule. */
function CutEdge() {
  return (
    <div
      aria-hidden
      className="h-2.5 w-full text-[var(--indigo)] opacity-25 dark:text-blue-300"
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
      className={(small ? "size-3.5" : "size-4") + " text-[var(--indigo)] dark:text-blue-300"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M12 1.5 L21 6.75 L21 17.25 L12 22.5 L3 17.25 L3 6.75 Z" />
      <path d="M12 1.5v21M3 6.75l18 10.5M21 6.75L3 17.25" />
    </svg>
  );
}

function Tick() {
  return (
    <span aria-hidden className="mr-1 text-[var(--indigo)] dark:text-blue-300">
      ✓
    </span>
  );
}

function Cursor({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden
        className="inline-block size-2 rounded-sm"
        style={{ background: color }}
      />
      {name}
    </span>
  );
}

/** Tiny line-based Markdown renderer for the demo. Not the real pipeline. */
function Rendered({ source }: { source: string }) {
  const lines = source.split("\n");
  return (
    <div className="space-y-2 text-sm leading-6">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return (
            <h3 key={i} className="text-xl font-semibold tracking-tight">
              {line.slice(2)}
            </h3>
          );
        if (line.startsWith("## "))
          return (
            <h4 key={i} className="pt-2 font-semibold">
              {line.slice(3)}
            </h4>
          );
        if (line.startsWith("- [x] ") || line.startsWith("- [ ] "))
          return (
            <label key={i} className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                readOnly
                checked={line.startsWith("- [x]")}
                className="size-3.5 accent-[var(--indigo)]"
              />
              <Inline text={line.slice(6)} />
            </label>
          );
        if (line.trim() === "") return null;
        return (
          <p key={i} className="text-muted-foreground">
            <Inline text={line} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={i} className="text-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code
              key={i}
              style={{ fontFamily: MONO }}
              className="rounded bg-muted px-1 text-[12px] text-foreground"
            >
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function useTypewriter(full: string) {
  const [n, setN] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? full.length
      : 0,
  );
  useEffect(() => {
    if (n >= full.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), 18);
    return () => window.clearTimeout(id);
  }, [n, full.length]);
  return full.slice(0, n);
}
