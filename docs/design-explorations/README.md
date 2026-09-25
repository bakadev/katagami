# Design explorations

An area of the app (`/design`) for comparing redesign options before committing to one. The routes are public so external reviewers can open them, but nothing in the app links to them.

## How a round works

1. Pick one surface of the app (homepage, document header, right panel, empty state, etc.).
2. Define **three personas or use cases** that would want genuinely different things from that surface. Personas are chosen to force divergence, not to be realistic market segments.
3. Research each direction on Mobbin (`search_sections` / `search_screens` / `search_flows`) before designing.
4. Build one page per persona under `src/routes/design/<round>/`. These are throwaway: one file each, inline Tailwind, hardcoded content, no shared components beyond the `ExplorationBar` and `useCreateDoc` helpers in `DesignIndex.tsx`.
5. Register the routes in `App.tsx`.
6. Add the round to `ROUNDS` in `DesignIndex.tsx`.

Pages use the existing theme tokens (`bg-background`, `text-muted-foreground`, etc.) so light and dark both work. Each page may add its own accent colors as CSS variables on its root element.

## Round 1 — Homepage (2026-09-24)

| Option | Persona | Direction |
|---|---|---|
| `/design/home/developer` | **Developer.** Creates, edits and maintains Markdown docs (READMEs, RFCs, ADRs, runbooks). Wants a tool, not a platform; distrusts anything that hides the file. | README-shaped single column, monospace display type, dotted rules, live raw-vs-rendered hero, keyboard table, curl snippets. Amber accent. |
| `/design/home/product` | **PO / PM / Business user.** Has to get a mixed team (product, design, content, engineering) to agree on a spec that engineering or an AI agent will build from. Lives in Google Docs and Slack today. | Editorial serif headline, wide margins, spec excerpt with named cursors and open comment threads, numbered draft-to-agreed process, version history as sign-off, handoff section. Sage accent, yellow anchor highlight. |
| `/design/home/enterprise` | **Enterprise buyer.** IT, ops or platform lead choosing one documentation tool for many teams. Needs proof of adoption, security, hosting options and pricing above the fold. | Centered layout, tight Geist headings, logo strip, stats row, security control grid, department use cases, deployment options, three-tier pricing, demo request form. Navy accent. |

Mobbin references consulted: Cursor and Height (code-editor hero), Figma, Coda and Vercel (annotated document hero with cursors and comments), Vanta, Notion and Mural (enterprise hero, logo strip, demo CTA), GitHub, Dovetail and TheyDo (three-tier pricing).
