# Admin (MVP)

`/admin` is a read-mostly page for whoever runs the service: who has signed up, which teams exist, and a switch to move a person between Free and Team for testing. It is the first cut; most of what an admin console eventually needs is deliberately not here yet.

## What it does

- **Totals**: users, teams, projects, documents.
- **Users**: name, email, joined, plan chip, teams, document count, and a three-way **Auto · Free · Team** control.
  - *Auto* means no override: the plan is derived (Team if the person belongs to at least one team, else Free).
  - *Free* forces Free even if they are in a team.
  - *Team* forces Team. If the person has no team, the server creates a personal one ("Ada's team") so projects have somewhere to live.
  - Changes save immediately (`PATCH /api/admin/users/:id/plan`) and the row updates in place with a short "Saved" flash. Errors show inline next to the control.
- **Teams**: name, slug, created, members with role chips, project and document counts.
- **Search** filters both tables by name, email (users) or name, slug, member (teams).

Everything on the page comes from `GET /api/admin/overview` (`AdminOverviewResponse` in `shared/types.ts`). The route handlers live in `server/routes/admin.ts`; the page is `src/routes/Admin.tsx`.

## Becoming an admin

There is no UI for granting admin. The server reads `ADMIN_EMAILS`, a comma-separated list of email addresses, and `GET /api/auth/me` returns `isAdmin: true` for a session whose email is on it (case-insensitive). The page shows a plain "Admins only" note to anyone else and never requests the overview.

- **Locally**: add to `.env` (see `.env.example`):

  ```
  ADMIN_EMAILS=you@example.com,colleague@example.com
  ```

  and restart the server (`pnpm dev`). The list is read once at boot.

- **On the VPS**: edit the env file the compose stack reads (`/opt/docker/katagami/.env`, from `.env.production.example`), then restart the app container so it picks the value up. See `docs/deployment.md` under "Restart without redeploying".

Admin access is tied to the sign-in email, so it survives the person changing their display name and is lost if they sign in with a different address.

## Not built yet

These are known gaps, in roughly the order they are likely to matter:

- **Promo codes** and any notion of a paid or trial period. The plan switch is the only lever.
- **Invites**: teams have no way to add members from the product; the admin page shows members but cannot change them.
- **Subscriptions and billing**: nothing talks to a payment provider; `planOverride` is the whole plan model.
- **Seat counts**: the "5 seats included" copy is not enforced anywhere.
- **Impersonation** ("view as this user") for support.
- **Audit log** of who changed what. Plan changes are not recorded beyond the current value.
- **Deleting or suspending users and teams** from the page.

## Deleting a user

Each user row (except your own) has a Delete link. It asks for confirmation inline, then removes the person, their projects with all documents, and any team where they were the last member. Teams with other members are left in place; the person just leaves them. Meant for cleaning up test accounts; there is no undo.
