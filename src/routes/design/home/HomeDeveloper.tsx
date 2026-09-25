import { useEffect, useState } from "react";
import { ExplorationBar, useCreateDoc } from "../DesignIndex";

/**
 * Homepage option A — Developer.
 *
 * Persona: an engineer who writes and maintains Markdown (READMEs, RFCs,
 * ADRs, runbooks) and distrusts anything that hides the file. The page is
 * shaped like a README: one left-aligned column, monospace display type,
 * dotted rules instead of cards. The single motion moment is the hero, which
 * types raw Markdown on the left while the right pane renders it.
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

export default function HomeDeveloper() {
  const { create, loading, error } = useCreateDoc();
  const typed = useTypewriter(SOURCE);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ ["--amber" as string]: "#d98d1f" }}
    >
      <ExplorationBar round="home" current="developer" />

      {/* Top bar */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <span style={{ fontFamily: MONO }} className="text-sm font-semibold">
          katagami<span className="text-muted-foreground">.md</span>
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
              style={{ fontFamily: MONO }}
              className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
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

          {/* Split pane demo */}
          <div className="mt-12 overflow-hidden rounded-lg border border-border">
            <div
              style={{ fontFamily: MONO }}
              className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground"
            >
              <span>rfc-rate-limiter.md</span>
              <span className="flex items-center gap-3">
                <Cursor name="mira" color="var(--amber)" />
                <Cursor name="tomas" color="#5b8def" />
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
                  className="inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--amber)] motion-safe:animate-pulse"
                />
              </pre>
              <div className="p-4">
                <Rendered source={typed} />
              </div>
            </div>
          </div>
        </section>

        {/* Three things, as a definition list not cards */}
        <section id="how" className="border-t border-dashed border-border py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-muted-foreground"
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
        <section id="keys" className="border-t border-dashed border-border py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-muted-foreground"
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
        <section id="api" className="border-t border-dashed border-border py-14">
          <h2
            style={{ fontFamily: MONO }}
            className="text-xs text-muted-foreground"
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
            {"\n\n"}
            <span className="text-muted-foreground"># or self-host it</span>
            {"\n"}docker compose up -d &amp;&amp; pnpm start
          </pre>
          <ul
            style={{ fontFamily: MONO }}
            className="mt-6 grid gap-2 text-[13px] text-muted-foreground sm:grid-cols-2"
          >
            <li>✓ MIT-licensed, single Node process</li>
            <li>✓ Postgres is the only dependency</li>
            <li>✓ .md export is byte-for-byte your text</li>
            <li>✓ 20 auto-snapshots, named ones forever</li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-dashed border-border py-14">
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
            style={{ fontFamily: MONO }}
            className="mt-6 h-10 rounded-md border border-foreground px-4 text-sm font-medium hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            $ new doc
          </button>
        </section>
      </main>

      <footer
        style={{ fontFamily: MONO }}
        className="mx-auto max-w-4xl px-6 py-8 text-[11px] text-muted-foreground"
      >
        katagami · 型紙 · built with tiptap, yjs, fastify, postgres
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
                className="size-3.5 accent-[var(--amber)]"
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
