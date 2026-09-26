# Design explorations

An area of the app (`/design`) for comparing redesign options before committing to one. The routes are public so external reviewers can open them, but nothing in the app links to them.

## How a round works

1. Pick one surface of the app (homepage, document header, right panel, empty state, etc.).
2. Define **three personas or use cases** that would want genuinely different things from that surface. Personas are chosen to force divergence, not to be realistic market segments.
3. Research each direction on Mobbin (`search_sections` / `search_screens` / `search_flows`) before designing.
4. Build one page per persona under `src/routes/design/<round>/`. These are throwaway: one file each, inline Tailwind, hardcoded content, no shared components beyond the `ExplorationBar` and `useCreateDoc` helpers in `DesignIndex.tsx` (a round may keep its own `data.ts` and `pieces.tsx` for what every option must show identically).
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

## Round 7 — Signed-in home (/documents) (2026-09-25) — option D specified (closed)

**Outcome (2026-09-26):** Option D shipped as `/documents` and `/documents/:projectId` (`src/routes/Documents.tsx`, `Project.tsx`, `src/components/app/**`), on top of `GET /api/home` and friends. A, B, C and D stay under `/design/documents/*`.

The page a signed-in person lands on: after sign-in, from the wordmark, and as the first item in the avatar menu. Marketing home stays at `/`. It answers "what am I working on" before anything else. Three options under `/design/documents/*`, rendered by `src/routes/design/documents/DocumentsExploration.tsx`, with fake data in `data.ts` (team "Acme", projects "Checkout redesign" ×3 and "Onboarding emails" ×2 plus four single-document projects, four people, edits from 12 minutes to 3 weeks ago) and the pieces every option must show identically in `pieces.tsx` (app header with avatar menu, claim strip, empty state, search, sort, share and overflow). Style is locked to Product v2; the options differ in layout and in how much they say.

Shared by every option: the header row ("Your documents", a notched indigo "New spec"); the claim strip ("3 documents from before you signed in are still on this browser." with "Bring them in" to `/claim`) as an indigo-tinted notched card; rows with title, relative last-edited time, who edited last with their colour dot, a quiet copy-link icon and an overflow with "Move to project" (visual only); search by title; sort by last edited or title; and the empty state on a komon field with the mark: "Nothing cut yet. Start a spec, or bring in the ones on this browser." A "Show empty state" switch in the app header (or `?empty=1`) shows it. At phone width rows keep title and time, editor and share move out of the row, the banner wraps and the header stacks.

| Option | Persona | Direction |
|---|---|---|
| `/design/documents/documents-a` | **A. The solo writer.** A Free user with a handful of specs. | One flat list on a narrow column: serif titles at 20px, hairlines between rows, "Sort by last edited · title" as plain text beside the search field, no team switcher, no status. A faint asanoha at the head of the sheet. The empty state takes the whole page. A footnote says Free keeps every document and that projects and seats come with Team. |
| `/design/documents/documents-b` | **B. The team lead.** Several projects, a dozen documents. | Grouped by project: serif group headers with a chevron to collapse (local state), a document count and, when collapsed, the freshest edit; single-document projects sit flat under "Other documents". Team switcher (Acme / Personal) beside "New spec". Column heads on desktop; a status chip per row (Draft outlined, In review indigo-outlined, Signed off on the tint) as small notched cards; a sort menu; a pencil to rename the project appears on hover of the group name. |
| `/design/documents/documents-c` | **C. The reviewer.** Someone who mostly opens what others share. | Three sections in reading order. "Recently opened" as four notched tiles with a sketch of the first lines, opened-when and last editor. "Waiting on you" on an indigo-bordered sheet with registration marks: a row per document with counts of open comments and suggestions addressed to them on the editor's yellow anchor, and the section title on the same anchor. "Everything else" as a flat list with the sort menu. The heading's subline totals what is waiting. |

Mobbin references consulted:

- A: [Basecamp "Your Drafts"](https://mobbin.com/screens/6185209c-22f0-4a58-99d3-11fdb972da54) (one serif heading, one list, a meta line under each title), [Google Gemini Library](https://mobbin.com/screens/48d98554-c6a5-411e-85cf-79c343f5dd66) (rows that are only a title and a time), [Langdock Library](https://mobbin.com/screens/99a33b62-70f7-4b1e-b370-3cdf35cc94f4) (a count, a search field and a sort control on one line above the list), [Craft "Open"](https://mobbin.com/screens/d370247f-a6ec-4e59-a67e-ddf2aa9aae8c) (search filters by title only).
- B: [Linear issues grouped with collapsible headers and counts](https://mobbin.com/screens/ef923b0e-9a40-4fdd-80f2-f3aafb4f36ce) and [the same with column heads](https://mobbin.com/screens/ea0c3b2c-ecb7-4f3a-8c91-4b96acbec446), [Linear "Move to" submenu](https://mobbin.com/screens/f1e8745b-81b7-4a78-85e1-a325f4843f42) (project picker in the row overflow), [Notion list with status chips](https://mobbin.com/screens/96160820-25ad-459e-a5bd-538e96fd6f04), [Arcade "Switch workspace"](https://mobbin.com/screens/fa26dbf7-16e3-4366-be9f-a5a9cfad1fe5) (team list with a check on the current one and "Create or join"), [Figma "Last viewed" sort menu](https://mobbin.com/screens/fb25258c-2581-4c4c-a59f-da737bb4f8a8).
- C: [Airtable Home](https://mobbin.com/screens/480cc1d5-ec9c-413d-a871-d7ce22565022) (tiles under "Today / Past 7 days" with "Opened 2 minutes ago"), [Craft All Docs](https://mobbin.com/screens/ee17bb00-bceb-4f12-9276-3c684d99e20a) (cards that sketch the first lines, updated time beneath), [Craft Reminders](https://mobbin.com/screens/c80ad028-517d-478e-8a65-dd57d543e3c3) (a short "in progress / overdue" list above everything else), [Figma notifications](https://mobbin.com/screens/fb25258c-2581-4c4c-a59f-da737bb4f8a8) ("Sam commented" as the reason to open a file), [Dropbox Dash](https://mobbin.com/screens/db24613b-901d-4574-9f74-134fdfaa52ab) (a counted "1 of 5" card between the main input and the rest).

Open questions for the owner:

1. Does status (Draft / In review / Signed off) live on the document or on the project? B puts it on rows; if it is a project property the chip moves to the group header and single-document projects show it inline.
2. Should single-document projects auto-name from the document title, so renaming the doc renames the project, or stay separate names that mostly repeat each other?
3. Is "Waiting on you" (C) a count of comments and suggestions addressed to the person, or anything unresolved on documents they touched? The first needs mentions or assignment; the second is computable today.
4. Should the team switcher hide when there is one team (A) or show a disabled "Acme" so the affordance is learnable before the second team exists?
5. Does the claim strip stay until dismissed, or only until the person has visited `/claim` once? And should it also appear inside the editor?
6. Sort: is "last edited" the person's own edits or anyone's? Recently opened (C) is per person; last edited (all options) is per document.
7. Is the "Move to project" action a real need for now, or does dragging between groups (B) replace it later?

**Round 7b, option D (composite, 2026-09-25).** The owner reviewed A, B and C and specified a composite, built as two pages: `/design/documents/documents-d` (the home) and `/design/documents/documents-d-project` (one project), in `DocumentsD.tsx`, `DocumentsDProject.tsx` and the shared `dPieces.tsx`. The container is called the **team** everywhere; there is no team switcher. From B: the app header with the avatar menu, and the claim strip, now with a dismiss (×) so it persists until dismissed. From C: the notched card tiles, but for projects: serif name, document count, "Updated 12 minutes ago · Marcus Chen" from the freshest document, a small stack of editor colour dots, an overflow with Rename and Delete project; 3-up on desktop, 2-up on a tablet, 1-up on a phone; a card opens the project page. From A: the plain-text "Sort by last edited · title" beside the search field, and the Free footnote. From C again: the flat table of documents in no project (title, last edited by anyone, who, copy-link, overflow with "Move to project ▸" listing the projects and "Delete document"). Two CTAs on the title row: primary "New spec", outlined "New project" (creates a card in rename). Moving a document animates the row out (height collapse, fade, a 6px slide up, 250ms, off under `prefers-reduced-motion`) and the target card's count and "Updated" line change; deleting swaps the row or card for an inline "Delete 'Checkout PRD'? This can't be undone. [Delete] [Keep]" (never `window.confirm`) and animates out the same way; deleting a project drops its documents back into Documents and the confirm says so. Empty states: a dashed-outline notched placeholder for no projects ("No projects yet. Group related specs under one name." with a New project link) and the komon empty state for no documents; `?empty=1` shows both. The project page keeps the same header, a breadcrumb "Your documents / Checkout redesign", the name in serif with an inline rename (pencil, input, Enter or Escape), "3 documents · Updated 12 minutes ago", "New spec" and an overflow with "Delete project", then the same search, sort and table, whose "Move to project" also offers "Remove from project". Empty: "Nothing in this project yet."

The owner's answers to the open questions: (1) status stays out; (2) no auto-naming, projects are created explicitly; (3) "Waiting on you" stays out, reviews are not on this page; (4) the switcher is hidden, there is one team; (5) the claim strip persists until dismissed and never appears in the editor; (6) "last edited" is anyone's edit; (7) "Move to project" is needed: a document lives in a project or in the Documents bucket, so there is no status column, no accordion and no dragging.

Free tier rule (`?plan=free`, or the "Plan: Free / Team" switch beside "Show empty state"): the same layout. Free has no projects, so the Projects section is present but locked: "New project" is disabled with a lock, the section body is one muted notched card ("Projects come with Team. Group specs, share seats and keep named history." with "See Team" to `/pricing`), every document sits in the Documents section and "Move to project" is absent from the row overflow. On the server, Free keeps all of a person's documents in one default project they never see. The footnote reads "Free keeps every document you make. Projects, seats and named history come with Team."

## Round 6 — Authentication (closed)

**Outcome (2026-09-25):** Sign in B shipped as `/signin`, Welcome A as `/welcome`, Claim B as `/claim` (`src/routes/SignIn.tsx`, `Welcome.tsx`, `Claim.tsx`). All seven variants stay under `/design/auth/*`. The B statement copy was changed to "Sign in to use Team. Free documents never need an account." (2026-09-25) The Welcome stepper was dropped on 2026-09-26: `/welcome` is now the greeting and the "Name your team" card alone, and claiming happens from the strip on `/documents` (which counts only keys the server verifies) rather than as a setup step.

The account pages that arrive with OAuth (`two-tier-proposal.md` section 5: OAuth first, GitHub and Google, Free needs no account, Team requires one). There is no email and password, so there is no password reset and no "create account" form: the first sign-in with a provider is the sign-up. Three surfaces, seven variants, all under `/design/auth/*` and rendered by `src/routes/design/auth/AuthExploration.tsx`. Style is locked to Product v2; the options differ in layout and how much they say.

Copy shared by every sign-in option: "Accounts are needed for Team: projects, seats and named history. Free documents never need one.", a link back to "Start a spec without an account" (`/`), and a legal line linking `/terms` and `/privacy`. Buttons do nothing except navigate to `/` where noted.

**Sign in**

| Option | Layout | Direction |
|---|---|---|
| `/design/auth/signin-a` | **A. Centered stencil sheet.** | One notched card on the asanoha ground with registration marks. Wordmark on top, "Sign in", the reason line, GitHub and Google as outlined two-layer notched buttons, a note that the first sign-in creates the account, the link back to a free document. Footer beneath. The least to read; the page is a gate and says so. |
| `/design/auth/signin-b` | **B. Split.** | Left half indigo cloth with the seigaiha dyed through: a serif statement ("An account is the door to Team. Free documents stay outside it.") and three lines with the mark: projects, seats, named history. Right half the same card on the plain ground. On a phone the indigo half becomes a band above the card. |
| `/design/auth/signin-c` | **C. Inline in the site.** | Site header and footer stay. Large serif "Sign in" on a short asanoha hero, then a komon band with the sign-in panel on the left (like the Contact form) and a numbered "What an account is for" column on the right in the Contact page's "what happens next" style, ending with a link to `/pricing`. |

**After sign-in (welcome)**

First screen after the provider returns. There are no workspaces yet, so the step is "Name your workspace", prefilled from the email domain (`priya@acme.co` becomes "Acme"), with "Skip for now" back to `/`.

| Option | Layout | Direction |
|---|---|---|
| `/design/auth/welcome-a` | **A. Full-page stepper.** | Three steps across the top on the asanoha ground: 1 Sign in (filled, check), 2 Name your workspace (outlined notch, active), 3 Invite people (muted, "later"). Greeting with a notched initials avatar and "Signed in as Priya Raman via Google", then the step 2 form on an indigo-bordered sheet. A footnote says step 3 can wait and that 5 seats are included. |
| `/design/auth/welcome-b` | **B. A quiet card.** | One card on a komon band: avatar, name and provider, "You're signed in.", the name field, one full-width button, and a single line "5 seats included on Team, add people any time." No stepper, so nothing suggests a long setup. |

**Claim a project**

Someone who wrote documents without an account signs in. The browser still holds the creator token (`mvp-spec.md` section 6), so the app can offer to attach those documents to the new workspace. Both options list 2 to 3 documents with title and last edited, offer "Move these into Acme" and "Not now", and say that share links keep working.

| Option | Layout | Direction |
|---|---|---|
| `/design/auth/claim-a` | **A. Sheet over the document.** | The document they were on, faked with a few lines of Markdown on a notched card, sits blurred and dimmed behind. A modal-style sheet with the mark, "Bring these documents with you?", the three documents as a plain list, primary and outlined "Not now", and the share-link line. No footer: it reads as an interruption on the way into the document. |
| `/design/auth/claim-b` | **B. A page.** | On a komon band. Left column explains with the mark how we know the documents are theirs (the creator key) and what does not change: share links, comments and history, and that an unchecked document stays a Free document claimable later. Right column is a notched table with a select-all header, a checkbox per row (all checked), editing count and last edited, and a footer whose button counts the selection ("Move 2 into Acme"). |

**Recommendation:** Sign in A (the plainest gate; B's statement repeats the pricing page, C's inline framing makes signing in look like a marketing page). Welcome B (with one step there is nothing for a stepper to sequence; A becomes right if invite-people ships as part of setup). Claim B (checkboxes let someone leave a personal draft behind, which A can't; A is better if claiming is triggered from inside a document rather than after sign-in).

Mobbin references consulted:

- Provider-only sign in: [Microsoft Copilot](https://mobbin.com/screens/e88a372c-08d7-49a4-b670-cbac99e11f4f) (three provider buttons, one line of reason, split with image), [Steep](https://mobbin.com/screens/9dddac5b-a5e7-43dd-90b0-7063434e6975) ("Sign in or create a new account", providers only, legal line), [Twingate](https://mobbin.com/screens/0223cd02-29d3-40de-ab9c-4a19073ec719) (stacked providers on a plain ground, terms and privacy at the foot), [Pi](https://mobbin.com/screens/c14e455c-da99-4996-975e-fdc96928c18b) (the reason to sign in as the heading, "Not now" as the way out).
- GitHub and Google together: [Lovable](https://mobbin.com/screens/a08946ce-1d08-4d35-907b-961eeb8f2df2), [Laravel Cloud](https://mobbin.com/screens/da4e69aa-9d8b-4f2e-9578-d9ad6d6c02b0), [GitBook](https://mobbin.com/screens/7fdc8055-8c83-498b-be38-89c773272c6c) (all split, product preview on the right, providers before email).
- Split with a statement instead of a screenshot: [Klaviyo](https://mobbin.com/screens/609920e7-3191-4ed1-8e5c-090cf98d338b) (dark half with a headline and four bullet lines), [Origin](https://mobbin.com/screens/78f8e79a-9f51-48e8-a2dd-46990e75a959) (serif "Welcome back", providers first).
- Welcome and workspace naming: [OpenAI Platform](https://mobbin.com/screens/611e8426-d9df-4449-ab4c-1fae5a59c6cb) (organisation name prefilled, "Signed in with ..." under the button, step dots on top), [Midday](https://mobbin.com/screens/29a9dee0-9f92-47a7-b1ff-3f41001a2a0e) (serif "Welcome, Sam", the quietest version), [Uxcel](https://mobbin.com/screens/635b9bc6-b4b5-4371-bc62-7a93735b5034) (progress bar over "Let's create your team"), [Devin](https://mobbin.com/screens/bee6917d-e6a3-4e5c-9352-2d648d5ef22d) ("Skip for now" under the primary), [Wrangle](https://mobbin.com/screens/a36483f9-b739-404c-bfe4-49a88aaac5cd) (onboarding status card listing done, current and not-started steps).
- Claiming and moving existing work: [Heidi](https://mobbin.com/screens/02e8e434-5f4e-436d-a7aa-29370bcc95a2) (review list with a checkbox per row and "Import (3 of 3)"), [Manus](https://mobbin.com/screens/4fe21022-2ea8-4c45-a9e5-507dba3214da) (select all, every row checked by default, over a blurred page), [Square](https://mobbin.com/screens/116c1970-a671-44e2-aca9-e598ce0865a7) (modal table with checkbox, title and status columns), [TheyDo](https://mobbin.com/screens/e0d88387-339f-4069-bff8-54a2da91e2da) (grouped checklist with counts and a single "Duplicate workspace" button), [fal](https://mobbin.com/screens/b6df3dd7-1d2a-49f3-8452-7dc208bf7913) (small modal over the dashboard).
