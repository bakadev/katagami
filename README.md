# Katagami

Collaborative Markdown editor for cross-functional spec teams. Product, design, content and engineering draft a spec together, argue in the margins with text-anchored comments, and sign off on named versions. Every document is plain Markdown you can download at any time.

Live: https://katagami.bakadev.cloud

## Why "Katagami"

Katagami (型紙) are the hand-cut paper stencils Japanese artisans have used for centuries to dye patterns into cloth. One person cuts the stencil, another lays it on the fabric, another applies the indigo, and the pattern only appears once everyone has done their part. A spec works the same way. It's a template that a whole team fills in together: product frames it, design questions it, engineering builds from it, and the finished thing is only as good as the alignment between them. The stencil itself is simple and durable, just paper and cuts, which is what a spec should be too: plain Markdown, no lock-in, something you can hold up to the light and see straight through. Katagami is the tool for cutting that stencil together.

## What's in the box

- Real-time co-editing with labelled cursors (TipTap + Yjs over WebSockets)
- Markdown source stays visible while you type; syntax is dimmed, formatting is rendered inline
- Edit / Preview toggle, formatting toolbar, keyboard shortcuts
- Text-anchored comment threads with replies and resolve
- Version history: auto-snapshots every 5 idle minutes, named snapshots, restore with undo
- Edit link and view-only link per document; no accounts
- Light and dark themes, Markdown export

The authoritative design is [`docs/mvp-spec.md`](docs/mvp-spec.md). Each phase has a spec and an implementation plan under `docs/`.

## Local setup

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 | `node -v` |
| pnpm | 9.15 | Run `corepack enable` once and pnpm is provided automatically from `package.json` |
| Docker Desktop | any recent | Only used to run Postgres locally |

### First run

```bash
git clone git@github.com:bakadev/katagami.git
cd katagami
corepack enable            # once per machine; gives you the pinned pnpm
pnpm install
cp .env.example .env       # defaults work as-is
docker compose up -d       # starts Postgres on localhost:5432
pnpm db:push               # creates the tables
pnpm dev                   # server on :3001 + client on :5173
```

Open http://localhost:5173, click **Create new doc**, and you're in the editor. To see collaboration, open the same document URL in a second browser or an incognito window.

`.env` values:

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/katagami?schema=public` | Postgres connection string |
| `PORT` | `3001` | API + WebSocket server port. The Vite dev proxy reads this too, so change it in one place only. |
| `NODE_ENV` | `development` | Set to `production` to serve the built client from the server |

### Day to day

```bash
pnpm dev            # both server and client with hot reload
pnpm test           # full suite (needs Postgres running; see below)
pnpm test:watch     # vitest in watch mode
pnpm typecheck      # client + server tsc
pnpm lint           # eslint
pnpm build          # client to dist/client, server to dist/server
pnpm start          # run the production build locally (NODE_ENV=production)
```

**Tests need Postgres.** Every test file, including client component tests, connects to the database in a global setup hook. If the whole suite fails instantly with "Can't reach database server", run `docker compose up -d` first. `persistence.test.ts` has an occasional timing flake; rerun once before investigating.

### Database changes

Prisma manages the schema in `prisma/schema.prisma`.

```bash
pnpm db:migrate     # create and apply a migration after editing the schema
pnpm db:generate    # regenerate the Prisma client (also runs on migrate)
pnpm db:reset       # drop everything and re-apply all migrations (destroys local data)
```

Commit the generated folder under `prisma/migrations/`. In production, migrations run automatically when the container starts.

### Common problems

- **Port already in use.** Something else is on 5173 or 3001. Change `PORT` in `.env` for the server; for the client, edit `server.port` in `vite.config.ts`.
- **Prisma client out of date** after pulling schema changes: `pnpm db:generate`, then `pnpm db:push` or `pnpm db:migrate`.
- **Two browsers don't sync.** Check the connection dot in the document header. If it's red, the server isn't running or the proxy port in `.env` doesn't match.

## Project layout

```
server/        Fastify API, WebSocket sync handler, snapshot timer
src/           React client (routes, components, editor extensions, hooks)
shared/        Types shared by client and server
prisma/        Schema and migrations
tests/         Vitest suites for client and server
docs/          Specs, implementation plans, research, deployment guide
```

## Design explorations

`/design` in the running app holds side-by-side redesign options, each built for a different persona. They're public so reviewers can open them, but nothing links to them from the app. See [`docs/design-explorations/README.md`](docs/design-explorations/README.md) for the personas and how a round works.

## Deployment

Pushing to `main` builds a Docker image and deploys it to the VPS through GitHub Actions. Everything you need to know, including the one-time server setup, is in [`docs/deployment.md`](docs/deployment.md).

## Roadmap docs

- [`docs/oauth-prep.md`](docs/oauth-prep.md): what to register with GitHub and Google before sign-in is built, and the accounts/sessions design.
- [`docs/contact-form-spec.md`](docs/contact-form-spec.md): store-then-notify contact form, with the mail provider setup.
- [`docs/suggesting-mode-proposal.md`](docs/suggesting-mode-proposal.md): suggesting mode, steps 3 and 4 still open.

## Tech stack

React 19, Vite 7, TypeScript, Tailwind 4, shadcn/ui, TipTap 3, Yjs, y-websocket on the client. Fastify, Prisma and PostgreSQL on the server, in a single Node process. Plain-English explanations of the backend pieces are in `docs/mvp-spec.md` section 4.
