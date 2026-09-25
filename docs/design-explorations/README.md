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

## Round 2 — Pricing (2026-09-25) — closed

**Outcome (2026-09-25):** option D, the composite, is now `/pricing` (`src/routes/Pricing.tsx`). A, B and C were deleted; the routes below no longer exist.

Content is fixed by `two-tier-proposal.md` section 5: Free / Team / Enterprise, Team at $39 a month with 5 seats and $8 per extra seat, Enterprise as an unlinked "Contact us". Style is locked to Product v2, so the three options differ in **layout and emphasis** only. All three share the Product v2 header (stencil wordmark, links to `/` and `/developers`, real "Start a spec" CTA via `useCreateDoc`).

| Option | Layout | Direction |
|---|---|---|
| `/design/pricing/a` | **A. Three stencil sheets.** | Classic three-column cards. Team is lifted 24px, bordered in indigo, given an indigo "Recommended" head and registration marks; Free and Enterprise sit lower on plain borders. Feature lists under each, "Everything in Free, plus" for the upper tiers. Three one-line clarifications on a komon band, then a two-column FAQ. Fastest to scan; the least information per screen. |
| `/design/pricing/b` | **B. Comparison table.** | Hero states the two real prices as two notched cards. Then one long table: rows are features grouped into Documents, People, Sharing, History, Export and support; groups are separated by inline seigaiha cut-edge rules instead of heavy headers. The Team column sits on a soft indigo band, the column heads (with a CTA each) stay pinned under the exploration bar, and CTAs repeat at the foot of the table. FAQ on komon. Best for a reader who wants every limit before deciding. |
| `/design/pricing/c` | **C. Start free, grow.** | A narrative in four bands: (1) "Start with one doc, no account" with what Free includes on a stencil sheet; (2) a seat calculator on komon, slider plus +/- steppers, live monthly total from $39 + $8 × extra seats, with a per-editor figure above 5 seats and a nudge back to Free at 1 or 2; (3) six numbered things Team adds over Free, each with the Free limit beneath; (4) Enterprise as a quiet seigaiha indigo band with the unlinked button. No FAQ. Best for a reader asking "what will this cost my team". |
| `/design/pricing/d` | **D. Composite** (added 2026-09-25 after review). | A's hero and three stencil sheets, C's seat calculator on komon and its "What Team adds" list, A's FAQ layout with B's short answers, C's Enterprise indigo band as the close. Grounds alternate asanoha, komon, plain, plain, indigo. |

Mobbin references consulted:

- Three tiers with highlighted middle: [Dovetail](https://mobbin.com/sites/sections/53746604-f99e-44bf-ac03-c8813dee7883) (Free / Professional / Enterprise, "Start free" twice and "Contact sales"), [Claude](https://mobbin.com/sites/sections/2a178ff0-87fe-469a-9537-cc349c817aeb) (serif display, "Everything in Free, plus"), [Webflow](https://mobbin.com/sites/sections/86a4762c-79ce-4fe5-8aa7-8bdbba561302) (middle card raised with a top bar and fixed-row limits).
- Comparison table: [Notion](https://mobbin.com/sites/sections/2e43d18a-cf5a-4e00-869a-7dd96014a4af) (row groups with their own headers), [ReadMe](https://mobbin.com/sites/sections/323667a4-3303-4bb1-a6da-81d2195b95bc) (column heads carry a CTA each), [Linear](https://mobbin.com/sites/sections/d9652689-5b02-4754-b585-6f491369f99b) (highlighted middle column band running the full table).
- Seat calculator: [Coda](https://mobbin.com/sites/sections/2377e733-dfbb-4506-8422-47afd49c203f) (team size vs doc makers, "never pay for collaborators"), [GitBook](https://mobbin.com/sites/sections/8545954a-6e11-46c1-bbb1-d3f5f5487618) (plan plus users, total per month as a receipt), [Teak](https://mobbin.com/sites/sections/58c2e515-2f0f-4696-8cc2-d9d0ad4993c7) (single slider, big total beside it).
- FAQ: [Harvest](https://mobbin.com/sites/sections/0c073171-fb09-4b13-b140-937acb761f2c) (heading left, questions right), [Zaro](https://mobbin.com/sites/sections/faffeda3-f5a4-4bf9-8fb3-b404473b5c63) (seat question answered first).

## Round 3 — Contact (2026-09-25) — closed

**Outcome (2026-09-25):** option B is now `/contact` (`src/routes/Contact.tsx`). Unlike earlier rounds, A, B and C are kept under `/design/contact/*` for reference.

The page the two "Contact us" buttons on `/pricing` point at. Style is locked (Product v2); the exploration is about how much to ask and in what order. Forms don't post anywhere yet; submit shows a "sent" state.

| Option | Layout | Direction |
|---|---|---|
| `/design/contact/a` | **A. One form, one promise.** | Form on a stencil sheet; beside it a numbered account of what happens after send (a person reads it within a business day, a named reply, a 30-minute walkthrough for Enterprise) and a plain email fallback. |
| `/design/contact/b` | **B. Pick a path.** | Three notched doors (Enterprise and pricing, help with a document, press and partnerships). The chosen door reshapes the form on a komon band so it only asks what that conversation needs. |
| `/design/contact/c` | **C. A conversation.** | Four questions one at a time on a single sheet, cut-edge progress along the top, seat stepper and slider for team size, and a live sentence on the left restating the answers, including what the team size means on Team pricing. |

Mobbin references consulted: ToDesktop and Reducto (split form with a "here to help" column), Grammarly and Charma (choose a reason before the form), Dovetail (route-by-reason select with response time up front), Sana AI "Book an intro" flow (stepped request with team size).

## Round 4 — Audience top bar (2026-09-25) — closed

**Outcome (2026-09-25):** option D is the site-wide utility bar (`src/components/site/UtilityBar.tsx`), rendered above every marketing page. With the audience switch there, the teams-side pages share one header (`SiteHeader`: wordmark, Pricing, Contact, Start a spec) and the developer page drops its "for teams" link. All four variants stay under `/design/topbar/*`.

A strip above the site header that switches between the teams pages and `/developers`, so the "For developers" / "for teams" cross-links can leave the main nav. Each option is shown on the real homepage and developer page with the nav cross-link hidden (`audienceLink={false}`).

| Option | Layout | Direction |
|---|---|---|
| `/design/topbar/a` | **A. Utility bar.** | Solid indigo, white text. Notched two-way audience switch on the left; on the right a live status dot, a one-line pilot note, and a "Log in · soon" slot that becomes real when accounts ship. |
| `/design/topbar/b` | **B. Announcement bar.** | Indigo with a faint seigaiha ground. Plain audience links with the current one underlined, one dismissible message ("every plan is free while billing is built") linking to pricing. |
| `/design/topbar/c` | **C. Hairline bar.** | No fill: a bordered 32px strip on the page background with 11px text. "Katagami for Teams · Developers", operational status, log in, a theme toggle and the 型紙 mark. |
| `/design/topbar/d` | **D. Hairline v2** (added after review). | C's content and 32px height on B's indigo seigaiha ground, white text, current audience underlined. |

Append `/developers` to any option's URL to see the same bar on the developer page.

Mobbin references consulted: Klarna (tiny "For shoppers / For business" links above the header), Grammarly and Equals (solid announcement bars), Stripe (quiet secondary bar under the nav), mymind (single-row pill nav with status dots).

## Round 5 — Editor header (2026-09-25) — closed

**Outcome (2026-09-25):** option A shipped as the default header in `DocHeader`. The `chrome` param, the switcher strip and the entry route were removed; B and C survive only in git history.

Should the editor's header take the utility bar's indigo? There is no mock: each option opens a real document with the header drawn in that tone via a `chrome` search param, and a strip on the document flips between tones on the same doc. Tones live in `DocHeader` (`tone` prop) and the on-indigo token scheme in `styles.css` (`.on-indigo`).

| Option | Layout | Direction |
|---|---|---|
| `/design/editor-header/a` | **A. Indigo with pattern.** | The whole document header on indigo with the faint seigaiha; title, meta and controls in white via scoped token overrides. |
| `/design/editor-header/b` | **B. Indigo plain.** | Same header, solid indigo, no pattern. |
| `/design/editor-header/c` | **C. Rail.** | The site's 32px utility bar carried into the app above the current dark header: home link, live connection state, log-in slot, the mark. The document header itself stays quiet. |
