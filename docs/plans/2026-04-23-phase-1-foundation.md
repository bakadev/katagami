# MVP Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the non-UI substrate of the MVP — a real-time Yjs sync server with Postgres persistence, permission-gated access, creator token admin actions, and the minimum frontend scaffolding to prove the collab loop works end-to-end.

**Architecture:** Single Node process running Fastify for REST + WebSocket on the same port. Prisma + Postgres for persistent state. Yjs documents live in memory per active room and get debounce-persisted as binary blobs. Permission tokens travel in URL query strings; creator tokens travel in an HTTP header. Frontend is a barebones Vite + React app with a single textarea-style editor bound to Yjs — no TipTap yet.

**Tech Stack:** Node 20+, Fastify 5, @fastify/websocket, Prisma 5, PostgreSQL 16, Yjs 13, y-protocols, React 19, Vite 7, React Router 7, TypeScript 5 (strict), Vitest 4.

**After this plan completes, you should be able to:**
1. `docker compose up -d` to start Postgres
2. `pnpm dev` to start both server and client
3. Open two browsers to the same doc URL
4. Type in one browser, see changes in the other
5. Close and restart the server — state persists
6. Visit a view-only URL and be unable to edit
7. Delete a doc via the creator token API

**What's explicitly NOT in this plan (deferred to later phases):**
- TipTap editor with inline Markdown decorations
- Preview mode
- CommonMark rendering
- Commenting system / CriticMarkup
- Version history UI (snapshots table exists, but snapshot logic is phase 4)
- Markdown export
- Dark/light mode
- shadcn/ui components (setup happens here, but we don't build UI components yet)

---

## File Structure

Monorepo-style layout in a single package for MVP simplicity. Split cleanly once complexity warrants it.

```
/
├── .env                          # local secrets (gitignored)
├── .env.example                  # committed template
├── .gitignore
├── docker-compose.yml            # local Postgres
├── package.json                  # single package, both client + server
├── pnpm-lock.yaml
├── tsconfig.json                 # root shared config
├── tsconfig.client.json          # client-specific (browser DOM types)
├── tsconfig.server.json          # server-specific (Node types)
├── vite.config.ts                # Vite client config with /api + /ws proxy
├── prisma/
│   └── schema.prisma
├── src/                          # client (React)
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── Home.tsx              # "Create new doc" landing
│   │   ├── Document.tsx          # editor page
│   │   └── NotFound.tsx
│   ├── lib/
│   │   ├── api.ts                # typed fetch wrapper
│   │   ├── creator-token.ts      # localStorage helpers
│   │   └── yjs-client.ts         # Yjs doc + WebSocket provider setup
│   └── styles.css                # tailwind imports (no components yet)
├── server/
│   ├── index.ts                  # entry point — starts Fastify
│   ├── env.ts                    # typed env loading
│   ├── db.ts                     # Prisma singleton
│   ├── routes/
│   │   ├── projects.ts           # POST /api/projects
│   │   ├── documents.ts          # GET /api/docs/:id, DELETE, PATCH, rotate
│   │   └── health.ts             # GET /api/health
│   ├── ws/
│   │   ├── yjs-handler.ts        # WebSocket upgrade + Yjs sync protocol
│   │   └── persistence.ts        # debounced writes of Yjs state
│   ├── auth/
│   │   ├── permission-token.ts   # validate ?key= tokens
│   │   └── creator-token.ts      # validate X-Creator-Token header
│   └── lib/
│       └── random.ts             # URL-safe random token generator
├── shared/
│   └── types.ts                  # shared API types (request/response shapes)
└── tests/
    ├── server/
    │   ├── projects.test.ts
    │   ├── documents.test.ts
    │   ├── auth.test.ts
    │   └── yjs-sync.test.ts
    └── setup.ts                  # test DB setup + teardown
```

---

## Prerequisites

Before starting: Node 20+ installed, pnpm installed (`npm i -g pnpm`), Docker Desktop installed and running.

---

## Task 1: Initialize repo + monorepo scaffolding

**Goal:** Git-initialized directory with package.json, TypeScript configs, and working `pnpm install`. No running code yet.

**Note — already done before this plan runs:** `git init -b main` has been executed and `origin` is set to `git@github-bakadev:bakadev/katagami.git`. Verify with `git remote -v` before starting; if the remote is missing, run `git remote add origin git@github-bakadev:bakadev/katagami.git`.

**Files:**
- Create: `/.gitignore`
- Create: `/package.json`
- Create: `/tsconfig.json`
- Create: `/tsconfig.client.json`
- Create: `/tsconfig.server.json`
- Create: `/.env.example`
- Create: `/README.md` (minimal — one paragraph)

- [ ] **Step 1: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
/prisma/generated/
.vite/
coverage/
```

- [ ] **Step 2: Create package.json**

Create `package.json`:
```json
{
  "name": "katagami",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently -k -n server,client -c blue,green \"pnpm dev:server\" \"pnpm dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "pnpm build:client && pnpm build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset --force",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.client.json --noEmit && tsc -p tsconfig.server.json --noEmit"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@fastify/websocket": "^11.0.1",
    "@prisma/client": "^5.22.0",
    "fastify": "^5.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.1",
    "y-protocols": "^1.0.7",
    "yjs": "^13.6.29"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^9.1.0",
    "eslint": "^9.17.0",
    "jsdom": "^25.0.1",
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.1",
    "vite": "^7.1.7",
    "vitest": "^4.0.18",
    "ws": "^8.18.0",
    "y-websocket": "^2.1.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 3: Create TypeScript configs**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "allowImportingTsExtensions": false,
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"],
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

Create `tsconfig.client.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "noEmit": true
  },
  "include": ["src", "shared", "vite.config.ts"]
}
```

Create `tsconfig.server.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "dist/server",
    "rootDir": ".",
    "module": "ES2022",
    "noEmit": false
  },
  "include": ["server", "shared", "prisma"]
}
```

- [ ] **Step 4: Create .env.example and placeholder README**

Create `.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/katagami?schema=public
PORT=3001
NODE_ENV=development
```

Create `README.md`:
```markdown
# Katagami

Collaborative Markdown editor for cross-functional spec teams. See `docs/mvp-spec.md`.

## Dev setup

1. `docker compose up -d`
2. `cp .env.example .env`
3. `pnpm install`
4. `pnpm db:push`
5. `pnpm dev`
```

- [ ] **Step 5: Install dependencies**

Run:
```bash
pnpm install
```

Expected: installs without errors, generates `pnpm-lock.yaml`.

- [ ] **Step 6: Verify TypeScript compiles (nothing to compile yet, but config sanity)**

Run:
```bash
pnpm exec tsc -p tsconfig.server.json --noEmit
```
Expected: exits 0 with no errors (no .ts files yet to check).

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml tsconfig.json tsconfig.client.json tsconfig.server.json .env.example README.md
git commit -m "chore: initial project scaffolding"
```

---

## Task 2: Local Postgres + Prisma schema

**Goal:** A running local Postgres, a Prisma schema matching the MVP spec's data model, and a generated Prisma Client.

**Files:**
- Create: `/docker-compose.yml`
- Create: `/prisma/schema.prisma`
- Create: `/.env` (from `.env.example`; gitignored)

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: katagami
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Create .env from template**

Run:
```bash
cp .env.example .env
```

- [ ] **Step 3: Start Postgres**

Run:
```bash
docker compose up -d
```

Verify:
```bash
docker compose ps
```
Expected: `postgres` service status is `running` / `healthy`.

- [ ] **Step 4: Create Prisma schema**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id            String    @id @default(uuid()) @db.Uuid
  name          String?
  creatorToken  String    @map("creator_token")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  documents     Document[]

  @@map("projects")
  @@index([creatorToken])
}

model Document {
  id          String    @id @default(uuid()) @db.Uuid
  projectId   String    @map("project_id") @db.Uuid
  title       String?
  yjsState    Bytes     @default("") @map("yjs_state")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  snapshots   Snapshot[]
  permissions Permission[]

  @@map("documents")
  @@index([projectId])
}

model Snapshot {
  id           String    @id @default(uuid()) @db.Uuid
  documentId   String    @map("document_id") @db.Uuid
  yjsState     Bytes     @map("yjs_state")
  takenAt      DateTime  @default(now()) @map("taken_at")
  takenByName  String?   @map("taken_by_name")

  document     Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("snapshots")
  @@index([documentId, takenAt])
}

model Permission {
  documentId   String    @map("document_id") @db.Uuid
  level        String    // 'edit' | 'view'
  token        String    @unique

  document     Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@id([documentId, level])
  @@map("permissions")
  @@index([token])
}
```

- [ ] **Step 5: Push schema to local Postgres and generate client**

Run:
```bash
pnpm db:push
```
Expected: output contains "Your database is now in sync with your Prisma schema" and "Generated Prisma Client".

- [ ] **Step 6: Sanity-check the database**

Run:
```bash
docker compose exec postgres psql -U postgres -d katagami -c "\dt"
```
Expected: lists four tables: `projects`, `documents`, `snapshots`, `permissions`.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml prisma/schema.prisma
git commit -m "feat(db): add Postgres schema for projects, documents, snapshots, permissions"
```

---

## Task 3: Fastify server with health check + Prisma singleton

**Goal:** A Fastify server that starts, exposes `GET /api/health` returning `{ ok: true }`, and instantiates a shared Prisma client.

**Files:**
- Create: `/server/env.ts`
- Create: `/server/db.ts`
- Create: `/server/index.ts`
- Create: `/server/routes/health.ts`
- Create: `/tests/server/health.test.ts`
- Create: `/tests/setup.ts`
- Create: `/vitest.config.ts`

- [ ] **Step 1: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      "~": "/src",
      "@server": "/server",
      "@shared": "/shared",
    },
  },
});
```

- [ ] **Step 2: Create env loader**

Create `server/env.ts`:
```typescript
import { config } from "dotenv";

config();

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
```

Install dotenv:
```bash
pnpm add dotenv
```

- [ ] **Step 3: Create Prisma singleton**

Create `server/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
```

- [ ] **Step 4: Create health route**

Create `server/routes/health.ts`:
```typescript
import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({ ok: true }));
}
```

- [ ] **Step 5: Create Fastify entry point**

Create `server/index.ts`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 6: Create test setup**

Create `tests/setup.ts`:
```typescript
import { beforeAll, afterAll } from "vitest";
import { db } from "../server/db.js";

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
});
```

- [ ] **Step 7: Write the failing test**

Create `tests/server/health.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../server/index.js";

describe("GET /api/health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns ok: true", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 8: Run test**

Run:
```bash
pnpm test tests/server/health.test.ts
```
Expected: 1 passing test.

- [ ] **Step 9: Start the server manually to verify**

In one terminal:
```bash
pnpm dev:server
```
In another:
```bash
curl http://localhost:3001/api/health
```
Expected: `{"ok":true}`

Stop the server with Ctrl-C.

- [ ] **Step 10: Commit**

```bash
git add server/ tests/ vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(server): add Fastify server with health check and Prisma client"
```

---

## Task 4: Shared types + random token helper

**Goal:** Shared request/response types and a URL-safe random token generator used by creator tokens and permission tokens.

**Files:**
- Create: `/shared/types.ts`
- Create: `/server/lib/random.ts`
- Create: `/tests/server/random.test.ts`

- [ ] **Step 1: Create shared types**

Create `shared/types.ts`:
```typescript
export type PermissionLevel = "edit" | "view";

export interface CreateProjectResponse {
  project: {
    id: string;
    name: string | null;
  };
  document: {
    id: string;
  };
  permissions: {
    editToken: string;
    viewToken: string;
  };
  creatorToken: string;
}

export interface DocumentMetadataResponse {
  document: {
    id: string;
    projectId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  };
  permissionLevel: PermissionLevel;
}

export interface ApiError {
  error: string;
  message: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/server/random.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { randomToken } from "../../server/lib/random.js";

describe("randomToken", () => {
  it("returns a URL-safe string of the requested length", () => {
    const t = randomToken(32);
    expect(t).toHaveLength(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different values on each call", () => {
    const a = randomToken(32);
    const b = randomToken(32);
    expect(a).not.toBe(b);
  });

  it("defaults to 32 characters", () => {
    expect(randomToken()).toHaveLength(32);
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

```bash
pnpm test tests/server/random.test.ts
```
Expected: FAIL — "Cannot find module '../../server/lib/random.js'".

- [ ] **Step 4: Implement random token**

Create `server/lib/random.ts`:
```typescript
import { randomBytes } from "node:crypto";

export function randomToken(length = 32): string {
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, length);
}
```

- [ ] **Step 5: Run test**

```bash
pnpm test tests/server/random.test.ts
```
Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add shared/ server/lib/ tests/server/random.test.ts
git commit -m "feat(server): add random token helper and shared API types"
```

---

## Task 5: POST /api/projects endpoint

**Goal:** Create a project + first document + both permission tokens in one transaction. Returns the creator token and document URLs.

**Files:**
- Create: `/server/routes/projects.ts`
- Modify: `/server/index.ts` (register the new route)
- Create: `/tests/server/projects.test.ts`
- Create: `/tests/helpers.ts`

- [ ] **Step 1: Create test helpers**

Create `tests/helpers.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { buildServer } from "../server/index.js";
import { db } from "../server/db.js";

export async function makeTestApp(): Promise<FastifyInstance> {
  return buildServer();
}

export async function resetDb() {
  await db.permission.deleteMany();
  await db.snapshot.deleteMany();
  await db.document.deleteMany();
  await db.project.deleteMany();
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/server/projects.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

describe("POST /api/projects", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates a project, one document, edit + view permissions, returns creator token", async () => {
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.project.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.document.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.permissions.editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.permissions.viewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.creatorToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(body.permissions.editToken).not.toBe(body.permissions.viewToken);

    const project = await db.project.findUnique({ where: { id: body.project.id } });
    expect(project).not.toBeNull();
    expect(project!.creatorToken).toBe(body.creatorToken);

    const doc = await db.document.findUnique({ where: { id: body.document.id } });
    expect(doc).not.toBeNull();
    expect(doc!.projectId).toBe(body.project.id);

    const perms = await db.permission.findMany({ where: { documentId: body.document.id } });
    expect(perms).toHaveLength(2);
    expect(perms.map((p) => p.level).sort()).toEqual(["edit", "view"]);
  });
});
```

- [ ] **Step 3: Run the test to confirm failure**

```bash
pnpm test tests/server/projects.test.ts
```
Expected: FAIL — route not registered (404).

- [ ] **Step 4: Create the route**

Create `server/routes/projects.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { randomToken } from "../lib/random.js";
import type { CreateProjectResponse } from "../../shared/types.js";

export async function projectRoutes(app: FastifyInstance) {
  app.post("/api/projects", async (_req, reply) => {
    const creatorToken = randomToken(32);
    const editToken = randomToken(32);
    const viewToken = randomToken(32);

    const result = await db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { creatorToken },
      });
      const document = await tx.document.create({
        data: { projectId: project.id },
      });
      await tx.permission.createMany({
        data: [
          { documentId: document.id, level: "edit", token: editToken },
          { documentId: document.id, level: "view", token: viewToken },
        ],
      });
      return { project, document };
    });

    const body: CreateProjectResponse = {
      project: { id: result.project.id, name: result.project.name },
      document: { id: result.document.id },
      permissions: { editToken, viewToken },
      creatorToken,
    };
    reply.code(201).send(body);
  });
}
```

- [ ] **Step 5: Register the route**

Modify `server/index.ts` — change the `buildServer` function to register `projectRoutes`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);
  await app.register(projectRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 6: Run the test**

```bash
pnpm test tests/server/projects.test.ts
```
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add server/routes/projects.ts server/index.ts tests/helpers.ts tests/server/projects.test.ts
git commit -m "feat(api): add POST /api/projects for document creation with permission tokens"
```

---

## Task 6: Permission token validation helper

**Goal:** A pure function that validates a `key` token against a document and returns the permission level (or null).

**Files:**
- Create: `/server/auth/permission-token.ts`
- Create: `/tests/server/permission-token.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/server/permission-token.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { validatePermissionToken } from "../../server/auth/permission-token.js";

describe("validatePermissionToken", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let viewToken: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
    viewToken = body.permissions.viewToken;
  });

  it("returns 'edit' for a valid edit token", async () => {
    expect(await validatePermissionToken(documentId, editToken)).toBe("edit");
  });

  it("returns 'view' for a valid view token", async () => {
    expect(await validatePermissionToken(documentId, viewToken)).toBe("view");
  });

  it("returns null for a wrong token", async () => {
    expect(await validatePermissionToken(documentId, "nonsense")).toBeNull();
  });

  it("returns null for a token that belongs to a different doc", async () => {
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const otherBody = res.json();
    expect(await validatePermissionToken(documentId, otherBody.permissions.editToken)).toBeNull();
  });

  it("returns null for missing token", async () => {
    expect(await validatePermissionToken(documentId, undefined)).toBeNull();
    expect(await validatePermissionToken(documentId, "")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/server/permission-token.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement validator**

Create `server/auth/permission-token.ts`:
```typescript
import { db } from "../db.js";
import type { PermissionLevel } from "../../shared/types.js";

export async function validatePermissionToken(
  documentId: string,
  token: string | undefined | null,
): Promise<PermissionLevel | null> {
  if (!token) return null;

  const perm = await db.permission.findUnique({
    where: { token },
  });

  if (!perm || perm.documentId !== documentId) return null;
  if (perm.level !== "edit" && perm.level !== "view") return null;

  return perm.level as PermissionLevel;
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/server/permission-token.test.ts
```
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add server/auth/ tests/server/permission-token.test.ts
git commit -m "feat(auth): add permission token validator"
```

---

## Task 7: GET /api/docs/:id endpoint

**Goal:** Fetch a document by ID, gated by a permission token from the `?key=` query param. Returns metadata and the caller's resolved permission level.

**Files:**
- Create: `/server/routes/documents.ts`
- Modify: `/server/index.ts` (register route)
- Create: `/tests/server/documents.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/server/documents.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";

describe("GET /api/docs/:id", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let viewToken: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
    viewToken = body.permissions.viewToken;
  });

  it("returns metadata + 'edit' for a valid edit token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.document.id).toBe(documentId);
    expect(body.permissionLevel).toBe("edit");
  });

  it("returns metadata + 'view' for a valid view token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().permissionLevel).toBe("view");
  });

  it("returns 403 when the token is wrong", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${documentId}?key=nonsense`,
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 403 when the token is missing", async () => {
    const res = await app.inject({ method: "GET", url: `/api/docs/${documentId}` });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 when the document does not exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/00000000-0000-0000-0000-000000000000?key=${editToken}`,
    });
    expect(res.statusCode).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/server/documents.test.ts
```
Expected: FAIL — 404 on all routes.

- [ ] **Step 3: Create the route**

Create `server/routes/documents.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import type { DocumentMetadataResponse } from "../../shared/types.js";

export async function documentRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        return reply.code(404).send({ error: "not_found", message: "Document not found" });
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Invalid or missing permission token" });
      }

      const body: DocumentMetadataResponse = {
        document: {
          id: doc.id,
          projectId: doc.projectId,
          title: doc.title,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        },
        permissionLevel: level,
      };
      reply.send(body);
    },
  );
}
```

- [ ] **Step 4: Register the route**

Modify `server/index.ts` — add import and register:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { documentRoutes } from "./routes/documents.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);
  await app.register(projectRoutes);
  await app.register(documentRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 5: Run test**

```bash
pnpm test tests/server/documents.test.ts
```
Expected: 5 passing tests.

- [ ] **Step 6: Commit**

```bash
git add server/routes/documents.ts server/index.ts tests/server/documents.test.ts
git commit -m "feat(api): add GET /api/docs/:id with permission gating"
```

---

## Task 8: Creator token validation + admin routes

**Goal:** Validate the `X-Creator-Token` header, and implement DELETE doc, PATCH project (rename), and POST rotate-keys.

**Files:**
- Create: `/server/auth/creator-token.ts`
- Modify: `/server/routes/documents.ts` (add DELETE and rotate)
- Create: `/server/routes/project-admin.ts`
- Modify: `/server/index.ts` (register new route file)
- Create: `/tests/server/admin.test.ts`

- [ ] **Step 1: Create creator-token validator**

Create `server/auth/creator-token.ts`:
```typescript
import { db } from "../db.js";

export async function validateCreatorTokenForProject(
  projectId: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  return project.creatorToken === token;
}

export async function validateCreatorTokenForDocument(
  documentId: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc) return false;
  return doc.project.creatorToken === token;
}
```

- [ ] **Step 2: Write the failing test for admin flows**

Create `tests/server/admin.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

describe("admin routes", () => {
  let app: FastifyInstance;
  let projectId: string;
  let documentId: string;
  let creatorToken: string;
  let editToken: string;

  beforeAll(async () => {
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    projectId = body.project.id;
    documentId = body.document.id;
    creatorToken = body.creatorToken;
    editToken = body.permissions.editToken;
  });

  describe("PATCH /api/projects/:id", () => {
    it("renames with a valid creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        headers: { "x-creator-token": creatorToken },
        payload: { name: "My Spec" },
      });
      expect(res.statusCode).toBe(200);
      const project = await db.project.findUnique({ where: { id: projectId } });
      expect(project!.name).toBe("My Spec");
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        payload: { name: "x" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("returns 403 with the wrong creator token", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/projects/${projectId}`,
        headers: { "x-creator-token": "not-the-right-token" },
        payload: { name: "x" },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/docs/:id", () => {
    it("deletes a document with a valid creator token", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/docs/${documentId}`,
        headers: { "x-creator-token": creatorToken },
      });
      expect(res.statusCode).toBe(204);
      const doc = await db.document.findUnique({ where: { id: documentId } });
      expect(doc).toBeNull();
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({ method: "DELETE", url: `/api/docs/${documentId}` });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/docs/:id/rotate-keys", () => {
    it("generates new permission tokens and invalidates the old ones", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/docs/${documentId}/rotate-keys`,
        headers: { "x-creator-token": creatorToken },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.editToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(body.viewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(body.editToken).not.toBe(editToken);

      // Old token no longer works
      const check = await app.inject({
        method: "GET",
        url: `/api/docs/${documentId}?key=${editToken}`,
      });
      expect(check.statusCode).toBe(403);

      // New token does
      const check2 = await app.inject({
        method: "GET",
        url: `/api/docs/${documentId}?key=${body.editToken}`,
      });
      expect(check2.statusCode).toBe(200);
    });

    it("returns 403 without a creator token", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/docs/${documentId}/rotate-keys`,
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

```bash
pnpm test tests/server/admin.test.ts
```
Expected: FAIL — all routes missing (404/405).

- [ ] **Step 4: Implement project admin routes**

Create `server/routes/project-admin.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validateCreatorTokenForProject } from "../auth/creator-token.js";

export async function projectAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: { name?: string } }>(
    "/api/projects/:id",
    async (req, reply) => {
      const { id } = req.params;
      const token = req.headers["x-creator-token"];
      const tokenStr = typeof token === "string" ? token : undefined;

      const ok = await validateCreatorTokenForProject(id, tokenStr);
      if (!ok) {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Invalid or missing creator token" });
      }

      const { name } = req.body ?? {};
      const project = await db.project.update({
        where: { id },
        data: { name: name ?? null },
      });
      reply.send({ project: { id: project.id, name: project.name } });
    },
  );
}
```

- [ ] **Step 5: Extend document routes with DELETE and rotate-keys**

Modify `server/routes/documents.ts` — replace the entire file with:
```typescript
import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { validatePermissionToken } from "../auth/permission-token.js";
import { validateCreatorTokenForDocument } from "../auth/creator-token.js";
import { randomToken } from "../lib/random.js";
import type { DocumentMetadataResponse } from "../../shared/types.js";

export async function documentRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;

      const doc = await db.document.findUnique({ where: { id } });
      if (!doc) {
        return reply.code(404).send({ error: "not_found", message: "Document not found" });
      }

      const level = await validatePermissionToken(id, key);
      if (!level) {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Invalid or missing permission token" });
      }

      const body: DocumentMetadataResponse = {
        document: {
          id: doc.id,
          projectId: doc.projectId,
          title: doc.title,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        },
        permissionLevel: level,
      };
      reply.send(body);
    },
  );

  app.delete<{ Params: { id: string } }>("/api/docs/:id", async (req, reply) => {
    const { id } = req.params;
    const token = req.headers["x-creator-token"];
    const tokenStr = typeof token === "string" ? token : undefined;

    const ok = await validateCreatorTokenForDocument(id, tokenStr);
    if (!ok) {
      return reply
        .code(403)
        .send({ error: "forbidden", message: "Invalid or missing creator token" });
    }

    await db.document.delete({ where: { id } });
    reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>(
    "/api/docs/:id/rotate-keys",
    async (req, reply) => {
      const { id } = req.params;
      const token = req.headers["x-creator-token"];
      const tokenStr = typeof token === "string" ? token : undefined;

      const ok = await validateCreatorTokenForDocument(id, tokenStr);
      if (!ok) {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Invalid or missing creator token" });
      }

      const editToken = randomToken(32);
      const viewToken = randomToken(32);

      await db.$transaction([
        db.permission.update({
          where: { documentId_level: { documentId: id, level: "edit" } },
          data: { token: editToken },
        }),
        db.permission.update({
          where: { documentId_level: { documentId: id, level: "view" } },
          data: { token: viewToken },
        }),
      ]);

      reply.send({ editToken, viewToken });
    },
  );
}
```

- [ ] **Step 6: Register admin route**

Modify `server/index.ts`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { documentRoutes } from "./routes/documents.js";
import { projectAdminRoutes } from "./routes/project-admin.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(healthRoutes);
  await app.register(projectRoutes);
  await app.register(documentRoutes);
  await app.register(projectAdminRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 7: Run the admin test**

```bash
pnpm test tests/server/admin.test.ts
```
Expected: all 6 tests pass.

- [ ] **Step 8: Run the full server suite as a sanity check**

```bash
pnpm test
```
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add server/auth/creator-token.ts server/routes/documents.ts server/routes/project-admin.ts server/index.ts tests/server/admin.test.ts
git commit -m "feat(api): add creator-token admin routes (rename, delete, rotate keys)"
```

---

## Task 9: WebSocket Yjs sync handler (no persistence yet)

**Goal:** `@fastify/websocket` handler at `/ws/:docId` validates the `?key=` token (must be `edit` for write, `view` allowed for read), maintains a Y.Doc per room, and relays sync + awareness messages between connected clients. No DB persistence yet — state is in memory only.

**Files:**
- Create: `/server/ws/yjs-handler.ts`
- Modify: `/server/index.ts` (register websocket plugin + handler)
- Create: `/tests/server/yjs-sync.test.ts`

**Background for the engineer:** Yjs uses a binary wire protocol. Clients and servers exchange three kinds of messages (sync step 1, sync step 2, update) defined in `y-protocols/sync`, plus awareness messages (cursor position, user name) defined in `y-protocols/awareness`. The server's job is simple: decode each incoming message, apply any `update` to the authoritative server-side Y.Doc, and broadcast the message to all *other* connected clients in the same room.

- [ ] **Step 1: Write the failing integration test**

Create `tests/server/yjs-sync.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import { makeTestApp, resetDb } from "../helpers.js";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

async function connectYClient(url: string): Promise<{ ydoc: Y.Doc; ws: WebSocket }> {
  const ydoc = new Y.Doc();
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.on("message", (data: ArrayBuffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);
    if (messageType === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, null);
      if (encoding.length(encoder) > 1) {
        ws.send(encoding.toUint8Array(encoder));
      }
    }
  });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(encoding.toUint8Array(encoder));
    }
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      ws.send(encoding.toUint8Array(encoder));
      resolve();
    });
    ws.once("error", reject);
  });

  return { ydoc, ws };
}

describe("Yjs WebSocket sync", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let viewToken: string;
  let baseUrl: string;

  beforeAll(async () => {
    app = await makeTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address();
    if (typeof address === "string" || !address) throw new Error("bad address");
    baseUrl = `ws://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
    viewToken = body.permissions.viewToken;
  });

  it("rejects connections without a token", async () => {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`${baseUrl}/ws/${documentId}`);
      ws.on("unexpected-response", (_req, res) => {
        expect(res.statusCode).toBe(403);
        ws.terminate();
        resolve();
      });
      ws.on("error", () => resolve());
    });
  });

  it("accepts a connection with an edit token", async () => {
    const { ws } = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("syncs an edit from one client to another", async () => {
    const a = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    const b = await connectYClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);

    const textA = a.ydoc.getText("content");
    textA.insert(0, "hello");

    await new Promise((r) => setTimeout(r, 200));

    expect(b.ydoc.getText("content").toString()).toBe("hello");
    a.ws.close();
    b.ws.close();
  });
});
```

Install lib0 (used by the test):
```bash
pnpm add lib0
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
pnpm test tests/server/yjs-sync.test.ts
```
Expected: FAIL — WebSocket endpoint doesn't exist (connection rejected or 404).

- [ ] **Step 3: Create the Yjs handler**

Create `server/ws/yjs-handler.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import { validatePermissionToken } from "../auth/permission-token.js";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface Room {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<WebSocket>;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(docId: string): Room {
  let room = rooms.get(docId);
  if (!room) {
    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);
    room = { ydoc, awareness, connections: new Set() };
    rooms.set(docId, room);
  }
  return room;
}

function broadcast(room: Room, message: Uint8Array, exclude?: WebSocket) {
  for (const conn of room.connections) {
    if (conn === exclude) continue;
    if (conn.readyState === 1) conn.send(message);
  }
}

export function registerYjsHandler(app: FastifyInstance) {
  app.get<{ Params: { docId: string }; Querystring: { key?: string } }>(
    "/ws/:docId",
    { websocket: true },
    async (conn, req) => {
      const { docId } = req.params;
      const { key } = req.query;
      const socket = conn as unknown as WebSocket;

      const level = await validatePermissionToken(docId, key);
      if (!level) {
        socket.close(1008, "forbidden");
        return;
      }

      const canEdit = level === "edit";
      const room = getOrCreateRoom(docId);
      room.connections.add(socket);

      // Send sync step 1
      {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeSyncStep1(encoder, room.ydoc);
        socket.send(encoding.toUint8Array(encoder));
      }

      // Send current awareness states
      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            room.awareness,
            Array.from(awarenessStates.keys()),
          ),
        );
        socket.send(encoding.toUint8Array(encoder));
      }

      const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
        if (origin === socket) return;
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeUpdate(encoder, update);
        if (socket.readyState === 1) {
          socket.send(encoding.toUint8Array(encoder));
        }
      };
      room.ydoc.on("update", docUpdateHandler);

      const awarenessUpdateHandler = (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin === socket) return;
        const changed = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed),
        );
        if (socket.readyState === 1) {
          socket.send(encoding.toUint8Array(encoder));
        }
      };
      room.awareness.on("update", awarenessUpdateHandler);

      socket.on("message", (data: ArrayBuffer | Buffer) => {
        const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
        const decoder = decoding.createDecoder(buf);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === MSG_SYNC) {
          if (!canEdit) {
            // view-only clients may request sync step 1/2 but cannot send updates.
            // readSyncMessage handles all sync sub-types; for view-only we still respond
            // to step 1 but we do NOT apply updates.
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, MSG_SYNC);
            const subType = decoding.readVarUint(decoder);
            if (subType === syncProtocol.messageYjsSyncStep1) {
              // Reply with sync step 2 based on our state
              const state = decoding.readVarUint8Array(decoder);
              const encoder2 = encoding.createEncoder();
              encoding.writeVarUint(encoder2, MSG_SYNC);
              syncProtocol.writeSyncStep2(encoder2, room.ydoc, state);
              socket.send(encoding.toUint8Array(encoder2));
            }
            // ignore updates / sync step 2 from viewers
            return;
          }

          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, socket);
          if (encoding.length(encoder) > 1) {
            socket.send(encoding.toUint8Array(encoder));
          }

          // Re-broadcast the original update to peers so they stay in sync
          if (buf.length > 1) {
            broadcast(room, buf, socket);
          }
        } else if (messageType === MSG_AWARENESS) {
          const awarenessUpdate = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, socket);
        }
      });

      socket.on("close", () => {
        room.ydoc.off("update", docUpdateHandler);
        room.awareness.off("update", awarenessUpdateHandler);
        awarenessProtocol.removeAwarenessStates(
          room.awareness,
          [room.awareness.clientID],
          socket,
        );
        room.connections.delete(socket);
        if (room.connections.size === 0) {
          room.ydoc.destroy();
          room.awareness.destroy();
          rooms.delete(docId);
        }
      });
    },
  );
}
```

- [ ] **Step 4: Register the WebSocket plugin and handler**

Modify `server/index.ts`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { documentRoutes } from "./routes/documents.js";
import { projectAdminRoutes } from "./routes/project-admin.js";
import { registerYjsHandler } from "./ws/yjs-handler.js";

export async function buildServer() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { level: "info" } : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(websocket);
  await app.register(healthRoutes);
  await app.register(projectRoutes);
  await app.register(documentRoutes);
  await app.register(projectAdminRoutes);

  registerYjsHandler(app);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 5: Run the Yjs sync test**

```bash
pnpm test tests/server/yjs-sync.test.ts
```
Expected: 3 passing tests.

- [ ] **Step 6: Run the full suite as a sanity check**

```bash
pnpm test
```
Expected: every test passes.

- [ ] **Step 7: Commit**

```bash
git add server/ws/ server/index.ts tests/server/yjs-sync.test.ts package.json pnpm-lock.yaml
git commit -m "feat(ws): Yjs sync handler with permission-gated WebSocket"
```

---

## Task 10: Debounced Yjs persistence to Postgres

**Goal:** When clients edit, the server updates the in-memory Y.Doc AND debounces a write of the binary state to `Document.yjsState` in Postgres. On server restart (or first connection to an existing doc), the room loads the last persisted state.

**Files:**
- Create: `/server/ws/persistence.ts`
- Modify: `/server/ws/yjs-handler.ts` (load on room create, debounce on update)
- Create: `/tests/server/persistence.test.ts`

- [ ] **Step 1: Create the persistence module**

Create `server/ws/persistence.ts`:
```typescript
import * as Y from "yjs";
import { db } from "../db.js";

const DEBOUNCE_MS = 2_000;
const pending = new Map<string, NodeJS.Timeout>();

export async function loadDocState(docId: string): Promise<Uint8Array | null> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) return null;
  if (!doc.yjsState) return null;
  return new Uint8Array(doc.yjsState);
}

export function schedulePersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pending.delete(docId);
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await db.document.update({
        where: { id: docId },
        data: { yjsState: Buffer.from(state) },
      });
    } catch (err) {
      console.error("[persistence] failed to save Y.Doc for", docId, err);
    }
  }, DEBOUNCE_MS);

  pending.set(docId, timer);
}

export async function flushPersist(docId: string, ydoc: Y.Doc) {
  const existing = pending.get(docId);
  if (existing) {
    clearTimeout(existing);
    pending.delete(docId);
  }
  const state = Y.encodeStateAsUpdate(ydoc);
  await db.document.update({
    where: { id: docId },
    data: { yjsState: Buffer.from(state) },
  });
}
```

- [ ] **Step 2: Wire persistence into the Yjs handler**

Modify `server/ws/yjs-handler.ts` — replace the entire file with:
```typescript
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import { validatePermissionToken } from "../auth/permission-token.js";
import { loadDocState, schedulePersist, flushPersist } from "./persistence.js";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface Room {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<WebSocket>;
  persistListener: (update: Uint8Array) => void;
}

const rooms = new Map<string, Room>();

async function getOrCreateRoom(docId: string): Promise<Room> {
  let room = rooms.get(docId);
  if (room) return room;

  const ydoc = new Y.Doc();
  const existingState = await loadDocState(docId);
  if (existingState) Y.applyUpdate(ydoc, existingState);

  const awareness = new awarenessProtocol.Awareness(ydoc);
  const persistListener = () => schedulePersist(docId, ydoc);
  ydoc.on("update", persistListener);

  room = { ydoc, awareness, connections: new Set(), persistListener };
  rooms.set(docId, room);
  return room;
}

function broadcast(room: Room, message: Uint8Array, exclude?: WebSocket) {
  for (const conn of room.connections) {
    if (conn === exclude) continue;
    if (conn.readyState === 1) conn.send(message);
  }
}

export function registerYjsHandler(app: FastifyInstance) {
  app.get<{ Params: { docId: string }; Querystring: { key?: string } }>(
    "/ws/:docId",
    { websocket: true },
    async (conn, req) => {
      const { docId } = req.params;
      const { key } = req.query;
      const socket = conn as unknown as WebSocket;

      const level = await validatePermissionToken(docId, key);
      if (!level) {
        socket.close(1008, "forbidden");
        return;
      }

      const canEdit = level === "edit";
      const room = await getOrCreateRoom(docId);
      room.connections.add(socket);

      {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeSyncStep1(encoder, room.ydoc);
        socket.send(encoding.toUint8Array(encoder));
      }

      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            room.awareness,
            Array.from(awarenessStates.keys()),
          ),
        );
        socket.send(encoding.toUint8Array(encoder));
      }

      const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
        if (origin === socket) return;
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeUpdate(encoder, update);
        if (socket.readyState === 1) socket.send(encoding.toUint8Array(encoder));
      };
      room.ydoc.on("update", docUpdateHandler);

      const awarenessUpdateHandler = (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin === socket) return;
        const changed = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed),
        );
        if (socket.readyState === 1) socket.send(encoding.toUint8Array(encoder));
      };
      room.awareness.on("update", awarenessUpdateHandler);

      socket.on("message", (data: ArrayBuffer | Buffer) => {
        const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
        const decoder = decoding.createDecoder(buf);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === MSG_SYNC) {
          if (!canEdit) {
            const subType = decoding.readVarUint(decoder);
            if (subType === syncProtocol.messageYjsSyncStep1) {
              const state = decoding.readVarUint8Array(decoder);
              const encoder2 = encoding.createEncoder();
              encoding.writeVarUint(encoder2, MSG_SYNC);
              syncProtocol.writeSyncStep2(encoder2, room.ydoc, state);
              socket.send(encoding.toUint8Array(encoder2));
            }
            return;
          }

          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, socket);
          if (encoding.length(encoder) > 1) socket.send(encoding.toUint8Array(encoder));
          if (buf.length > 1) broadcast(room, buf, socket);
        } else if (messageType === MSG_AWARENESS) {
          const awarenessUpdate = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, socket);
        }
      });

      socket.on("close", async () => {
        room.ydoc.off("update", docUpdateHandler);
        room.awareness.off("update", awarenessUpdateHandler);
        awarenessProtocol.removeAwarenessStates(
          room.awareness,
          [room.awareness.clientID],
          socket,
        );
        room.connections.delete(socket);
        if (room.connections.size === 0) {
          try {
            await flushPersist(docId, room.ydoc);
          } finally {
            room.ydoc.off("update", room.persistListener);
            room.ydoc.destroy();
            room.awareness.destroy();
            rooms.delete(docId);
          }
        }
      });
    },
  );
}
```

- [ ] **Step 3: Write the failing persistence test**

Create `tests/server/persistence.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import { encoding, decoding } from "lib0";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

const MSG_SYNC = 0;

async function connectClient(url: string) {
  const ydoc = new Y.Doc();
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.on("message", (data: ArrayBuffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const mt = decoding.readVarUint(decoder);
    if (mt === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, null);
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder));
    }
  });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    if (ws.readyState === WebSocket.OPEN) ws.send(encoding.toUint8Array(encoder));
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      ws.send(encoding.toUint8Array(encoder));
      resolve();
    });
    ws.once("error", reject);
  });

  return { ydoc, ws };
}

describe("Yjs persistence", () => {
  let app: FastifyInstance;
  let documentId: string;
  let editToken: string;
  let baseUrl: string;

  beforeAll(async () => {
    app = await makeTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address();
    if (typeof addr === "string" || !addr) throw new Error("bad address");
    baseUrl = `ws://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
    const res = await app.inject({ method: "POST", url: "/api/projects" });
    const body = res.json();
    documentId = body.document.id;
    editToken = body.permissions.editToken;
  });

  it("persists Y.Doc state on disconnect", async () => {
    const client = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    client.ydoc.getText("content").insert(0, "persisted hello");

    await new Promise((r) => setTimeout(r, 300));
    client.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const doc = await db.document.findUnique({ where: { id: documentId } });
    expect(doc!.yjsState).not.toBeNull();
    expect(doc!.yjsState!.byteLength).toBeGreaterThan(0);

    // Rehydrate from saved state
    const restored = new Y.Doc();
    Y.applyUpdate(restored, new Uint8Array(doc!.yjsState!));
    expect(restored.getText("content").toString()).toBe("persisted hello");
  });

  it("rehydrates state on a new connection after all clients disconnected", async () => {
    const a = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    a.ydoc.getText("content").insert(0, "round trip");
    await new Promise((r) => setTimeout(r, 300));
    a.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const b = await connectClient(`${baseUrl}/ws/${documentId}?key=${editToken}`);
    await new Promise((r) => setTimeout(r, 300));
    expect(b.ydoc.getText("content").toString()).toBe("round trip");
    b.ws.close();
  });
});
```

- [ ] **Step 4: Run the persistence test**

```bash
pnpm test tests/server/persistence.test.ts
```
Expected: 2 passing tests.

- [ ] **Step 5: Run the full suite**

```bash
pnpm test
```
Expected: every test passes.

- [ ] **Step 6: Commit**

```bash
git add server/ws/ tests/server/persistence.test.ts
git commit -m "feat(ws): debounced Yjs state persistence to Postgres"
```

---

## Task 11: Vite + React client scaffolding

**Goal:** A Vite React app that builds, runs, has React Router set up with three routes (`/`, `/p/:projectId`, `/p/:projectId/d/:docId`), and proxies `/api` and `/ws` to the server.

**Files:**
- Create: `/vite.config.ts`
- Create: `/index.html`
- Create: `/src/main.tsx`
- Create: `/src/App.tsx`
- Create: `/src/routes/Home.tsx`
- Create: `/src/routes/Document.tsx`
- Create: `/src/routes/NotFound.tsx`
- Create: `/src/styles.css`

- [ ] **Step 1: Create Vite config**

Create `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/ws": { target: "ws://localhost:3001", ws: true },
    },
  },
});
```

- [ ] **Step 2: Create index.html**

Create `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Markdown Collaboration</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create minimal styles**

Create `src/styles.css`:
```css
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
  color: #111;
  background: #fff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

textarea {
  width: 100%;
  min-height: 60vh;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
```

- [ ] **Step 4: Create the root files**

Create `src/main.tsx`:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

Create `src/App.tsx`:
```typescript
import { Routes, Route, Navigate } from "react-router";
import Home from "./routes/Home";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/p/:projectId" element={<Navigate to="." replace />} />
      <Route path="/p/:projectId/d/:docId" element={<Document />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

Create `src/routes/Home.tsx`:
```typescript
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { method: "POST" });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const body = await res.json();
      // Persist creator token (done properly in Task 13)
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 16px" }}>
      <h1>Markdown Collaboration</h1>
      <p>Collaborative Markdown editor for spec teams.</p>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating…" : "Create new doc"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
```

Create `src/routes/Document.tsx`:
```typescript
export default function Document() {
  return (
    <main style={{ padding: 16 }}>
      <p>Loading editor…</p>
    </main>
  );
}
```

Create `src/routes/NotFound.tsx`:
```typescript
import { Link } from "react-router";

export default function NotFound() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Not found</h1>
      <Link to="/">Home</Link>
    </main>
  );
}
```

- [ ] **Step 5: Run the client**

In one terminal, ensure the server is running:
```bash
pnpm dev:server
```

In another:
```bash
pnpm dev:client
```

Open http://localhost:5173 — you should see the home page with a "Create new doc" button. Click it — it should POST to `/api/projects` (via the proxy) and navigate to `/p/:projectId/d/:docId?key=...`, which renders the "Loading editor…" placeholder.

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts index.html src/
git commit -m "feat(client): add Vite + React scaffolding with routing and create-doc flow"
```

---

## Task 12: Client API helper + creator-token localStorage

**Goal:** A typed `api` helper for `fetch` calls and a `creator-token` module that reads/writes to localStorage keyed by project id.

**Files:**
- Create: `/src/lib/api.ts`
- Create: `/src/lib/creator-token.ts`
- Modify: `/src/routes/Home.tsx` (use the helpers)
- Create: `/tests/client/creator-token.test.ts`

- [ ] **Step 1: Create creator-token helper**

Create `src/lib/creator-token.ts`:
```typescript
const PREFIX = "mdcollab:creator-token:";

export function storeCreatorToken(projectId: string, token: string) {
  localStorage.setItem(PREFIX + projectId, token);
}

export function getCreatorToken(projectId: string): string | null {
  return localStorage.getItem(PREFIX + projectId);
}

export function clearCreatorToken(projectId: string) {
  localStorage.removeItem(PREFIX + projectId);
}
```

- [ ] **Step 2: Create typed API helper**

Create `src/lib/api.ts`:
```typescript
import type {
  CreateProjectResponse,
  DocumentMetadataResponse,
} from "../../shared/types";

export async function createProject(): Promise<CreateProjectResponse> {
  const res = await fetch("/api/projects", { method: "POST" });
  if (!res.ok) throw new Error(`createProject failed: ${res.status}`);
  return (await res.json()) as CreateProjectResponse;
}

export async function getDocument(
  docId: string,
  key: string,
): Promise<DocumentMetadataResponse> {
  const res = await fetch(`/api/docs/${docId}?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`getDocument failed: ${res.status}`);
  return (await res.json()) as DocumentMetadataResponse;
}
```

- [ ] **Step 3: Update Home to use the helpers**

Modify `src/routes/Home.tsx` — replace the entire file with:
```typescript
import { useState } from "react";
import { useNavigate } from "react-router";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const body = await createProject();
      storeCreatorToken(body.project.id, body.creatorToken);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 16px" }}>
      <h1>Markdown Collaboration</h1>
      <p>Collaborative Markdown editor for spec teams.</p>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating…" : "Create new doc"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
```

- [ ] **Step 4: Write failing test for creator-token helpers**

Create `tests/client/creator-token.test.ts`:
```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  storeCreatorToken,
  getCreatorToken,
  clearCreatorToken,
} from "../../src/lib/creator-token";

describe("creator-token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves a token", () => {
    storeCreatorToken("abc", "token-123");
    expect(getCreatorToken("abc")).toBe("token-123");
  });

  it("isolates tokens per project id", () => {
    storeCreatorToken("a", "one");
    storeCreatorToken("b", "two");
    expect(getCreatorToken("a")).toBe("one");
    expect(getCreatorToken("b")).toBe("two");
  });

  it("returns null for unknown projects", () => {
    expect(getCreatorToken("missing")).toBeNull();
  });

  it("clears tokens", () => {
    storeCreatorToken("abc", "x");
    clearCreatorToken("abc");
    expect(getCreatorToken("abc")).toBeNull();
  });
});
```

Update `vitest.config.ts` to also pick up tests in `tests/client/`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "~": "/src",
      "@server": "/server",
      "@shared": "/shared",
    },
  },
});
```

- [ ] **Step 5: Run the test**

```bash
pnpm test tests/client/creator-token.test.ts
```
Expected: 4 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ src/routes/Home.tsx tests/client/ vitest.config.ts
git commit -m "feat(client): add API helpers and creator-token localStorage"
```

---

## Task 13: Yjs client + WebSocket provider + minimal textarea editor

**Goal:** `Document.tsx` connects to `/ws/:docId?key=...`, syncs a `Y.Text` named `content`, renders a textarea bound two-way to it, and disables the textarea in view-only mode.

**Files:**
- Create: `/src/lib/yjs-client.ts`
- Modify: `/src/routes/Document.tsx`

- [ ] **Step 1: Install y-websocket**

```bash
pnpm add y-websocket
```

(Already in package.json, but confirm it's installed.)

- [ ] **Step 2: Create Yjs client wrapper**

Create `src/lib/yjs-client.ts`:
```typescript
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export interface YjsConnection {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  destroy: () => void;
}

export function connect(docId: string, key: string): YjsConnection {
  const ydoc = new Y.Doc();
  const wsUrl = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`;
  const provider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: true,
    params: { key },
  });

  return {
    ydoc,
    provider,
    destroy: () => {
      provider.destroy();
      ydoc.destroy();
    },
  };
}
```

**Important detail about the y-websocket URL:** `WebsocketProvider(serverUrl, roomName, ydoc, options)` builds the URL as `${serverUrl}/${encodeURIComponent(roomName)}?<options.params>`. That's why we pass `key` via `params` instead of inlining `?key=...` in the roomName — y-websocket would URL-encode the `?` and `=` and the server would see a single opaque docId. Final URL: `ws://localhost:5173/ws/${docId}?key=${encodedKey}`, which the Vite proxy forwards to Fastify at port 3001.

- [ ] **Step 3: Build the Document route**

Modify `src/routes/Document.tsx` — replace the entire file with:
```typescript
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Navigate } from "react-router";
import * as Y from "yjs";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import type { PermissionLevel } from "@shared/types";

export default function DocumentRoute() {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [text, setText] = useState("");

  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const applyingRemote = useRef(false);

  // Validate permission via REST before opening WebSocket
  useEffect(() => {
    if (!docId || !key) {
      setLoadError("Missing doc id or key");
      return;
    }
    let cancelled = false;
    getDocument(docId, key)
      .then((res) => {
        if (!cancelled) setPermissionLevel(res.permissionLevel);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [docId, key]);

  // Open Yjs connection once we know permission is valid
  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const conn = connect(docId, key);
    connectionRef.current = conn;

    const yText = conn.ydoc.getText("content");
    yTextRef.current = yText;

    const updateText = () => {
      applyingRemote.current = true;
      setText(yText.toString());
      applyingRemote.current = false;
    };
    updateText();
    yText.observe(updateText);

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      yText.unobserve(updateText);
      conn.provider.off("status", handleStatus);
      conn.destroy();
      connectionRef.current = null;
      yTextRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (applyingRemote.current) return;
    const yText = yTextRef.current;
    if (!yText) return;
    const next = e.target.value;
    const current = yText.toString();
    // Minimal diff via full replace — fine for MVP textarea, TipTap will do proper deltas.
    yText.doc!.transact(() => {
      yText.delete(0, current.length);
      yText.insert(0, next);
    });
  }

  if (loadError) {
    return (
      <main style={{ padding: 16 }}>
        <h1>Can't open this document</h1>
        <p>{loadError}</p>
        <Navigate to="/" replace />
      </main>
    );
  }

  if (!permissionLevel) {
    return (
      <main style={{ padding: 16 }}>
        <p>Loading document…</p>
      </main>
    );
  }

  const readOnly = permissionLevel === "view";

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Document</h1>
        <span style={{ fontSize: 12, color: "#666" }}>
          {status} · {readOnly ? "view only" : "editing"}
        </span>
      </header>
      <textarea
        value={text}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={readOnly ? "" : "Start typing…"}
      />
    </main>
  );
}
```

- [ ] **Step 4: Manual end-to-end smoke test**

Start the server and client:
```bash
# terminal 1
pnpm dev:server
# terminal 2
pnpm dev:client
```

1. Open http://localhost:5173 in two different browsers (or two incognito windows).
2. In the first window, click "Create new doc." You're taken to the doc page.
3. Copy the full URL from the address bar and paste it into the second window.
4. Type in one window. The other window should update within ~200ms.
5. Close the server terminal (Ctrl-C). Start it again (`pnpm dev:server`).
6. Refresh both windows. The content you typed should still be there.
7. Modify the URL in one window: change the `key=...` to the view token (print it from the server log or look in the DB). The textarea should become `readOnly` and edits shouldn't propagate.

Expected: all five steps work as described. If any don't, debug before moving on — this is the core MVP loop.

- [ ] **Step 5: Commit**

```bash
git add src/lib/yjs-client.ts src/routes/Document.tsx package.json pnpm-lock.yaml
git commit -m "feat(client): connect Yjs provider and bind textarea to Y.Text"
```

---

## Task 14: End-to-end automated smoke test

**Goal:** An automated test using `jsdom` that exercises the full collab loop (create project → connect two Y clients → edit → verify sync → verify persistence after both disconnect). This is insurance against regressions as we add TipTap and commenting in later phases.

**Files:**
- Create: `/tests/e2e/collab-loop.test.ts`

- [ ] **Step 1: Write the end-to-end test**

Create `tests/e2e/collab-loop.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import { encoding, decoding } from "lib0";
import { makeTestApp, resetDb } from "../helpers.js";
import { db } from "../../server/db.js";

const MSG_SYNC = 0;

async function connectClient(url: string) {
  const ydoc = new Y.Doc();
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.on("message", (data: ArrayBuffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const mt = decoding.readVarUint(decoder);
    if (mt === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, null);
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder));
    }
  });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    if (ws.readyState === WebSocket.OPEN) ws.send(encoding.toUint8Array(encoder));
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      ws.send(encoding.toUint8Array(encoder));
      resolve();
    });
    ws.once("error", reject);
  });

  return { ydoc, ws };
}

describe("full collab loop", () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    app = await makeTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address();
    if (typeof addr === "string" || !addr) throw new Error("bad address");
    baseUrl = `ws://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("create → two clients edit → sync → persist → rehydrate in new client", async () => {
    const httpRes = await app.inject({ method: "POST", url: "/api/projects" });
    const project = httpRes.json();
    const docId = project.document.id;
    const editToken = project.permissions.editToken;

    const a = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const b = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);

    a.ydoc.getText("content").insert(0, "Alice wrote this. ");
    await new Promise((r) => setTimeout(r, 200));
    b.ydoc.getText("content").insert(b.ydoc.getText("content").length, "Bob added this.");
    await new Promise((r) => setTimeout(r, 200));

    expect(a.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    expect(b.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");

    a.ws.close();
    b.ws.close();
    await new Promise((r) => setTimeout(r, 500));

    const stored = await db.document.findUnique({ where: { id: docId } });
    expect(stored!.yjsState).not.toBeNull();
    expect(stored!.yjsState!.byteLength).toBeGreaterThan(0);

    const c = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    await new Promise((r) => setTimeout(r, 300));
    expect(c.ydoc.getText("content").toString()).toBe("Alice wrote this. Bob added this.");
    c.ws.close();
  });

  it("view-only client cannot apply updates", async () => {
    const httpRes = await app.inject({ method: "POST", url: "/api/projects" });
    const project = httpRes.json();
    const docId = project.document.id;
    const editToken = project.permissions.editToken;
    const viewToken = project.permissions.viewToken;

    const editor = await connectClient(`${baseUrl}/ws/${docId}?key=${editToken}`);
    const viewer = await connectClient(`${baseUrl}/ws/${docId}?key=${viewToken}`);

    editor.ydoc.getText("content").insert(0, "editor-only update");
    await new Promise((r) => setTimeout(r, 300));

    // Viewer sees the edit (because they successfully requested sync step 2)
    expect(viewer.ydoc.getText("content").toString()).toBe("editor-only update");

    // Viewer tries to write — server drops the update
    viewer.ydoc.getText("content").insert(0, "viewer tried ");
    await new Promise((r) => setTimeout(r, 300));

    // Editor should NOT see the viewer's write
    expect(editor.ydoc.getText("content").toString()).toBe("editor-only update");

    editor.ws.close();
    viewer.ws.close();
  });
});
```

- [ ] **Step 2: Run the e2e test**

```bash
pnpm test tests/e2e/collab-loop.test.ts
```
Expected: 2 passing tests.

- [ ] **Step 3: Run the full test suite**

```bash
pnpm test
```
Expected: every test passes (projects, documents, admin, permission-token, random, persistence, yjs-sync, creator-token, health, collab-loop). Somewhere around 30 tests total.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): add full collab loop smoke test"
```

---

## Task 15: Typecheck + lint + CI-ready scripts

**Goal:** `pnpm typecheck` and `pnpm lint` pass cleanly. Phase 1 is complete.

**Files:**
- Create: `/eslint.config.mjs`

- [ ] **Step 1: Create ESLint config**

Create `eslint.config.mjs`:
```javascript
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "build/**", "node_modules/**", "prisma/generated/**", ".vite/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```
Expected: exits 0 with no errors. If there are errors, fix them. Common issues:
- Missing types on function parameters → add them.
- Unused imports → remove.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```
Expected: exits 0 or with only warnings. Fix any errors.

- [ ] **Step 4: Run the full test suite one more time**

```bash
pnpm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: add ESLint config and typecheck scripts"
```

- [ ] **Step 6: Tag Phase 1 completion**

```bash
git tag phase-1-complete
```

---

## What's Next (Future Phases)

After Phase 1 ships:

- **Phase 2: Editor UI** — TipTap + inline Markdown decorations, Edit/Preview toggle, markdown-it + DOMPurify rendering, shadcn/ui component setup, Tailwind, dark/light mode toggle. Replaces the textarea from Task 13.

- **Phase 3: Commenting** — Text-selection action framework, CriticMarkup extension port from Mist, comment thread `Y.Map` storage, sidebar UI with synchronized scroll, resolve/hide flows.

- **Phase 4: Polish + Ship** — Version history (snapshots table is ready; add snapshot trigger + UI + restore), Markdown export with YAML frontmatter for threads, name-entry UX polish, empty states, reconnection toast, dark mode polish, Fly.io deployment config.

Each phase gets its own plan in `docs/plans/`. Do not start Phase 2 until Phase 1 is green on CI and a human has clicked through the manual smoke test in Task 13 Step 4.

---

## Spec Coverage Audit

Checking this plan against `docs/mvp-spec.md`:

| Spec requirement | Covered by |
|---|---|
| Name-entry session | Phase 2/4 (not in this plan — MVP feature 1) |
| Create new doc | Tasks 5, 11, 12 |
| TipTap editor with inline decorations | Phase 2 (explicitly deferred) |
| Edit / Preview toggle | Phase 2 |
| Real-time co-editing + cursor presence | Task 9 (sync), Task 13 (client) |
| WebSocket reconnection | y-websocket provides this out of the box (used in Task 13) |
| CommonMark + GFM | Phase 2 |
| Text-anchored commenting | Phase 3 |
| Comment replies + resolve | Phase 3 |
| Version history | Phase 4 (snapshots table created in Task 2) |
| Permissions by link type | Tasks 5, 6, 7 |
| Project → documents hierarchy | Task 2 (schema) |
| Markdown export | Phase 4 |
| Dark + light mode | Phase 2 |
| Text-selection action framework | Phase 3 |
| Data model (Project, Document, Snapshot, Permission) | Task 2 |
| Creator token mechanics | Tasks 5, 8, 12 |
| URL structure `/p/:projectId/d/:docId?key=...` | Tasks 11, 13 |
| Permission matrix | Tasks 6, 7, 8, 9, 13 |

All Phase 1 spec items are covered. Everything deferred to Phase 2/3/4 is explicitly listed.
