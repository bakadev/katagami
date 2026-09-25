# OAuth sign-in: what Travis needs to do first

Status: next project, starting 2026-09-25. Providers: GitHub and Google. Accounts and sessions live in our own Postgres with a cookie session. Clerk is a possible later swap; see the last section.

This document has two halves. The first is a checklist of things only you can do (registering apps with GitHub and Google, adding secrets). The second is the design the code will follow, so you can review it before it is built.

---

## Part 1: your checklist

### A. Decide the URLs

OAuth providers only redirect back to addresses you registered in advance. We need two environments:

| Environment | App URL | Callback URLs |
|---|---|---|
| Local | `http://localhost:5173` | `http://localhost:3005/api/auth/github/callback` and `.../google/callback` |
| Production | `https://katagami.bakadev.cloud` | `https://katagami.bakadev.cloud/api/auth/github/callback` and `.../google/callback` |

In local dev the Vite dev server (5173) proxies `/api` to Fastify (3005), so the callback lands on the API port directly. That is fine.

Google allows several redirect URIs in one client, so one Google client covers both environments. GitHub allows one callback per OAuth app, so you create **two** GitHub apps (one local, one production).

### B. GitHub (about 5 minutes, twice)

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.
   (Use your personal settings, not an org, since `bakadev` is a user account.)
2. Fill in:
   - Application name: `Katagami (local)` the first time, `Katagami` the second.
   - Homepage URL: the App URL from the table.
   - Authorization callback URL: the GitHub callback from the table.
   - Leave "Enable Device Flow" off.
3. Click **Register application**.
4. Copy the **Client ID** (public, fine to paste in chat).
5. Click **Generate a new client secret**, copy it once, and treat it like a password. Do not paste it in chat or commit it.
6. Repeat for the second environment.

   Done 2026-09-25. Production app "Katagami", Client ID (public): `Ov23liMQzcdzG6HGnmmt`. The local app's ID lives only in the local `.env`.

What we ask GitHub for: the `read:user` and `user:email` scopes, meaning your name, avatar and verified email. Nothing about repositories.

### C. Google (about 15 minutes, once)

1. Go to https://console.cloud.google.com and create a project called `Katagami` (top bar → project picker → New project).
2. **APIs & Services → OAuth consent screen**.
   - User type: **External**.
   - App name `Katagami`, support email your address, developer contact your address.
   - App domain: `katagami.bakadev.cloud`. Authorised domain: `bakadev.cloud`.
   - Links to privacy policy and terms: `https://katagami.bakadev.cloud/privacy` and `/terms`. These pages exist already.
   - Scopes: add `openid`, `email`, `profile`. These are "non-sensitive" so no review is needed.
   - Save. Leave the app in **Testing** status for now and add your own Google account under **Test users**. Testing mode allows up to 100 named users. Publishing to Production is a button click later and needs no review for these scopes.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**. Name `Katagami web`.
   - Authorised JavaScript origins: both App URLs from the table.
   - Authorised redirect URIs: both Google callback URLs from the table.
   - Create. Copy the **Client ID** and **Client secret**.

   Done 2026-09-25. Project `katagami-509721`, client `Katagami web`, Client ID (public):
   `389018847326-ge5r5ipd5st9uvf7kn0haugm0t4cqdbu.apps.googleusercontent.com`

### D. Generate a session secret

The server signs its session cookie with a secret so nobody can forge one. Generate one per environment on your laptop:

```bash
openssl rand -base64 32
```

### E. Put the values where the code reads them

**Local**: add to `.env` in the repo root (this file is git-ignored). See `.env.example` once the code lands.

```
APP_URL=http://localhost:5173
API_URL=http://localhost:3005
SESSION_SECRET=<from step D>
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Production**: add the same keys to `/opt/docker/katagami/.env` on the VPS, with the production values and `APP_URL=https://katagami.bakadev.cloud`, `API_URL` the same. Then restart:

```bash
cd /opt/docker/katagami && docker compose -f docker-compose.prod.yml up -d
```

Nothing changes in GitHub Actions. Secrets stay on the server, never in the image.

### F. One Nginx Proxy Manager check

The session cookie is marked `Secure`, so the app has to know it is behind HTTPS. Fastify learns that from the `X-Forwarded-Proto` header. Nginx Proxy Manager sends it by default on a standard proxy host, so nothing should be needed. If sign-in loops back to the sign-in page in production, this header is the first thing to check.

---

## Part 2: the design

### Why our own accounts rather than a service

- The VPS stays the only dependency. Nothing new to pay for or to go down.
- Users, projects and documents sit in one database, so "which documents does this person own" is a join, not an API call.
- The surface is small: two providers, one cookie, four tables.

### Library

`arctic` for the OAuth handshakes (small, typed, covers GitHub and Google, no framework assumptions). Sessions and cookies are our own code, roughly 100 lines, following the Lucia guide's pattern. No Passport.

### Data

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")

  accounts  Account[]
  sessions  Session[]
  workspaces WorkspaceMember[]

  @@map("users")
}

model Account {
  provider   String   // 'github' | 'google'
  providerId String   @map("provider_id")
  userId     String   @map("user_id") @db.Uuid
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerId])
  @@map("accounts")
}

model Session {
  id        String   @id            // sha256 of the cookie token
  userId    String   @map("user_id") @db.Uuid
  expiresAt DateTime @map("expires_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
}

model Workspace {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  members   WorkspaceMember[]
  projects  Project[]
}

model WorkspaceMember {
  workspaceId String @map("workspace_id") @db.Uuid
  userId      String @map("user_id") @db.Uuid
  role        String // 'owner' | 'editor'
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([workspaceId, userId])
  @@map("workspace_members")
}
```

`Project` gains an optional `workspaceId`. Projects with none are Free documents, exactly as today.

Email is the identity. Signing in with GitHub and later with Google using the same verified email links to one user. If a provider returns no verified email, sign-in fails with a clear message.

### Flow

1. `/signin` buttons link to `GET /api/auth/github` and `GET /api/auth/google`.
2. The server stores a random `state` (and for Google a PKCE verifier) in a short-lived cookie and redirects to the provider.
3. Provider redirects to `/api/auth/<provider>/callback?code=...&state=...`.
4. The server checks `state`, exchanges the code, fetches the profile, upserts `User` and `Account`, creates a `Session` row and sets the cookie:
   `katagami_session`, HttpOnly, Secure in production, SameSite=Lax, 30 days, sliding renewal when under 15 days left.
5. Redirect to `/welcome` for a first sign-in, or back to where they came from (`?next=` stored in the state cookie, same-origin paths only).
6. `GET /api/auth/me` returns `{ user, workspaces }` or 401. The client keeps this in a small hook and swaps the avatar menu contents.
7. `POST /api/auth/signout` deletes the session row and clears the cookie.

### Welcome and claim

- `/welcome` (Round 6, option A) becomes real: creating a workspace posts to `POST /api/workspaces`. "Skip for now" leaves the user with no workspace, which is a valid state.
- `/claim` (Round 6, option B) lists projects whose creator token the browser still holds (the tokens are in localStorage today under `katagami:creator-token:<projectId>`). The client sends those tokens to `POST /api/claim` with the target workspace. The server verifies each token against `projects.creator_token`, sets `workspaceId`, and the project moves. The token stays valid so the old link keeps working.
- After sign-in, if the browser holds any creator tokens, the welcome step 3 becomes "Move your documents" instead of "Invite people".

### What stays the same

- Free documents and their `?key=` links need no account and keep working.
- Yjs, snapshots, comments and suggestions are untouched. Comments and snapshots start recording `userId` beside the display name when a session exists.
- The random anonymous name for signed-out editors stays.

### Tests

- Handshake with a mocked provider: new user, returning user, same email on a second provider, provider without verified email.
- Session: expired cookie is rejected, sliding renewal, sign-out deletes the row.
- Claim: valid token moves the project, invalid token is ignored, a project already in a workspace is not moved.

### Effort

Two to three evenings. First evening: providers, sessions, `/api/auth/me`, avatar menu. Second: workspaces, welcome, claim. Third: tests and polish.

---

## Moving to a new domain later

Nothing has to be registered against the final domain up front. When it exists:

1. hPanel: add an A record for the new domain pointing at `72.62.80.77`.
2. Nginx Proxy Manager: add a proxy host for it (same container, same port, WebSockets on, request a certificate).
3. Google: **Credentials → the web client** → add the new callback to Authorised redirect URIs and the new origin to Authorised JavaScript origins. **OAuth consent screen** → add the new domain to Authorised domains. If the consent screen is already published, Google asks you to verify ownership of the new domain in Search Console (a DNS TXT record).
4. GitHub: edit the production OAuth app's callback URL, or create a third app.
5. VPS: change `APP_URL` and `API_URL` in `/opt/docker/katagami/.env`, restart the stack.
6. Optionally keep the old subdomain as a redirect to the new domain in Nginx Proxy Manager so shared links keep working.

No code change, no re-review, and existing accounts and sessions carry over because they are keyed by email, not by domain.

---

## If you later want Clerk

Clerk replaces steps B, C and D above (you register providers inside Clerk) and the `Account` and `Session` tables. `User` and `Workspace` stay, keyed by Clerk's user id instead of our uuid. The swap touches the auth routes and the `me` hook, not the documents, claim or workspace code, so building our own now does not paint us into a corner. The cost of Clerk is a monthly fee past 10,000 users and a third service in the sign-in path.
