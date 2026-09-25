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

## Round 1 — Homepage (2026-09-24) — closed

**Outcome (2026-09-25):** Product v2 is now the root homepage (`src/routes/Home.tsx`) and Developer v2 is `/developers` (`src/routes/Developers.tsx`). The exploration files were promoted rather than copied, so the routes below no longer exist; the index at `/design` links to the live pages instead.

| Option | Persona | Direction |
|---|---|---|
| `/design/home/developer` | **Developer.** Creates, edits and maintains Markdown docs (READMEs, RFCs, ADRs, runbooks). Wants a tool, not a platform; distrusts anything that hides the file. | README-shaped single column, monospace display type, dotted rules, live raw-vs-rendered hero, keyboard table, curl snippets. Amber accent. |
| `/design/home/developer-v2` | **Developer, v2.** Same persona and structure as Developer. | Shares the Product v2 DNA so the two pages read as one site: aizome indigo accent, stencil-cell wordmark, notched buttons, registration marks and a faint komon field on the split-pane demo, seigaiha cut-edge strips. No other pattern grounds. Cross-links "for teams" to Product v2. Replaced the original Product option (Sept 25). |
| `/design/home/katagami` | **Product / Business user, katagami iteration.** Same persona, sections and copy as Product. | Re-materialised with the craft the product is named after: asanoha, komon and seigaiha stencil tiles as section grounds, notched "cut paper" cards with registration marks, seigaiha cut-edge strips between sections, aizome indigo as the single accent. Replaced the Enterprise option after review (Sept 25). |

Review, 2026-09-25: Enterprise dropped and replaced by the katagami iteration of Product (Product v2). Later the same day the original Product page was retired in favour of Developer v2, so the live set is Developer, Developer v2, Product v2.

Mobbin references consulted: Cursor and Height (code-editor hero), Figma, Coda and Vercel (annotated document hero with cursors and comments), Vanta, Notion and Mural (enterprise hero, logo strip, demo CTA), GitHub, Dovetail and TheyDo (three-tier pricing).

Katagami-iteration references: Figma Shortcut (punched-dot card fields, essentially komon), Sketch (hairline hexagon lattice, a kikkō), Dropbox (two-tone riso block with numbered rail), Linear (fine-line geometric ornament under a serif headline).
