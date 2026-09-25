# Two-tier proposal: Free vs Team, and how each persona finds its page

> Status: decided 2026-09-25 (see section 5); ready to build the pricing page and routing
> Inputs: `mvp-spec.md`, the Round 1 homepage explorations (`HomeDeveloper.tsx`, `HomeProduct.tsx`), `prisma/schema.prisma`

## 1. Does "free = developers, paid = business" hold up?

**Recommendation: keep the two pages, but don't name the tiers after personas. Split by what the work needs (single documents vs projects with a team) and call the tiers "Free" and "Team".** The developer page and the product page then become two doors into the same pricing, not two different products.

### Where the persona split leaks

| Case | What happens under "free = dev, paid = business" |
|---|---|
| Dev team of 6 writing an RFC | Over the 3-collaborator cap, but the "business" page and its copy are aimed at someone else. They have no natural upgrade path and feel pushed out. |
| Solo PM | One person, so "3 collaborators" is fine, but they want one project with a PRD, a research summary and a decision log. Persona says pay; usage says free. |
| Business team with a single doc | Exactly the free tier's shape. They'll never pay, and the business page has been marketing a paid plan they don't need. |
| Cross-functional team (the actual MVP audience, section 1 of the spec) | Half of them are engineers. Which page is theirs? |

The lesson: persona predicts *which copy convinces you*, not *how much you'll pay*. Price should follow usage shape.

### Do the limits create upgrade pressure?

Mostly yes, with one fix. "10 docs" is a real wall for anyone who keeps using the tool, and "3 collaborators" bites the moment a doc gets a real review. The gap between "3 collaborators" and "5 included" is small enough that upgrading feels reasonable rather than punitive. The fix: the free tier should also be **single documents only** (no multi-doc projects), because "I want a folder for this initiative" is the clearest business signal you have and it maps directly onto the roadmap item "multiple docs per project (UI)".

### What "collaborator" means with no accounts

Today nobody is identifiable: a display name lives in localStorage and a share link is the whole permission system. You cannot count "collaborators" you cannot see. Two honest definitions:

- **Free tier: "up to 2 people editing at once".** This is a *concurrent editor* cap on a document, counted from Yjs awareness (the presence list that already powers cursors). It's measurable today, needs no accounts, and is easy to explain. Gameable? Yes, by waiting for someone to leave. That's fine for a free tier.
- **Team tier: a "seat" is a person with an account who is a member of a workspace.** Seats are what you bill for, so they need identity. This is roadmap items 1 (OAuth) and 9 (team workspaces) pulled forward; item 10 (billing) follows.

Data model changes for Team (Prisma, additive, no rewrite of the link system):

```
User            id, email, name, avatar, createdAt
Workspace       id, name, plan ('free'|'team'), seatLimit, billingCustomerId
WorkspaceMember workspaceId, userId, role ('owner'|'member')      -- a seat
Project         + workspaceId (nullable: null = anonymous/free project)
```

Share links keep working unchanged. A workspace project can additionally require login on its links (that's the OAuth-gated links item already on the roadmap). The free cap of 10 docs is enforced per `creator_token`; once a user "claims" their projects into a workspace, caps move to the workspace.

### Alternative framings

| Framing | Free | Paid | Verdict |
|---|---|---|---|
| **A. By unit** (docs vs projects) | Single docs | Projects with many docs, a sidebar, a workspace home | **Core of the recommendation.** Maps to the roadmap and to real behaviour. |
| **B. By feature** (history, links, AI) | 20 auto-snapshots, 3 named snapshots, edit/view links | Unlimited named snapshots, comment-only links, image upload, AI text ops when they ship | **Layer this on top of A.** Named snapshots are the "sign-off" the product page sells; that's the business feature. |
| **C. By seats only** (individual vs team) | 1 account | N seats | Clean, but requires accounts on day one and kills the no-signup hook that both pages lead with. Not now. |

Recommended: **A + B**. Free is generous on the thing that gets people in (one doc, no account, real-time editing). Team charges for structure (projects, workspace, seats) and for sign-off features (named history, comment-only review links).

## 2. Entry point and routing

**Recommendation: option (c) with (d)'s stable paths. Root is the product page. `/developers` is a permanent, linkable developer page. A single `/pricing` shows the same two tiers to everyone.**

| Option | Who sees what first | CTA | Investor cold view | Trade-off |
|---|---|---|---|---|
| (a) Neutral root with a two-way fork | Everyone sees a chooser | None until you choose | Weak: the site can't state what the product is without asking a question first | Adds a click for 100% of visitors to save confusion for maybe 20%. Chooser pages test badly. |
| (b) Root = developer page, "For teams" in nav | Devs first; PMs must find the nav link | `$ new doc` | Reads as a HackMD/Markdown tool; contradicts the spec's "not a dev-workflow clone" thesis | Works for GitHub because devs are also the buyers. Here the buyer is a PM. |
| **(c) Root = product page, "For developers" in nav** | Team buyers first; devs get a nav link | `Start a spec` (free, no account) | Strong: headline states the market and the wedge in one line | Devs who type the root domain see serif and sage. Acceptable: they almost never arrive that way. |
| (d) `/developers` and `/teams`, root picks by referrer/UTM | Depends on where you came from | Varies | Unpredictable for a demo; magic redirects look broken when they misfire | Keep the *paths*, drop the *auto-routing*. Link `/developers` from README, Docker Hub, HN posts; link `/` from everything else. |
| (e) One long page that shifts register | Dev tone at top, business tone below | Two CTAs on one page | Confusing: two typefaces, two voices, one URL | Loses what makes each exploration good: a single, committed voice. |

Why (c): developers do not discover tools by typing the domain. They arrive from a README, a `docker compose` snippet, a Hacker News thread, a colleague's link. All of those can point at `/developers` directly. PMs, investors and anyone forwarded "check out katagami.app" arrive at the root, and that's the page that explains the market. This also matches the spec's positioning: the product is for cross-functional spec teams, and developers are the on-ramp, not the audience.

One important consequence: **both pages' primary CTA stays free and account-less.** There's no trial to start because there's no account to create. The product page's "Start a spec" opens a free single doc; the upgrade happens inside the app when the team needs a project or a fourth editor. "Talk to us" / "See pricing" is the secondary link on the product page, not the primary button.

Nav for both pages: `Katagami · For developers · Pricing · [CTA]` on the root, `Katagami · For teams · Pricing · [$ new doc]` on `/developers`. The pricing page uses the product page's typography.

## 3. Pricing page sketch

| | **Free** | **Team** |
|---|---|---|
| Price | $0 | **$39 / month** with 5 seats included, then **$8 / extra seat / month** (placeholders, to be tested) |
| Account | None required | Required (GitHub / Google) |
| Documents | Up to 10 single docs per creator | Unlimited |
| Projects | Single docs only | Unlimited projects, many docs each, sidebar |
| People | Up to 2 editing a doc at once | 5 seats included, then per seat; unlimited view-only links |
| Sharing | Edit link + view link | Edit, view and comment-only links; optional login-required links |
| History | 20 auto-snapshots, 3 named | Unlimited named snapshots (the sign-off feature) |
| Export | Markdown | Markdown, PDF |
| Images | No | Yes |
| AI text ops (later) | No | Yes |
| Self-host | Not offered | Not offered |

### Upgrade moments inside the app

| Moment | What the user sees |
|---|---|
| Creating an 11th doc | "You've used all 10 free docs. Move them into a workspace to keep going." Upgrade button, plus "delete an old doc" as the honest alternative. |
| A 3rd person opens the edit link | Newcomer gets view-only with a banner: "2 people are already editing. Team workspaces have no limit." The two inside see a quiet notice. |
| "Add a doc to this project" | The menu item exists on free, greyed, with "Projects with multiple docs are a Team feature". This is the strongest signal; make it visible early. |
| Naming a 4th snapshot | "Free includes 3 named versions. Team keeps every sign-off." |
| Wanting a comment-only link for a stakeholder | Shown in the share dialog as a locked third option. |
| Clicking "claim this project" after signing in | Natural moment to show the workspace and its plan. |

## 4. Open questions for Travis

1. Do the tier names stay "Free / Team", or does the dev page get its own label ("Free for individuals and small teams")?
2. Is the 3-concurrent-editor cap acceptable as the free "collaborator" definition, or does free also require accounts eventually?
3. Does self-hosting stay unlimited and MIT? (It affects whether the dev page can honestly say "no lock-in".)
4. Which roadmap items move up to enable Team: OAuth (1), multi-doc UI (4), comment-only link (6), workspaces (9), billing (10). That's most of the roadmap; is that the plan for the next phase?
5. Should the Enterprise exploration survive as a third column on `/pricing` ("contact us"), or wait until someone asks?
6. Price points: pick a placeholder now so the pricing page can be built, then test.
7. Is `/developers` also the target for the README link, or does the README stay the developer landing page on its own?

## 5. Decisions (2026-09-25)

| # | Question | Decision |
|---|---|---|
| 1 | Tier names | **Free** and **Team**. The developer page may describe Free as "free for individuals and small teams" in copy without renaming it. |
| 2 | Free collaborator cap | **2 concurrent editors** per document, counted from Yjs awareness. A third arrival gets view-only. |
| 3 | Self-hosting | **Removed from the offer** for now. The MIT repo stays as it is, but no page promises a self-host option and the developer page's "no lock-in" claim rests on Markdown export, not on self-hosting. |
| 4 | Roadmap order | **OAuth first**, after the design direction is stable. Workspaces, multi-doc UI, comment-only links and billing follow. |
| 5 | Enterprise | Survives as a **third "Contact us" column on `/pricing`**. The button is unlinked until there's somewhere for it to go. |
| 6 | Price points | Placeholders: **Team $39 / month with 5 seats, $8 per extra seat / month**. Not validated; chosen so the page can be built and tested. |
| 7 | README target | README's live link points at **`/developers`** once that page exists. |

### Pricing page columns as decided

| | **Free** | **Team** | **Enterprise** |
|---|---|---|---|
| Price | $0 | $39 / month, 5 seats included, $8 / extra seat | Contact us |
| Account | None | Required | Required, SSO |
| Documents | Up to 10 single docs | Unlimited | Unlimited |
| Projects | Single docs only | Unlimited projects, many docs each | Unlimited |
| People | 2 editing at once | 5 seats included, then per seat | Custom seat agreements |
| Sharing | Edit + view links | Edit, view, comment-only, login-required links | Same, plus domain restrictions |
| History | 20 auto, 3 named | Unlimited named | Unlimited named, retention policies |
| Export | Markdown | Markdown, PDF | Markdown, PDF |
| Images | No | Yes | Yes |
| AI text ops (later) | No | Yes | Yes |
| Support | Community | Email | Named contact, uptime SLA |
