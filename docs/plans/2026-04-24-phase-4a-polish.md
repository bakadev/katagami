# Phase 4a: Polish + Version History + Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Phase 3 MVP into a polished, demo-ready product by landing the polished header, tabbed right panel, version history, avatar dropdown, Sonner toasts, markdown export, and theme tri-state. UI polish quality is the primary success bar.

**Architecture:**
- Backend gets a title-PATCH endpoint, a `/snapshots` REST surface, and a server-side idle-snapshot timer (5 min, rolling 20 autos + unlimited named).
- Frontend gets a new `DocHeader` + `RightPanel` composition. Panel hosts 4 tabs (Documents stub / Comments / AI stub / History) with animated width transitions.
- Theme upgrades to tri-state (`light` / `dark` / `system`) with live matchMedia response.
- Sonner replaces ad-hoc status messaging for connection changes, snapshots, and remote comment activity.

**Tech stack:** Fastify + Prisma 5 + Postgres · Yjs (y-websocket) · React 19 + Vite + React Router 7 · Tailwind 4 + shadcn/ui (Nova) · TipTap 3 · Sonner · Vitest + React Testing Library.

**Depends on:** Phase 3 complete (tag `phase-3-complete`). Work on branch `phase-4a-polish` (create if missing).

**Mandate — every UI task:**
1. Use shadcn MCP (`mcp__shadcn__get_add_command_for_items`) before installing shadcn components.
2. Invoke the `frontend-design:frontend-design` skill when crafting visual design for: DocHeader, PanelTabs, AvatarDropdown, RenameModal, SnapshotCard, empty states, Sonner toast variants. Explicitly called out per task below.
3. Run `mcp__shadcn__get_audit_checklist` as part of the final task.

---

## File Structure

**New files (server):**
- `prisma/migrations/<timestamp>_snapshot_name/migration.sql` — add `name` column
- `server/routes/snapshots.ts` — REST endpoints (list, create, restore, rename, delete)
- `server/ws/snapshot-timer.ts` — idle timer + rolling buffer + .unref() timer

**Modified files (server):**
- `prisma/schema.prisma` — add `name String?` to `Snapshot`
- `server/routes/documents.ts` — add `PATCH /api/docs/:id` for title
- `server/ws/yjs-handler.ts` — hook into the edit firehose to reset the idle timer
- `server/index.ts` — register new routes
- `shared/types.ts` — extend with snapshot types and title patch payload

**New files (client — utilities/hooks):**
- `src/lib/api/snapshots.ts` — fetch helpers for snapshot endpoints
- `src/lib/api/documents.ts` — fetch helper for title PATCH
- `src/lib/export/markdown-download.ts` — editor → Blob → download
- `src/hooks/useRelativeTime.ts` — re-renders every 60s
- `src/hooks/useSnapshots.ts` — poll every 30s while mounted
- `src/hooks/usePanelVisibility.ts` — localStorage-backed bool + active-tab

**New files (client — components):**
- `src/components/header/DocHeader.tsx`
- `src/components/header/TitleEditor.tsx`
- `src/components/header/MetaLine.tsx`
- `src/components/header/SaveSnapshotButton.tsx`
- `src/components/header/PanelToggle.tsx`
- `src/components/header/AvatarButton.tsx`
- `src/components/avatar-menu/AvatarDropdown.tsx`
- `src/components/avatar-menu/ThemeTriState.tsx`
- `src/components/avatar-menu/RenameModal.tsx`
- `src/components/panel/RightPanel.tsx`
- `src/components/panel/PanelTabs.tsx`
- `src/components/panel/tabs/DocsTab.tsx`
- `src/components/panel/tabs/CommentsTab.tsx`
- `src/components/panel/tabs/AiTab.tsx`
- `src/components/panel/tabs/HistoryTab.tsx`
- `src/components/history/SnapshotList.tsx`
- `src/components/history/SnapshotCard.tsx`
- `src/components/history/SnapshotPreview.tsx`

**Modified files (client):**
- `src/routes/Document.tsx` — recompose around `DocHeader` + `RightPanel`; keep the selection-action registration and comment composer plumbing, but pass handlers down to `CommentsTab`
- `src/lib/theme/ThemeProvider.tsx` — upgrade to tri-state
- `src/lib/theme/useTheme.ts` — update signature
- `src/main.tsx` — mount `<Toaster />`
- `src/lib/api.ts` — (leave, or re-export from new `api/` subfolder)

**Removed files (client):**
- `src/components/comments/CommentChip.tsx`
- `src/components/comments/CommentSidebar.tsx`
- `src/lib/theme/ThemeToggle.tsx`

**New test files:**
- `tests/server/snapshots.test.ts` (~8)
- `tests/server/snapshot-timer.test.ts` (~4)
- `tests/server/title-patch.test.ts` (merged into `documents.test.ts`) (~3)
- `tests/client/title-editor.test.tsx` (~5)
- `tests/client/use-relative-time.test.tsx` (~3)
- `tests/client/use-snapshots.test.tsx` (~3)
- `tests/client/avatar-dropdown.test.tsx` (~3)
- `tests/client/markdown-download.test.ts` (~3)
- `tests/client/panel-tabs.test.tsx` (~3)
- `tests/client/comments-tab.test.tsx` (~3)
- `tests/client/sonner-toasts.test.tsx` (~2)

Extended tests:
- `tests/client/theme-provider.test.tsx` — +3 (tri-state)
- `tests/client/threads.test.ts` — carries forward
- `tests/client/document-route.test.tsx` — adjust selectors for new DOM

---

### Task 1: Schema migration — add `Snapshot.name`

**Files:**
- Modify: `prisma/schema.prisma` (line 33-42, `Snapshot` model)
- Create: `prisma/migrations/<timestamp>_snapshot_name/migration.sql`
- Modify: `shared/types.ts` (add `SnapshotRecord`, `ListSnapshotsResponse`, `CreateSnapshotRequest`, `RenameSnapshotRequest`)

- [ ] **Step 1: Check out the work branch**

```bash
git checkout -b phase-4a-polish
git status
```
Expected: on `phase-4a-polish`, clean working tree.

- [ ] **Step 2: Add `name` column to Prisma schema**

Edit `prisma/schema.prisma`, update the `Snapshot` model:

```prisma
model Snapshot {
  id           String    @id @default(uuid()) @db.Uuid
  documentId   String    @map("document_id") @db.Uuid
  yjsState     Bytes     @map("yjs_state")
  takenAt      DateTime  @default(now()) @map("taken_at")
  takenByName  String?   @map("taken_by_name")
  name         String?

  document     Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("snapshots")
  @@index([documentId, takenAt])
  @@index([documentId, name])
}
```

- [ ] **Step 3: Generate the migration**

```bash
pnpm db:migrate --name snapshot_name
```
Expected: new migration folder created under `prisma/migrations/`, `prisma generate` re-runs, no errors.

- [ ] **Step 4: Add shared types**

Append to `shared/types.ts`:

```typescript
export interface SnapshotRecord {
  id: string;
  name: string | null;       // null = auto-snapshot
  takenAt: string;           // ISO
  takenByName: string | null;
  preview: string;           // up to 120 chars of plaintext
}

export interface ListSnapshotsResponse {
  snapshots: SnapshotRecord[];
}

export interface CreateSnapshotRequest {
  name?: string;
}

export interface RenameSnapshotRequest {
  name: string;
}

export interface UpdateDocumentRequest {
  title?: string | null;
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations shared/types.ts
git commit -m "feat(db): add Snapshot.name column + shared snapshot types"
```

---

### Task 2: Title PATCH endpoint

**Files:**
- Modify: `server/routes/documents.ts`
- Create test: `tests/server/documents.test.ts` additions (existing file)

- [ ] **Step 1: Write failing test in `tests/server/documents.test.ts`**

Add a `describe("PATCH /api/docs/:id")` block with four cases:

```typescript
describe("PATCH /api/docs/:id", () => {
  it("updates title when caller has edit token", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}?key=${editToken}`,
      payload: { title: "Spec v1" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.title).toBe("Spec v1");
  });

  it("rejects with 403 when caller has view-only token", async () => {
    const app = await buildTestApp();
    const { docId, viewToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}?key=${viewToken}`,
      payload: { title: "hacked" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("rejects titles longer than 120 chars", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}?key=${editToken}`,
      payload: { title: "a".repeat(121) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts null to clear the title", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}?key=${editToken}`,
      payload: { title: "Hello" },
    });
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}?key=${editToken}`,
      payload: { title: null },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe(null);
  });
});
```

If `buildTestApp` / `createTestDoc` helpers don't already exist in a shared test module, reuse the existing pattern in `tests/server/documents.test.ts` (mirror the POST/GET tests directly above).

- [ ] **Step 2: Run test (expect failure)**

```bash
pnpm test tests/server/documents.test.ts
```
Expected: FAIL — `PATCH` route not yet defined (likely 404 or route-not-found).

- [ ] **Step 3: Implement the PATCH handler**

In `server/routes/documents.ts`, add a handler alongside the existing GET. Follow the same structure used for the existing GET endpoint (same auth helper, same `key` query pattern). Sketch:

```typescript
app.patch<{
  Params: { id: string };
  Querystring: { key?: string };
  Body: UpdateDocumentRequest;
}>("/api/docs/:id", async (req, reply) => {
  const { id } = req.params;
  const { key } = req.query;
  if (!key) return reply.code(400).send({ error: "missing key" });

  const perm = await getPermissionForToken(key);
  if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });
  if (perm.level !== "edit") return reply.code(403).send({ error: "view only" });

  const { title } = req.body ?? {};
  if (title !== null && title !== undefined) {
    if (typeof title !== "string") return reply.code(400).send({ error: "title must be string or null" });
    if (title.length > 120) return reply.code(400).send({ error: "title too long" });
  }

  const doc = await prisma.document.update({
    where: { id },
    data: { title: title ?? null },
  });
  return reply.send({ id: doc.id, title: doc.title, updatedAt: doc.updatedAt.toISOString() });
});
```

Reuse the existing `getPermissionForToken` helper in `server/routes/documents.ts` (or matching name) — don't duplicate auth logic. If the existing GET uses a different idiom (e.g. prefix handler), match it.

- [ ] **Step 4: Re-run test**

```bash
pnpm test tests/server/documents.test.ts
```
Expected: all 4 new tests PASS; no regressions in the existing tests.

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/documents.ts tests/server/documents.test.ts
git commit -m "feat(server): PATCH /api/docs/:id for title updates"
```

---

### Task 3: Snapshot list + manual-create endpoints

**Files:**
- Create: `server/routes/snapshots.ts`
- Modify: `server/index.ts` (register route)
- Modify: `server/ws/yjs-handler.ts` (or wherever the current Y.Doc live-state registry lives) — export a `getLiveYDoc(docId)` helper if one doesn't already exist, so snapshot creation captures the authoritative current state.
- Create: `tests/server/snapshots.test.ts`

- [ ] **Step 1: Write failing tests** — create `tests/server/snapshots.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildTestApp, createTestDoc } from "./helpers";

describe("GET /api/docs/:id/snapshots", () => {
  it("returns empty list for a new doc (any valid token)", async () => {
    const app = await buildTestApp();
    const { docId, viewToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${docId}/snapshots?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().snapshots).toEqual([]);
  });

  it("rejects with 403 when token doesn't match document", async () => {
    const app = await buildTestApp();
    const { docId } = await createTestDoc(app);
    const res = await app.inject({
      method: "GET",
      url: `/api/docs/${docId}/snapshots?key=wrong-token`,
    });
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  it("returns snapshots newest-first", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: { name: "A" } });
    await new Promise((r) => setTimeout(r, 10));
    await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: { name: "B" } });
    const res = await app.inject({ method: "GET", url: `/api/docs/${docId}/snapshots?key=${editToken}` });
    const names = res.json().snapshots.map((s: { name: string }) => s.name);
    expect(names).toEqual(["B", "A"]);
  });
});

describe("POST /api/docs/:id/snapshots", () => {
  it("creates a named snapshot with edit token", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${docId}/snapshots?key=${editToken}`,
      payload: { name: "v1" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("v1");
  });

  it("rejects named snapshot creation with view token", async () => {
    const app = await buildTestApp();
    const { docId, viewToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${docId}/snapshots?key=${viewToken}`,
      payload: { name: "v1" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("accepts empty body to create an unnamed snapshot (auto-style, but manually triggered)", async () => {
    // NOTE: in practice, manual creates always carry a name. But if omitted we treat the snapshot
    // like an auto-snapshot (name = null). This keeps the same endpoint useful for the idle timer.
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${docId}/snapshots?key=${editToken}`,
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe(null);
  });
});
```

If `tests/server/helpers.ts` doesn't exist, create it with `buildTestApp()` (returns a fresh Fastify app) and `createTestDoc(app)` (returns `{ docId, editToken, viewToken }`). Pattern-match the existing `tests/server/documents.test.ts` for how to build the app.

- [ ] **Step 2: Run tests (expect failure)**

```bash
pnpm test tests/server/snapshots.test.ts
```
Expected: FAIL (routes not defined).

- [ ] **Step 3: Implement `server/routes/snapshots.ts`**

```typescript
import type { FastifyInstance } from "fastify";
import * as Y from "yjs";
import { prisma } from "../db.js";
import { getPermissionForToken } from "./documents.js"; // or wherever the helper lives
import { getLiveYDoc } from "../ws/yjs-handler.js"; // add this export if missing
import type { CreateSnapshotRequest, SnapshotRecord } from "../../shared/types.js";

const PREVIEW_MAX = 120;

function previewFromState(state: Uint8Array): string {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, state);
  const frag = ydoc.getXmlFragment("tiptap");
  const text = frag.toString().replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.slice(0, PREVIEW_MAX);
}

function toRecord(row: {
  id: string;
  name: string | null;
  takenAt: Date;
  takenByName: string | null;
  yjsState: Buffer;
}): SnapshotRecord {
  return {
    id: row.id,
    name: row.name,
    takenAt: row.takenAt.toISOString(),
    takenByName: row.takenByName,
    preview: previewFromState(new Uint8Array(row.yjsState)),
  };
}

export function registerSnapshotRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { key?: string } }>(
    "/api/docs/:id/snapshots",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;
      if (!key) return reply.code(400).send({ error: "missing key" });
      const perm = await getPermissionForToken(key);
      if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });

      const rows = await prisma.snapshot.findMany({
        where: { documentId: id },
        orderBy: { takenAt: "desc" },
      });
      return { snapshots: rows.map(toRecord) };
    },
  );

  app.post<{ Params: { id: string }; Querystring: { key?: string }; Body: CreateSnapshotRequest }>(
    "/api/docs/:id/snapshots",
    async (req, reply) => {
      const { id } = req.params;
      const { key } = req.query;
      if (!key) return reply.code(400).send({ error: "missing key" });
      const perm = await getPermissionForToken(key);
      if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });
      if (perm.level !== "edit") return reply.code(403).send({ error: "view only" });

      const name = req.body?.name?.trim() || null;
      if (name !== null && name.length > 80) {
        return reply.code(400).send({ error: "name too long" });
      }

      // Capture current live state if possible, else fall back to persisted.
      const live = getLiveYDoc(id);
      let state: Uint8Array;
      if (live) {
        state = Y.encodeStateAsUpdate(live);
      } else {
        const doc = await prisma.document.findUnique({ where: { id } });
        state = doc?.yjsState ? new Uint8Array(doc.yjsState) : new Uint8Array();
      }

      const row = await prisma.snapshot.create({
        data: {
          documentId: id,
          yjsState: Buffer.from(state),
          name,
          takenByName: null, // name-less auth in 4a; attribute via cookie later
        },
      });
      return reply.code(201).send(toRecord(row));
    },
  );
}
```

If `server/ws/yjs-handler.ts` doesn't already expose the live Y.Doc registry, add a small exported map:

```typescript
// server/ws/yjs-handler.ts (add near the top-level state)
const liveDocs = new Map<string, Y.Doc>();
export function getLiveYDoc(docId: string): Y.Doc | null {
  return liveDocs.get(docId) ?? null;
}
// ...and inside the handler, ensure liveDocs.set(docId, ydoc) / .delete(docId) are called
// at connect-first / disconnect-last boundaries.
```

If it already exposes something equivalent, use that instead — don't duplicate.

- [ ] **Step 4: Register routes in `server/index.ts`**

```typescript
import { registerSnapshotRoutes } from "./routes/snapshots.js";
// ...after documents is registered:
registerSnapshotRoutes(app);
```

- [ ] **Step 5: Re-run tests**

```bash
pnpm test tests/server/snapshots.test.ts
```
Expected: all 6 tests PASS; no regressions in other server tests.

- [ ] **Step 6: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add server/routes/snapshots.ts server/index.ts server/ws/yjs-handler.ts tests/server/snapshots.test.ts tests/server/helpers.ts
git commit -m "feat(server): GET + POST /api/docs/:id/snapshots"
```

---

### Task 4: Snapshot restore + rename + delete endpoints

**Files:**
- Modify: `server/routes/snapshots.ts`
- Modify: `server/ws/yjs-handler.ts` (apply restored state to live Y.Doc via `Y.applyUpdate`)
- Extend: `tests/server/snapshots.test.ts`

- [ ] **Step 1: Write failing tests** — append to `tests/server/snapshots.test.ts`:

```typescript
describe("POST /api/docs/:id/snapshots/:snapId/restore", () => {
  it("creates a pre-restore auto-snapshot before applying the restore", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const first = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: { name: "v1" } });
    const snapId = first.json().id;
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${docId}/snapshots/${snapId}/restore?key=${editToken}`,
    });
    expect(res.statusCode).toBe(200);
    const list = await app.inject({ method: "GET", url: `/api/docs/${docId}/snapshots?key=${editToken}` });
    const names = list.json().snapshots.map((s: { name: string | null }) => s.name);
    // Should include: pre-restore (null), v1 (still named)
    expect(names).toContain("v1");
    expect(names.filter((n: string | null) => n === null).length).toBeGreaterThanOrEqual(1);
  });

  it("rejects restore with view token", async () => {
    const app = await buildTestApp();
    const { docId, editToken, viewToken } = await createTestDoc(app);
    const first = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: { name: "v1" } });
    const snapId = first.json().id;
    const res = await app.inject({
      method: "POST",
      url: `/api/docs/${docId}/snapshots/${snapId}/restore?key=${viewToken}`,
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("PATCH /api/docs/:id/snapshots/:snapId (rename)", () => {
  it("promotes an auto-snapshot to named", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const create = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: {} });
    const snapId = create.json().id;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: "Promoted" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Promoted");
  });

  it("rejects empty name string", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const create = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: {} });
    const snapId = create.json().id;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/docs/${docId}/snapshots/${snapId}?key=${editToken}`,
      payload: { name: "  " },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/docs/:id/snapshots/:snapId", () => {
  it("deletes a named snapshot", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const create = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: { name: "deleteme" } });
    const snapId = create.json().id;
    const res = await app.inject({
      method: "DELETE",
      url: `/api/docs/${docId}/snapshots/${snapId}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(204);
    const list = await app.inject({ method: "GET", url: `/api/docs/${docId}/snapshots?key=${editToken}` });
    expect(list.json().snapshots.find((s: { id: string }) => s.id === snapId)).toBeUndefined();
  });

  it("rejects deleting an auto-snapshot", async () => {
    const app = await buildTestApp();
    const { docId, editToken } = await createTestDoc(app);
    const create = await app.inject({ method: "POST", url: `/api/docs/${docId}/snapshots?key=${editToken}`, payload: {} });
    const snapId = create.json().id;
    const res = await app.inject({
      method: "DELETE",
      url: `/api/docs/${docId}/snapshots/${snapId}?key=${editToken}`,
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

```bash
pnpm test tests/server/snapshots.test.ts
```
Expected: FAIL (new endpoints not implemented).

- [ ] **Step 3: Implement the 3 endpoints** — append to `registerSnapshotRoutes`:

```typescript
app.post<{ Params: { id: string; snapId: string }; Querystring: { key?: string } }>(
  "/api/docs/:id/snapshots/:snapId/restore",
  async (req, reply) => {
    const { id, snapId } = req.params;
    const { key } = req.query;
    if (!key) return reply.code(400).send({ error: "missing key" });
    const perm = await getPermissionForToken(key);
    if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });
    if (perm.level !== "edit") return reply.code(403).send({ error: "view only" });

    const target = await prisma.snapshot.findUnique({ where: { id: snapId } });
    if (!target || target.documentId !== id) return reply.code(404).send({ error: "snapshot not found" });

    // 1) Take a pre-restore auto-snapshot of the current live state
    const live = getLiveYDoc(id);
    const currentState = live
      ? Y.encodeStateAsUpdate(live)
      : new Uint8Array((await prisma.document.findUnique({ where: { id } }))?.yjsState ?? new Uint8Array());

    const preRestore = await prisma.snapshot.create({
      data: {
        documentId: id,
        yjsState: Buffer.from(currentState),
        name: null,
      },
    });

    // 2) Apply target state to the live Y.Doc (replaces content via a transactional overwrite)
    if (live) {
      applySnapshotToLiveDoc(live, new Uint8Array(target.yjsState));
    } else {
      await prisma.document.update({
        where: { id },
        data: { yjsState: target.yjsState },
      });
    }

    return { restoredSnapshotId: snapId, preRestoreSnapshotId: preRestore.id };
  },
);

app.patch<{ Params: { id: string; snapId: string }; Querystring: { key?: string }; Body: { name?: string } }>(
  "/api/docs/:id/snapshots/:snapId",
  async (req, reply) => {
    const { id, snapId } = req.params;
    const { key } = req.query;
    if (!key) return reply.code(400).send({ error: "missing key" });
    const perm = await getPermissionForToken(key);
    if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });
    if (perm.level !== "edit") return reply.code(403).send({ error: "view only" });

    const name = req.body?.name?.trim();
    if (!name) return reply.code(400).send({ error: "name required" });
    if (name.length > 80) return reply.code(400).send({ error: "name too long" });

    const row = await prisma.snapshot.update({
      where: { id: snapId },
      data: { name },
    });
    return toRecord(row);
  },
);

app.delete<{ Params: { id: string; snapId: string }; Querystring: { key?: string } }>(
  "/api/docs/:id/snapshots/:snapId",
  async (req, reply) => {
    const { id, snapId } = req.params;
    const { key } = req.query;
    if (!key) return reply.code(400).send({ error: "missing key" });
    const perm = await getPermissionForToken(key);
    if (!perm || perm.documentId !== id) return reply.code(404).send({ error: "not found" });
    if (perm.level !== "edit") return reply.code(403).send({ error: "view only" });

    const target = await prisma.snapshot.findUnique({ where: { id: snapId } });
    if (!target || target.documentId !== id) return reply.code(404).send({ error: "snapshot not found" });
    if (target.name === null) return reply.code(400).send({ error: "auto-snapshots cannot be deleted manually" });

    await prisma.snapshot.delete({ where: { id: snapId } });
    return reply.code(204).send();
  },
);
```

Add to `server/ws/yjs-handler.ts` (near the live-docs registry):

```typescript
export function applySnapshotToLiveDoc(ydoc: Y.Doc, snapshotState: Uint8Array) {
  // Clear the current content first, then apply the snapshot state.
  // Using Y.applyUpdate with the snapshot state merges via CRDT rules; for a true "restore" we want
  // the live doc's visible content to match the snapshot. A minimal approach: replace the tiptap
  // fragment contents.
  const frag = ydoc.getXmlFragment("tiptap");
  ydoc.transact(() => {
    frag.delete(0, frag.length);
    const temp = new Y.Doc();
    Y.applyUpdate(temp, snapshotState);
    const srcFrag = temp.getXmlFragment("tiptap");
    // Clone each child into the live fragment
    for (let i = 0; i < srcFrag.length; i++) {
      const child = srcFrag.get(i);
      if (child instanceof Y.XmlElement || child instanceof Y.XmlText) {
        frag.insert(frag.length, [child.clone() as Y.XmlElement | Y.XmlText]);
      }
    }
  });
}
```

Note on the restore semantics: this is an approximation. Perfect CRDT "replay with same history" isn't a thing — what we do here is replace the editor fragment's children, which is the pragmatic choice most collab editors use. All connected clients observe the change as a normal edit event and their editors update. The pre-restore auto-snapshot is what makes Undo work.

- [ ] **Step 4: Re-run tests**

```bash
pnpm test tests/server/snapshots.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/snapshots.ts server/ws/yjs-handler.ts tests/server/snapshots.test.ts
git commit -m "feat(server): snapshot restore, rename, delete endpoints"
```

---

### Task 5: Idle-snapshot timer (server-side)

**Files:**
- Create: `server/ws/snapshot-timer.ts`
- Modify: `server/ws/yjs-handler.ts` — call `resetIdleTimer(docId)` on every incoming update
- Create: `tests/server/snapshot-timer.test.ts`

**Behavior:**
- 5 min of no edits → auto-create a snapshot with `name = null`
- Rolling buffer of 20 auto-snapshots per doc: when a new auto-snapshot is created, delete the oldest if count > 20. Named snapshots NEVER count toward the 20 and are NEVER deleted by the timer.
- Timer uses `setTimeout(..., IDLE_MS).unref()` so test teardown doesn't hang
- When a doc transitions from "has live clients" to "no live clients", clear its timer (prevents background growth on idle rooms that have no editor sessions)

- [ ] **Step 1: Write failing tests** in `tests/server/snapshot-timer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../../server/db.js";
import { buildTestApp, createTestDoc } from "./helpers";
import {
  resetIdleTimer,
  clearIdleTimer,
  __setIdleMsForTests,
  triggerIdleSnapshotForTests,
} from "../../server/ws/snapshot-timer.js";

beforeEach(() => {
  __setIdleMsForTests(50);
});

afterEach(() => {
  __setIdleMsForTests(5 * 60 * 1000);
});

describe("idle snapshot timer", () => {
  it("creates an auto-snapshot after the idle window expires", async () => {
    const app = await buildTestApp();
    const { docId } = await createTestDoc(app);
    resetIdleTimer(docId);
    await new Promise((r) => setTimeout(r, 150));
    const snaps = await prisma.snapshot.findMany({ where: { documentId: docId } });
    expect(snaps.length).toBe(1);
    expect(snaps[0].name).toBe(null);
  });

  it("rolling buffer: keeps only the latest 20 auto-snapshots", async () => {
    const app = await buildTestApp();
    const { docId } = await createTestDoc(app);
    for (let i = 0; i < 25; i++) {
      await triggerIdleSnapshotForTests(docId);
    }
    const autos = await prisma.snapshot.findMany({
      where: { documentId: docId, name: null },
    });
    expect(autos.length).toBe(20);
  });

  it("does NOT delete named snapshots as part of rolling buffer", async () => {
    const app = await buildTestApp();
    const { docId } = await createTestDoc(app);
    // Create 1 named first
    await prisma.snapshot.create({
      data: { documentId: docId, name: "keep me", yjsState: Buffer.from([]) },
    });
    for (let i = 0; i < 25; i++) {
      await triggerIdleSnapshotForTests(docId);
    }
    const named = await prisma.snapshot.findMany({
      where: { documentId: docId, name: { not: null } },
    });
    expect(named.length).toBe(1);
    expect(named[0].name).toBe("keep me");
  });

  it("clearIdleTimer cancels a pending snapshot", async () => {
    const app = await buildTestApp();
    const { docId } = await createTestDoc(app);
    resetIdleTimer(docId);
    clearIdleTimer(docId);
    await new Promise((r) => setTimeout(r, 150));
    const snaps = await prisma.snapshot.findMany({ where: { documentId: docId } });
    expect(snaps.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

```bash
pnpm test tests/server/snapshot-timer.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `server/ws/snapshot-timer.ts`**

```typescript
import * as Y from "yjs";
import { prisma } from "../db.js";
import { getLiveYDoc } from "./yjs-handler.js";

let IDLE_MS = 5 * 60 * 1000;
const MAX_AUTO_PER_DOC = 20;

const timers = new Map<string, NodeJS.Timeout>();

export function __setIdleMsForTests(ms: number) {
  IDLE_MS = ms;
}

export function resetIdleTimer(docId: string) {
  clearIdleTimer(docId);
  const t = setTimeout(() => {
    timers.delete(docId);
    void createAutoSnapshot(docId).catch((err) => {
      // Never crash the WS handler because a snapshot write failed.
      // Log and move on; next idle window will try again.
      // eslint-disable-next-line no-console
      console.error("[snapshot-timer] auto-snapshot failed", docId, err);
    });
  }, IDLE_MS);
  // .unref() so test teardown doesn't hang waiting on the timer
  if (typeof t.unref === "function") t.unref();
  timers.set(docId, t);
}

export function clearIdleTimer(docId: string) {
  const t = timers.get(docId);
  if (t) {
    clearTimeout(t);
    timers.delete(docId);
  }
}

export async function triggerIdleSnapshotForTests(docId: string) {
  await createAutoSnapshot(docId);
}

async function createAutoSnapshot(docId: string) {
  const live = getLiveYDoc(docId);
  let state: Uint8Array;
  if (live) {
    state = Y.encodeStateAsUpdate(live);
  } else {
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return;
    state = doc.yjsState ? new Uint8Array(doc.yjsState) : new Uint8Array();
  }

  await prisma.snapshot.create({
    data: {
      documentId: docId,
      yjsState: Buffer.from(state),
      name: null,
    },
  });

  // Rolling buffer: trim auto-snapshots over the cap.
  const autos = await prisma.snapshot.findMany({
    where: { documentId: docId, name: null },
    orderBy: { takenAt: "desc" },
    select: { id: true },
  });
  if (autos.length > MAX_AUTO_PER_DOC) {
    const toDelete = autos.slice(MAX_AUTO_PER_DOC).map((s) => s.id);
    await prisma.snapshot.deleteMany({ where: { id: { in: toDelete } } });
  }
}
```

- [ ] **Step 4: Wire into `server/ws/yjs-handler.ts`**

Inside the y-websocket connection handler, on every doc update event, call `resetIdleTimer(docId)`. When all clients disconnect from a doc, call `clearIdleTimer(docId)`. Sketch:

```typescript
import { resetIdleTimer, clearIdleTimer } from "./snapshot-timer.js";

// When the room / ydoc is created for a doc:
ydoc.on("update", () => {
  resetIdleTimer(docId);
});

// When the last client disconnects (doc is being torn down):
clearIdleTimer(docId);
```

Exact insertion points depend on existing handler structure — search for where `Y.applyUpdate` is called in response to a client message, or where the Y.Doc is instantiated. If the handler uses `y-websocket/bin/utils` under the hood, you may need to subscribe to `ydoc.on('update', ...)` right after ydoc creation.

- [ ] **Step 5: Re-run tests**

```bash
pnpm test tests/server/snapshot-timer.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 6: Full server test suite (regression check)**

```bash
pnpm test tests/server
```
Expected: all pass.

- [ ] **Step 7: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 8: Commit**

```bash
git add server/ws/snapshot-timer.ts server/ws/yjs-handler.ts tests/server/snapshot-timer.test.ts
git commit -m "feat(server): idle-snapshot timer (5min, rolling 20 autos)"
```

---

### Task 6: Theme tri-state upgrade

**Files:**
- Modify: `src/lib/theme/ThemeProvider.tsx`
- Modify: `src/lib/theme/useTheme.ts`
- Modify: `tests/client/theme-provider.test.tsx` (add 3 new cases)

- [ ] **Step 1: Write failing tests** — extend `tests/client/theme-provider.test.tsx` with a new `describe("tri-state")` block:

```typescript
describe("tri-state system mode", () => {
  it("defaults to 'system' on first visit (no stored value)", () => {
    localStorage.clear();
    const mql = mockMatchMedia(false); // system = light
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    mql.cleanup();
  });

  it("updates live when system preference changes and theme is 'system'", () => {
    localStorage.clear();
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.resolvedTheme).toBe("light");
    act(() => mql.setMatches(true));
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    mql.cleanup();
  });

  it("does NOT track system changes when pinned to 'light' or 'dark'", () => {
    localStorage.clear();
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => result.current.setTheme("light"));
    act(() => mql.setMatches(true));
    // Theme is pinned to 'light' so resolvedTheme stays light
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    mql.cleanup();
  });
});
```

Add a test helper at the top of the file:

```typescript
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(ev: MediaQueryListEvent) => void>();
  const mql: Partial<MediaQueryList> & { setMatches: (v: boolean) => void; cleanup: () => void } = {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.delete(cb),
    setMatches(v: boolean) {
      (mql as { matches: boolean }).matches = v;
      for (const cb of listeners) cb({ matches: v } as MediaQueryListEvent);
    },
    cleanup() {
      listeners.clear();
    },
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => mql,
  });
  return mql as MediaQueryList & { setMatches: (v: boolean) => void; cleanup: () => void };
}
```

- [ ] **Step 2: Run tests (expect failure)**

```bash
pnpm test tests/client/theme-provider.test.tsx
```
Expected: new tests FAIL (resolvedTheme not exported, setTheme doesn't accept "system").

- [ ] **Step 3: Rewrite `src/lib/theme/ThemeProvider.tsx`**

```typescript
import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "katagami:theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  // Listen for system preference changes ONLY when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    // Resync once on subscribe in case it changed while not listening
    setSystemDark(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [resolvedTheme]);

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // non-fatal
    }
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Update `src/lib/theme/useTheme.ts` if it narrows the type:

```typescript
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 4: Re-run tests**

```bash
pnpm test tests/client/theme-provider.test.tsx
```
Expected: PASS (old cases may need small tweaks if they assumed 2-state default — adjust so they pass with `"system"` as the default).

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```
Note: any remaining imports of `ThemeToggle` will break typecheck. That file gets removed in Task 11 (avatar dropdown). For now, if needed, update `ThemeToggle.tsx` to handle `"system"` as a passthrough to `setTheme("system")` OR temporarily cast `setTheme(resolvedTheme === "dark" ? "light" : "dark")` — the cleanest path is to inline that two-state toggle since it'll be deleted soon. Prefer the inline tweak in `ThemeToggle.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme/ThemeProvider.tsx src/lib/theme/useTheme.ts src/lib/theme/ThemeToggle.tsx tests/client/theme-provider.test.tsx
git commit -m "feat(theme): tri-state light/dark/system with live matchMedia"
```

---

### Task 7: Install shadcn Dialog + DropdownMenu + Sonner via MCP

**Files (created by shadcn CLI):**
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/sonner.tsx`
- Modify: `src/main.tsx` — mount `<Toaster />`

- [ ] **Step 1: Ask shadcn MCP for the install commands**

Call:

```
mcp__shadcn__get_add_command_for_items with items: ["@shadcn/dialog", "@shadcn/dropdown-menu", "@shadcn/sonner"]
```

This returns the pnpm-prefixed CLI commands. Do not guess them.

- [ ] **Step 2: Run the install commands** returned by the MCP tool (e.g.):

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu sonner
```

Expected: new files created under `src/components/ui/`, `sonner` + `@radix-ui/react-dialog` + `@radix-ui/react-dropdown-menu` added to `package.json`.

- [ ] **Step 3: Mount `<Toaster />` in `src/main.tsx`**

Find where the app root mounts. Add:

```typescript
import { Toaster } from "~/components/ui/sonner";

// Inside the provider tree (above <RouterProvider> / <Routes> etc.), wrap or sibling:
<>
  <App />
  <Toaster richColors closeButton position="bottom-right" />
</>
```

If `main.tsx` currently renders `<ThemeProvider><App /></ThemeProvider>`, the Toaster goes inside the ThemeProvider so its icons inherit theme.

- [ ] **Step 4: Sanity typecheck + build**

```bash
pnpm typecheck && pnpm build:client
```
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ src/main.tsx package.json pnpm-lock.yaml components.json
git commit -m "chore(ui): install shadcn Dialog + DropdownMenu + Sonner; mount Toaster"
```

Note: the `components.json` path depends on your shadcn config — include it if updated.

---

### Task 8: Client API helpers (snapshots, documents)

**Files:**
- Create: `src/lib/api/snapshots.ts`
- Create: `src/lib/api/documents.ts`
- Create: `tests/client/api-helpers.test.ts`

- [ ] **Step 1: Write failing tests** — `tests/client/api-helpers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listSnapshots,
  createSnapshot,
  restoreSnapshot,
  renameSnapshot,
  deleteSnapshot,
} from "~/lib/api/snapshots";
import { updateDocumentTitle } from "~/lib/api/documents";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  );
}

describe("snapshots API helpers", () => {
  it("listSnapshots calls GET with key query", async () => {
    const spy = mockFetch(200, { snapshots: [] });
    await listSnapshots("doc-1", "key-1");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots?key=key-1"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createSnapshot POSTs name in body", async () => {
    const spy = mockFetch(201, { id: "s1", name: "v1", takenAt: new Date().toISOString(), takenByName: null, preview: "" });
    const s = await createSnapshot("doc-1", "key-1", "v1");
    expect(s.name).toBe("v1");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots?key=key-1"),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "v1" }) }),
    );
  });

  it("restoreSnapshot returns preRestoreSnapshotId", async () => {
    mockFetch(200, { restoredSnapshotId: "s1", preRestoreSnapshotId: "s0" });
    const r = await restoreSnapshot("doc-1", "s1", "key-1");
    expect(r.preRestoreSnapshotId).toBe("s0");
  });

  it("renameSnapshot PATCHes name", async () => {
    const spy = mockFetch(200, { id: "s1", name: "renamed", takenAt: new Date().toISOString(), takenByName: null, preview: "" });
    const r = await renameSnapshot("doc-1", "s1", "key-1", "renamed");
    expect(r.name).toBe("renamed");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots/s1?key=key-1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("deleteSnapshot DELETEs", async () => {
    const spy = mockFetch(204, {});
    await deleteSnapshot("doc-1", "s1", "key-1");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1/snapshots/s1?key=key-1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch(403, { error: "view only" });
    await expect(createSnapshot("doc-1", "view-key", "v1")).rejects.toThrow();
  });
});

describe("documents API helpers", () => {
  it("updateDocumentTitle PATCHes with title body", async () => {
    const spy = mockFetch(200, { id: "doc-1", title: "New", updatedAt: new Date().toISOString() });
    const r = await updateDocumentTitle("doc-1", "key-1", "New");
    expect(r.title).toBe("New");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/api/docs/doc-1?key=key-1"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "New" }) }),
    );
  });
});
```

- [ ] **Step 2: Run test (expect failure)**

```bash
pnpm test tests/client/api-helpers.test.ts
```
Expected: FAIL (modules don't exist).

- [ ] **Step 3: Implement `src/lib/api/snapshots.ts`**

```typescript
import type { SnapshotRecord } from "../../../shared/types";

async function jsonFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${url} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listSnapshots(docId: string, key: string): Promise<{ snapshots: SnapshotRecord[] }> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots?key=${encodeURIComponent(key)}`,
    { method: "GET" },
  );
}

export function createSnapshot(docId: string, key: string, name?: string): Promise<SnapshotRecord> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots?key=${encodeURIComponent(key)}`,
    { method: "POST", body: JSON.stringify(name ? { name } : {}) },
  );
}

export function restoreSnapshot(
  docId: string,
  snapId: string,
  key: string,
): Promise<{ restoredSnapshotId: string; preRestoreSnapshotId: string }> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}/restore?key=${encodeURIComponent(key)}`,
    { method: "POST" },
  );
}

export function renameSnapshot(
  docId: string,
  snapId: string,
  key: string,
  name: string,
): Promise<SnapshotRecord> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}?key=${encodeURIComponent(key)}`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
}

export function deleteSnapshot(docId: string, snapId: string, key: string): Promise<void> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}?key=${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
}
```

- [ ] **Step 4: Implement `src/lib/api/documents.ts`**

```typescript
interface UpdateTitleResponse {
  id: string;
  title: string | null;
  updatedAt: string;
}

export async function updateDocumentTitle(
  docId: string,
  key: string,
  title: string | null,
): Promise<UpdateTitleResponse> {
  const res = await fetch(
    `/api/docs/${encodeURIComponent(docId)}?key=${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`updateDocumentTitle failed: ${res.status}: ${body}`);
  }
  return (await res.json()) as UpdateTitleResponse;
}
```

- [ ] **Step 5: Re-run tests**

```bash
pnpm test tests/client/api-helpers.test.ts
```
Expected: PASS.

- [ ] **Step 6: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/ tests/client/api-helpers.test.ts
git commit -m "feat(api): client helpers for snapshots + document title"
```

---

### Task 9: Hooks — useRelativeTime, usePanelVisibility, useSnapshots

**Files:**
- Create: `src/hooks/useRelativeTime.ts`
- Create: `src/hooks/usePanelVisibility.ts`
- Create: `src/hooks/useSnapshots.ts`
- Create: `tests/client/use-relative-time.test.tsx`
- Create: `tests/client/use-panel-visibility.test.tsx`
- Create: `tests/client/use-snapshots.test.tsx`

- [ ] **Step 1: Write failing tests for `useRelativeTime`** — `tests/client/use-relative-time.test.tsx`:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRelativeTime } from "~/hooks/useRelativeTime";

afterEach(() => {
  vi.useRealTimers();
});

describe("useRelativeTime", () => {
  it("formats an ISO timestamp relative to now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00Z"));
    const { result } = renderHook(() => useRelativeTime("2026-04-24T11:58:00Z"));
    expect(result.current).toMatch(/2 min|2 minutes/);
  });

  it("returns 'just now' for timestamps within 30 seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00Z"));
    const { result } = renderHook(() => useRelativeTime("2026-04-24T11:59:45Z"));
    expect(result.current).toMatch(/just now|seconds ago/i);
  });

  it("re-renders after 60s tick", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T12:00:00Z"));
    const { result } = renderHook(() => useRelativeTime("2026-04-24T11:58:00Z"));
    const before = result.current;
    act(() => vi.advanceTimersByTime(61_000));
    // After 61s, the formatted string should have changed (3 minutes vs 2)
    expect(result.current).not.toBe(before);
  });
});
```

- [ ] **Step 2: Run test (expect failure)**

```bash
pnpm test tests/client/use-relative-time.test.tsx
```

- [ ] **Step 3: Implement `src/hooks/useRelativeTime.ts`**

```typescript
import { useEffect, useState } from "react";

export function formatRelative(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const diff = now - then;
  if (Number.isNaN(diff)) return "";
  if (diff < 30_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function useRelativeTime(iso: string | null | undefined): string {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return "";
  return formatRelative(iso);
}
```

- [ ] **Step 4: Write failing tests for `usePanelVisibility`** — `tests/client/use-panel-visibility.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelVisibility } from "~/hooks/usePanelVisibility";

beforeEach(() => localStorage.clear());

describe("usePanelVisibility", () => {
  it("defaults to open with tab 'comments' if nothing stored", () => {
    const { result } = renderHook(() => usePanelVisibility());
    expect(result.current.open).toBe(true);
    expect(result.current.activeTab).toBe("comments");
  });

  it("persists open/closed and active tab", () => {
    const { result } = renderHook(() => usePanelVisibility());
    act(() => result.current.setOpen(false));
    act(() => result.current.setActiveTab("history"));
    const { result: r2 } = renderHook(() => usePanelVisibility());
    expect(r2.current.open).toBe(false);
    expect(r2.current.activeTab).toBe("history");
  });

  it("togglePanel flips open state", () => {
    const { result } = renderHook(() => usePanelVisibility());
    act(() => result.current.togglePanel());
    expect(result.current.open).toBe(false);
  });
});
```

- [ ] **Step 5: Implement `src/hooks/usePanelVisibility.ts`**

```typescript
import { useCallback, useState } from "react";

export type PanelTab = "documents" | "comments" | "ai" | "history";

const OPEN_KEY = "katagami:panel-open";
const TAB_KEY = "katagami:panel-tab";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

function readTab(fallback: PanelTab): PanelTab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v === "documents" || v === "comments" || v === "ai" || v === "history") return v;
  } catch {
    // ignore
  }
  return fallback;
}

export function usePanelVisibility() {
  const [open, setOpenState] = useState<boolean>(() => readBool(OPEN_KEY, true));
  const [activeTab, setActiveTabState] = useState<PanelTab>(() => readTab("comments"));

  const setOpen = useCallback((next: boolean) => {
    try { localStorage.setItem(OPEN_KEY, String(next)); } catch { /* ignore */ }
    setOpenState(next);
  }, []);

  const togglePanel = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try { localStorage.setItem(OPEN_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setActiveTab = useCallback((next: PanelTab) => {
    try { localStorage.setItem(TAB_KEY, next); } catch { /* ignore */ }
    setActiveTabState(next);
  }, []);

  return { open, setOpen, togglePanel, activeTab, setActiveTab };
}
```

- [ ] **Step 6: Write failing tests for `useSnapshots`** — `tests/client/use-snapshots.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSnapshots } from "~/hooks/useSnapshots";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function mockListResponse(snapshots: unknown[]) {
  return vi.spyOn(global, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify({ snapshots }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("useSnapshots", () => {
  it("fetches on mount", async () => {
    const spy = mockListResponse([]);
    const { result } = renderHook(() => useSnapshots("doc-1", "key-1", true));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(result.current.snapshots).toEqual([]);
  });

  it("polls every 30s while enabled", async () => {
    const spy = mockListResponse([]);
    renderHook(() => useSnapshots("doc-1", "key-1", true));
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(spy).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("stops polling when enabled flips to false", async () => {
    const spy = mockListResponse([]);
    const { rerender } = renderHook(({ enabled }) => useSnapshots("doc-1", "key-1", enabled), {
      initialProps: { enabled: true },
    });
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 7: Implement `src/hooks/useSnapshots.ts`**

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { listSnapshots } from "~/lib/api/snapshots";
import type { SnapshotRecord } from "../../shared/types";

const POLL_MS = 30_000;

export function useSnapshots(docId: string | undefined, key: string | null, enabled: boolean) {
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!docId || !key) return;
    setLoading(true);
    try {
      const res = await listSnapshots(docId, key);
      if (!cancelledRef.current) {
        setSnapshots(res.snapshots);
        setError(null);
      }
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [docId, key]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) return;
    void refresh();
    const id = setInterval(() => { void refresh(); }, POLL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [enabled, refresh]);

  return { snapshots, loading, error, refresh };
}
```

- [ ] **Step 8: Re-run all hook tests**

```bash
pnpm test tests/client/use-relative-time.test.tsx tests/client/use-panel-visibility.test.tsx tests/client/use-snapshots.test.tsx
```
Expected: PASS.

- [ ] **Step 9: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/hooks/ tests/client/use-relative-time.test.tsx tests/client/use-panel-visibility.test.tsx tests/client/use-snapshots.test.tsx
git commit -m "feat(hooks): useRelativeTime, usePanelVisibility, useSnapshots"
```

---

### Task 10: Markdown export helper

**Files:**
- Create: `src/lib/export/markdown-download.ts`
- Create: `tests/client/markdown-download.test.ts`

- [ ] **Step 1: Write failing test** — `tests/client/markdown-download.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { buildFilename, buildMarkdownFromEditor } from "~/lib/export/markdown-download";
import type { Editor } from "@tiptap/core";

function stubEditor(text: string): Editor {
  return {
    getText: ({ blockSeparator }: { blockSeparator: string }) =>
      text.split("\n").join(blockSeparator),
  } as unknown as Editor;
}

describe("buildFilename", () => {
  it("slugifies the title with .md extension", () => {
    expect(buildFilename("Hello World", "abcd1234-abcd")).toBe("hello-world.md");
  });

  it("falls back to document-<prefix>.md when title is empty", () => {
    expect(buildFilename("", "abcd1234-abcd")).toBe("document-abcd1234.md");
    expect(buildFilename(null, "abcd1234-abcd")).toBe("document-abcd1234.md");
  });

  it("strips punctuation and collapses whitespace", () => {
    expect(buildFilename("  Spec v1: Ready! 🚀  ", "abcd1234")).toBe("spec-v1-ready.md");
  });
});

describe("buildMarkdownFromEditor", () => {
  it("returns editor text with blank-line block separators", () => {
    const editor = stubEditor("line1\nline2");
    expect(buildMarkdownFromEditor(editor)).toBe("line1\n\nline2");
  });
});
```

- [ ] **Step 2: Run test (expect failure)**

```bash
pnpm test tests/client/markdown-download.test.ts
```

- [ ] **Step 3: Implement `src/lib/export/markdown-download.ts`**

```typescript
import type { Editor } from "@tiptap/core";

export function buildMarkdownFromEditor(editor: Editor): string {
  return editor.getText({ blockSeparator: "\n\n" });
}

export function buildFilename(title: string | null | undefined, docId: string): string {
  if (title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);
    if (slug) return `${slug}.md`;
  }
  return `document-${docId.slice(0, 8)}.md`;
}

export function downloadAsMarkdown(
  editor: Editor,
  title: string | null | undefined,
  docId: string,
): void {
  const md = buildMarkdownFromEditor(editor);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(title, docId);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Re-run test**

```bash
pnpm test tests/client/markdown-download.test.ts
```
Expected: PASS.

- [ ] **Step 5: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/lib/export/ tests/client/markdown-download.test.ts
git commit -m "feat(export): markdown download helper"
```

---

### Task 11: Avatar menu — AvatarButton, AvatarDropdown, ThemeTriState, RenameModal

This task is the first that invokes `frontend-design:frontend-design`. The skill produces polished UI code; you then hook it up with identity/theme/download wiring.

**Files:**
- Create: `src/components/header/AvatarButton.tsx`
- Create: `src/components/avatar-menu/AvatarDropdown.tsx`
- Create: `src/components/avatar-menu/ThemeTriState.tsx`
- Create: `src/components/avatar-menu/RenameModal.tsx`
- Create: `tests/client/avatar-dropdown.test.tsx`
- Remove: `src/lib/theme/ThemeToggle.tsx` (replaced by ThemeTriState inside the dropdown)

- [ ] **Step 1: Invoke the `frontend-design:frontend-design` skill**

Prompt to the skill (copy-paste, adapting the design goals):

> **Target files:** `src/components/header/AvatarButton.tsx`, `src/components/avatar-menu/AvatarDropdown.tsx`, `src/components/avatar-menu/ThemeTriState.tsx`, `src/components/avatar-menu/RenameModal.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn/ui Nova preset, `DropdownMenu` + `Dialog` (already installed), lucide-react icons.
>
> **Design goals:**
> - AvatarButton: 32px circle, background = `identity.color`, first letter of identity.name white 13px bold. Hover: subtle scale 1.05 + outline ring. Active (menu open): persistent ring.
> - AvatarDropdown: content width ~260px; header row shows color dot + name; divider; Theme row with tri-state selector (sun/monitor/moon icons) aligned right; divider; "Rename", "Download as Markdown" menu items with left icons; divider; disabled "Log in" item with a tooltip "Authentication coming in a future phase".
> - ThemeTriState: inline 3-button group; active button uses shadcn `secondary` variant and inactive `ghost`; each icon is 16px. Keyboard-focus rings visible. Tooltip on each icon button.
> - RenameModal: shadcn Dialog. Title "Rename yourself". Single Input (autofocused, pre-filled), helper "1-40 characters". Primary `Save` + ghost `Cancel`. Enter to save, Esc to cancel.
> - Every state considered in both light and dark mode. No hard-coded hex colors — use shadcn tokens.
>
> **Accept props** (defined below). Do not implement identity persistence inside these components — the parent wires that up via props.
>
> **Required prop shapes:**
> ```typescript
> interface AvatarButtonProps {
>   name: string;
>   color: string;
>   onClick: () => void;
>   active: boolean;
> }
>
> interface AvatarDropdownProps {
>   identity: { name: string; color: string };
>   onRenameClick: () => void;
>   onDownloadClick: () => void;
>   trigger: ReactNode; // the AvatarButton is passed in
> }
>
> interface ThemeTriStateProps {
>   value: "light" | "dark" | "system";
>   onChange: (next: "light" | "dark" | "system") => void;
> }
>
> interface RenameModalProps {
>   open: boolean;
>   initialName: string;
>   onSave: (name: string) => void;
>   onCancel: () => void;
> }
> ```
>
> Use `lucide-react` for `Sun`, `Monitor`, `Moon`, `PenLine`, `Download`, `LogIn`.

Save the generated files to the paths above. Review the output for any inline hex colors and replace with shadcn tokens; review for missing `aria-label` on icon-only buttons.

- [ ] **Step 2: Write tests** — `tests/client/avatar-dropdown.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AvatarDropdown } from "~/components/avatar-menu/AvatarDropdown";
import { AvatarButton } from "~/components/header/AvatarButton";
import { RenameModal } from "~/components/avatar-menu/RenameModal";

describe("AvatarDropdown", () => {
  it("shows user name in header row when opened", async () => {
    const trigger = <AvatarButton name="Sakura" color="#ff66aa" onClick={() => {}} active={false} />;
    render(
      <AvatarDropdown
        identity={{ name: "Sakura", color: "#ff66aa" }}
        onRenameClick={() => {}}
        onDownloadClick={() => {}}
        trigger={trigger}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Sakura|avatar/i }));
    expect(await screen.findByText("Sakura")).toBeInTheDocument();
  });

  it("fires onDownloadClick when the Download item is activated", async () => {
    const onDownload = vi.fn();
    const trigger = <AvatarButton name="Sakura" color="#ff66aa" onClick={() => {}} active={false} />;
    render(
      <AvatarDropdown
        identity={{ name: "Sakura", color: "#ff66aa" }}
        onRenameClick={() => {}}
        onDownloadClick={onDownload}
        trigger={trigger}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Sakura|avatar/i }));
    fireEvent.click(await screen.findByText(/Download as Markdown/i));
    expect(onDownload).toHaveBeenCalled();
  });
});

describe("RenameModal", () => {
  it("calls onSave with the trimmed name when Enter is pressed", () => {
    const onSave = vi.fn();
    render(
      <RenameModal open={true} initialName="Sakura" onSave={onSave} onCancel={() => {}} />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Hanami  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("Hanami");
  });

  it("rejects names under 1 or over 40 chars", () => {
    const onSave = vi.fn();
    render(
      <RenameModal open={true} initialName="Sakura" onSave={onSave} onCancel={() => {}} />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "a".repeat(41) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/client/avatar-dropdown.test.tsx
```
If tests fail, iterate on the frontend-design output until behavior matches (fix validation, aria-labels, click handlers — not visual polish). Visual quality is reviewed manually.

- [ ] **Step 4: Remove `src/lib/theme/ThemeToggle.tsx`**

```bash
rm src/lib/theme/ThemeToggle.tsx
```

Find and remove all imports/usages. Typecheck should surface any remaining consumers; all of them will be replaced by ThemeTriState in the dropdown (consumer wiring happens in Task 17).

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```
Note: `Document.tsx` still imports `ThemeToggle`. Leave that import broken for now — Task 17 refactors the route. If the typecheck failure blocks commit, temporarily stub by importing from a small inline placeholder and document that Task 17 resolves it. (Preferred: comment out the import with a `// TODO task-17` marker; remove on Task 17.)

- [ ] **Step 6: Commit**

```bash
git add src/components/header/AvatarButton.tsx src/components/avatar-menu/ tests/client/avatar-dropdown.test.tsx src/lib/theme/ThemeToggle.tsx src/routes/Document.tsx
git commit -m "feat(ui): avatar dropdown + rename modal + theme tri-state (frontend-design)"
```

---

### Task 12: DocHeader pieces — TitleEditor, MetaLine, SaveSnapshotButton, PanelToggle, DocHeader

Second frontend-design invocation — for the overall DocHeader composition.

**Files:**
- Create: `src/components/header/TitleEditor.tsx`
- Create: `src/components/header/MetaLine.tsx`
- Create: `src/components/header/SaveSnapshotButton.tsx`
- Create: `src/components/header/PanelToggle.tsx`
- Create: `src/components/header/DocHeader.tsx`
- Create: `tests/client/title-editor.test.tsx`
- Install (if not already): shadcn `Popover` for SaveSnapshotButton popover

- [ ] **Step 1: Install Popover via shadcn MCP**

Call `mcp__shadcn__get_add_command_for_items` with `["@shadcn/popover"]`, then run the returned command.

- [ ] **Step 2: Write failing tests for TitleEditor** — `tests/client/title-editor.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TitleEditor } from "~/components/header/TitleEditor";

describe("TitleEditor", () => {
  it("renders idle state showing the title", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={false} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("switches to input on click and saves on Enter", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "World" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("World");
  });

  it("reverts on Escape", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "World" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("rejects titles over 120 chars (no save, stays in edit mode)", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a".repeat(121) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    // stays in input mode; error hint visible
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("does not switch to input when readOnly", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={true} />);
    fireEvent.click(screen.getByText("Hello"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Invoke `frontend-design:frontend-design` skill**

Prompt:

> **Target files:** `src/components/header/TitleEditor.tsx`, `src/components/header/MetaLine.tsx`, `src/components/header/SaveSnapshotButton.tsx`, `src/components/header/PanelToggle.tsx`, `src/components/header/DocHeader.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn (`Button`, `Input`, `Popover`), lucide-react.
>
> **Design goals:**
> - **DocHeader:** single horizontal bar at the top of the page. Left: FileText icon (20px) + TitleEditor (18px semibold) on row 1; MetaLine (`text-xs text-muted-foreground`) on row 2 immediately below the title. Right: SaveSnapshotButton, Edit/Preview segmented control (existing pattern from Document.tsx), PanelToggle, AvatarButton (slot). Subtle bottom border. In dark mode, tinted background. Compact at < 900px (hides SaveSnapshotButton label, shows icon only).
> - **TitleEditor:** idle = heading with underline-on-hover. Click converts to `<input>` (selects all). Enter → `onSave(trimmed)`. Escape reverts. Validates: length 0-120. On invalid, stays in edit mode with a `text-xs text-destructive` inline error. Placeholder "Untitled" when empty.
> - **MetaLine:** three middle-dot-separated pieces: `Updated {relativeTime}` (tooltip = absolute), connection status text (connected/connecting/disconnected — color-coded by status dot), permission text (editing / view only). Tooltip via shadcn `Tooltip`.
> - **SaveSnapshotButton:** shadcn `Button` variant `outline`, with Bookmark icon + label "Save". Clicking opens a `Popover` anchored to the button: small form with Input (placeholder "Snapshot name"), `Save` primary + `Cancel` ghost. Enter submits. Focus trapped inside popover.
> - **PanelToggle:** small `Button` variant `ghost` size `icon` with either PanelRightOpen or PanelRightClose icon based on `open` prop. Tooltip "Show/Hide panel". `aria-pressed={open}`.
>
> **Required prop shapes:**
> ```typescript
> interface TitleEditorProps {
>   title: string | null;
>   onSave: (next: string | null) => void;
>   readOnly: boolean;
> }
>
> interface MetaLineProps {
>   updatedAt: string | null;
>   connection: "connecting" | "connected" | "disconnected";
>   permission: "edit" | "view";
> }
>
> interface SaveSnapshotButtonProps {
>   disabled: boolean;
>   onSave: (name: string) => void | Promise<void>;
> }
>
> interface PanelToggleProps {
>   open: boolean;
>   onToggle: () => void;
> }
>
> interface DocHeaderProps {
>   title: string | null;
>   onSaveTitle: (next: string | null) => void;
>   readOnly: boolean;
>   updatedAt: string | null;
>   connection: "connecting" | "connected" | "disconnected";
>   permission: "edit" | "view";
>   mode: "edit" | "preview";
>   onModeChange: (m: "edit" | "preview") => void;
>   panelOpen: boolean;
>   onTogglePanel: () => void;
>   onSaveSnapshot: (name: string) => void | Promise<void>;
>   avatarSlot: ReactNode;
> }
> ```

- [ ] **Step 4: Run TitleEditor tests**

```bash
pnpm test tests/client/title-editor.test.tsx
```
Iterate on frontend-design output if behavior tests fail. Visual polish is reviewed manually.

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/header/ tests/client/title-editor.test.tsx src/components/ui/popover.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): DocHeader (title editor, meta line, save snapshot, panel toggle) (frontend-design)"
```

---

### Task 13: PanelTabs — animated expanding-icon tabs

Third frontend-design invocation — for the animated tab bar.

**Files:**
- Create: `src/components/panel/PanelTabs.tsx`
- Create: `tests/client/panel-tabs.test.tsx`

- [ ] **Step 1: Write failing tests** — `tests/client/panel-tabs.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelTabs } from "~/components/panel/PanelTabs";

const baseTabs = [
  { id: "documents", label: "Documents", icon: "FileText" as const, badge: null, hasNotification: false },
  { id: "comments", label: "Comments", icon: "MessageSquare" as const, badge: 3, hasNotification: true },
  { id: "ai", label: "AI", icon: "Sparkles" as const, badge: null, hasNotification: false },
  { id: "history", label: "History", icon: "History" as const, badge: null, hasNotification: false },
] as const;

describe("PanelTabs", () => {
  it("renders the active tab label visibly; others as icon only", () => {
    render(<PanelTabs tabs={baseTabs as any} active="comments" onChange={() => {}} />);
    expect(screen.getByText("Comments")).toBeVisible();
    // Inactive tabs have their label in an aria-label / tooltip rather than visible text
    expect(screen.queryByText("Documents")).toBeNull();
  });

  it("shows count badge on the active Comments tab", () => {
    render(<PanelTabs tabs={baseTabs as any} active="comments" onChange={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("fires onChange when clicking an inactive tab", () => {
    const onChange = vi.fn();
    render(<PanelTabs tabs={baseTabs as any} active="comments" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /History/i }));
    expect(onChange).toHaveBeenCalledWith("history");
  });
});
```

- [ ] **Step 2: Invoke `frontend-design:frontend-design` skill**

Prompt:

> **Target file:** `src/components/panel/PanelTabs.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn (`Tooltip`), lucide-react.
>
> **Design goals:**
> - Horizontal tab strip, 4 tabs total, full width of parent
> - Active tab expands via `flex-1` + inner content (icon + label + optional count badge); inactive tabs collapse to fixed width ~44px showing icon only
> - Width animates smoothly on tab change: use `transition-[flex-grow,width] duration-200 ease-out` (no Framer needed — CSS transitions fine)
> - Inactive tabs render a red-500 6px notification dot in top-right corner when `hasNotification` is true
> - Hover tooltip (shadcn `Tooltip`) on inactive tabs showing the full label
> - Focus ring on keyboard-focused tab; arrow-left/right navigates, Enter/Space activates, `role="tab"` inside `role="tablist"`
> - Active tab uses `bg-primary text-primary-foreground`; inactive uses `text-muted-foreground hover:bg-muted`
> - Count badge: small pill (10px font, `bg-primary-foreground/20 text-primary-foreground`) next to label, only rendered when `badge != null && badge > 0`
>
> **Required prop shape:**
> ```typescript
> interface PanelTabDescriptor {
>   id: string;
>   label: string;
>   icon: "FileText" | "MessageSquare" | "Sparkles" | "History";
>   badge: number | null;
>   hasNotification: boolean;
> }
>
> interface PanelTabsProps {
>   tabs: readonly PanelTabDescriptor[];
>   active: string;
>   onChange: (id: string) => void;
> }
> ```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/client/panel-tabs.test.tsx
```
Iterate if behavior tests fail.

- [ ] **Step 4: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/components/panel/PanelTabs.tsx tests/client/panel-tabs.test.tsx
git commit -m "feat(ui): PanelTabs with animated width transitions (frontend-design)"
```

---

### Task 14: DocsTab + AiTab stubs with polished empty states

Fourth frontend-design invocation — empty-state visuals.

**Files:**
- Create: `src/components/panel/tabs/DocsTab.tsx`
- Create: `src/components/panel/tabs/AiTab.tsx`

The spec mandates polished empty states. These tabs have no functional content in 4a, but must still meet the visual bar.

- [ ] **Step 1: Invoke `frontend-design:frontend-design` skill**

Prompt:

> **Target files:** `src/components/panel/tabs/DocsTab.tsx`, `src/components/panel/tabs/AiTab.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn, lucide-react.
>
> **Design goals — both components render a polished empty state, not a placeholder box:**
>
> - **DocsTab:** centered vertical stack — Folder illustration (use lucide `FolderOpen` or a small custom SVG with a softly-colored background circle `bg-primary/10`, icon 32px, `text-primary/80`) + heading "Documents are coming soon" (16px semibold) + copy "Organize related specs into folders and navigate between them from here." (14px `text-muted-foreground`, max-w-[260px]) + a disabled `Button variant="outline"` "Browse documents" with a tooltip "Available in an upcoming update". Vertical spacing ~24px between items.
> - **AiTab:** centered vertical stack — Sparkles illustration in a `bg-primary/10` circle (48px) + heading "AI rewriting is in development" + copy "Soon you'll be able to select text and ask the assistant to rewrite, summarize, or expand it." + disabled pill-styled Input with placeholder "Ask AI…" and a disabled `Button variant="outline"` "Notify me" tooltip "Available in Phase 5".
> - Both empty states must look polished in dark mode: verify against `html.dark` that text hierarchy remains legible.
> - No hard-coded colors — use shadcn tokens (`primary`, `muted-foreground`, `border`).
>
> **Props:** each component is a zero-prop stateless stub.

- [ ] **Step 2: Visual inspection**

Start the dev server (`pnpm dev`) and render both tabs via the RightPanel (you'll need to temporarily change the default tab, or just load the component in isolation via a scratch route if one exists). Verify:
- Light mode polish
- Dark mode polish
- Tooltip on disabled button

- [ ] **Step 3: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/components/panel/tabs/DocsTab.tsx src/components/panel/tabs/AiTab.tsx
git commit -m "feat(ui): Docs + AI tab stubs with polished empty states (frontend-design)"
```

---

### Task 15: CommentsTab — collapsible per-thread cards

Fifth frontend-design invocation — for the thread card polish.

**Files:**
- Create: `src/components/panel/tabs/CommentsTab.tsx`
- Modify: `src/components/comments/ThreadCard.tsx` — add collapsible behavior (collapsed state shows author + truncated body + reply-count badge; expanded shows full card)
- Remove: `src/components/comments/CommentSidebar.tsx` (content migrates into CommentsTab)
- Remove: `src/components/comments/CommentChip.tsx`
- Create: `tests/client/comments-tab.test.tsx`
- Keep: `src/hooks/useThreads.ts` and `src/lib/comments/*` (logic unchanged)

The Phase 3 `CommentSidebar` shell (heading + show-resolved toggle + empty state + list) becomes `CommentsTab` with a polished visual treatment. The per-thread card adds a collapse/expand affordance.

- [ ] **Step 1: Write failing tests** — `tests/client/comments-tab.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentsTab } from "~/components/panel/tabs/CommentsTab";
import type { Thread } from "~/lib/comments/types";

function fakeThread(id: string, overrides: Partial<Thread> = {}): Thread {
  return {
    id,
    authorName: "Sakura",
    authorColor: "#ff66aa",
    body: "A comment",
    createdAt: Date.now(),
    resolved: false,
    replies: [],
    ...overrides,
  };
}

describe("CommentsTab", () => {
  it("renders empty state when there are no threads", () => {
    render(
      <CommentsTab
        threads={[]}
        currentAuthorName="Sakura"
        readOnly={false}
        resolveAnchor={() => ""}
        onReply={() => {}}
        onResolveToggle={() => {}}
        onDeleteThreadRoot={() => {}}
        onDeleteReply={() => {}}
        onClickAnchor={() => {}}
      />,
    );
    expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
  });

  it("shows a reply count badge when a thread has replies", () => {
    const thread = fakeThread("t1", {
      replies: [
        { id: "r1", authorName: "X", authorColor: "#000", body: "r", createdAt: Date.now() },
        { id: "r2", authorName: "Y", authorColor: "#000", body: "r", createdAt: Date.now() },
      ],
    });
    render(
      <CommentsTab
        threads={[thread]}
        currentAuthorName="Sakura"
        readOnly={false}
        resolveAnchor={() => ""}
        onReply={() => {}}
        onResolveToggle={() => {}}
        onDeleteThreadRoot={() => {}}
        onDeleteReply={() => {}}
        onClickAnchor={() => {}}
      />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("collapses and expands a thread when the header is clicked", () => {
    const thread = fakeThread("t1", { body: "Full body text visible when expanded" });
    render(
      <CommentsTab
        threads={[thread]}
        currentAuthorName="Sakura"
        readOnly={false}
        resolveAnchor={() => ""}
        onReply={() => {}}
        onResolveToggle={() => {}}
        onDeleteThreadRoot={() => {}}
        onDeleteReply={() => {}}
        onClickAnchor={() => {}}
      />,
    );
    // Default expanded → full body visible
    expect(screen.getByText(/Full body text visible when expanded/)).toBeInTheDocument();
    // Click toggle → collapses
    fireEvent.click(screen.getByRole("button", { name: /Collapse thread/i }));
    expect(screen.queryByText(/Full body text visible when expanded/)).not.toBeInTheDocument();
    // Click again → expands
    fireEvent.click(screen.getByRole("button", { name: /Expand thread/i }));
    expect(screen.getByText(/Full body text visible when expanded/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Invoke `frontend-design:frontend-design` skill**

Prompt:

> **Target file:** `src/components/panel/tabs/CommentsTab.tsx`; **modify:** `src/components/comments/ThreadCard.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn, lucide-react.
>
> **Design goals:**
>
> - **CommentsTab**: sticky top bar with count ("3 comments" or "No comments") and "Show resolved ({n})" checkbox. Below, a scrollable list of ThreadCards. Empty state is centered vertical stack: MessageSquare icon in a `bg-primary/10` circle (48px), heading "No comments yet", copy "Select any text and click Comment to start a thread." — same polish bar as Docs/AI empty states.
> - **ThreadCard** collapsed header row (shown when collapsed OR as the header in expanded mode): `[●color name]` author pill · `text-xs text-muted-foreground` relative time · anchor quote (italic, truncated, click scrolls to anchor in editor) · right side: if `replies.length > 0`, a small `bg-muted text-xs` badge with the count + MessageSquare icon; then ChevronDown/ChevronUp button.
> - **ThreadCard expanded body**: full body text (preserve whitespace), list of replies below (each reply = smaller avatar pill + body + delete icon if author), Reply composer (hidden until Reply button clicked), Resolve + Delete + Collapse action buttons on the right of the header row.
> - Collapse state is **per-thread, component-local state** — no global store. Default = expanded.
> - All interactions have visible hover+focus states. Clicking the anchor quote calls `onClickAnchor`.
> - Dark mode verified.
>
> **Required prop shape (ThreadCard unchanged from Phase 3):** see existing `src/components/comments/ThreadCard.tsx`. Add a `defaultCollapsed?: boolean` prop (default false) and internally manage collapse state.
>
> **CommentsTab prop shape:**
> ```typescript
> interface CommentsTabProps {
>   threads: Thread[];
>   currentAuthorName: string;
>   readOnly: boolean;
>   resolveAnchor: (thread: Thread) => string;
>   onReply: (threadId: string, body: string) => void;
>   onResolveToggle: (threadId: string, next: boolean) => void;
>   onDeleteThreadRoot: (threadId: string) => void;
>   onDeleteReply: (threadId: string, replyId: string) => void;
>   onClickAnchor: (threadId: string) => void;
> }
> ```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/client/comments-tab.test.tsx
```

- [ ] **Step 4: Run the old Phase 3 comment sidebar tests (they should still pass for underlying logic)**

```bash
pnpm test tests/client/comment-sidebar.test.tsx tests/client/commenting-flow.test.tsx tests/client/use-threads.test.tsx tests/client/threads.test.ts
```
If `comment-sidebar.test.tsx` explicitly imports CommentSidebar, update it to import CommentsTab — the behavioral assertions should port over cleanly. If some tests depend on CommentChip, remove them (chip is replaced by PanelTabs notification dot).

- [ ] **Step 5: Delete Phase 3 sidebar + chip**

```bash
rm src/components/comments/CommentSidebar.tsx src/components/comments/CommentChip.tsx
```

Update any remaining consumers (mostly `Document.tsx` which is refactored in Task 17 — leave the broken imports with `// TODO task-17` markers again).

- [ ] **Step 6: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/components/panel/tabs/CommentsTab.tsx src/components/comments/ tests/client/
git commit -m "feat(ui): CommentsTab with collapsible threads (frontend-design); remove sidebar+chip"
```

---

### Task 16: HistoryTab — SnapshotList, SnapshotCard, SnapshotPreview

Sixth frontend-design invocation — for the snapshot card polish.

**Files:**
- Create: `src/components/panel/tabs/HistoryTab.tsx`
- Create: `src/components/history/SnapshotList.tsx`
- Create: `src/components/history/SnapshotCard.tsx`
- Create: `src/components/history/SnapshotPreview.tsx`
- Create: `tests/client/history-tab.test.tsx`

- [ ] **Step 1: Write failing tests** — `tests/client/history-tab.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SnapshotCard } from "~/components/history/SnapshotCard";
import type { SnapshotRecord } from "../../shared/types";

function fakeSnap(over: Partial<SnapshotRecord> = {}): SnapshotRecord {
  return {
    id: "s1",
    name: null,
    takenAt: new Date().toISOString(),
    takenByName: null,
    preview: "First 80 chars of the doc content…",
    ...over,
  };
}

describe("SnapshotCard", () => {
  it("renders 'Auto-snapshot' label for null name", () => {
    render(
      <SnapshotCard
        snapshot={fakeSnap()}
        readOnly={false}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.getByText(/Auto-snapshot/i)).toBeInTheDocument();
  });

  it("renders the snapshot name when set", () => {
    render(
      <SnapshotCard
        snapshot={fakeSnap({ name: "Spec v1" })}
        readOnly={false}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.getByText("Spec v1")).toBeInTheDocument();
  });

  it("shows Save-as-named on auto-snapshots and Rename on named", () => {
    const { rerender } = render(
      <SnapshotCard
        snapshot={fakeSnap()}
        readOnly={false}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Save as named/i })).toBeInTheDocument();
    rerender(
      <SnapshotCard
        snapshot={fakeSnap({ name: "Spec v1" })}
        readOnly={false}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Rename/i })).toBeInTheDocument();
  });

  it("hides mutating actions when readOnly", () => {
    render(
      <SnapshotCard
        snapshot={fakeSnap({ name: "Spec v1" })}
        readOnly={true}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Restore/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Invoke `frontend-design:frontend-design` skill**

Prompt:

> **Target files:** `src/components/panel/tabs/HistoryTab.tsx`, `src/components/history/SnapshotList.tsx`, `src/components/history/SnapshotCard.tsx`, `src/components/history/SnapshotPreview.tsx`
>
> **Stack:** React 19, Tailwind 4, shadcn, lucide-react.
>
> **Design goals:**
>
> - **HistoryTab**: container with a scrollable list. Top: small header "History" + subtle count label. Empty state: polished centered stack — History icon in `bg-primary/10` circle + heading "No snapshots yet" + copy "Save a snapshot to mark an important version of this document." + tooltip-wrapped `Save snapshot` button (if edit token) that triggers the same flow as the header `SaveSnapshotButton`.
> - **SnapshotList**: wraps SnapshotCards; adds a section divider between named and auto groups if both exist. No sticky behavior in 4a.
> - **SnapshotCard**: two-state (collapsed / expanded). Collapsed: left column = Star icon (named) or History icon (auto, `text-muted-foreground`); middle = name (semibold) or "Auto-snapshot", relative time + taken-by (named only) on line 2, 80-char preview on line 3 (italic, muted); right = actions.
>   - Named actions: Restore (primary), Rename, Delete (destructive, with confirmation popover).
>   - Auto actions: Restore (primary), "Save as named" (secondary).
>   - `readOnly` (view token) suppresses all mutating actions; only the expand chevron and preview are shown.
>   - Click the preview area or chevron to expand → card grows, reveals `<SnapshotPreview>` (scrollable pre-wrapped text); actions stay visible at the bottom.
>   - Expand animates height (CSS `transition-[max-height] duration-300 ease-in-out`).
> - **SnapshotPreview**: `<pre className="whitespace-pre-wrap font-mono text-xs ...">` inside a bordered scrollable container (`max-h-[240px] overflow-y-auto`). Shows the full preview (120 chars at REST, but if the preview is ever extended, it'll handle that gracefully).
> - Dark-mode verified.
>
> **Required prop shapes:**
> ```typescript
> interface SnapshotCardProps {
>   snapshot: SnapshotRecord;
>   readOnly: boolean;
>   onRestore: () => void;
>   onRename: (nextName: string) => void;
>   onDelete: () => void;
>   onSaveAsNamed: (nextName: string) => void;
> }
>
> interface SnapshotListProps {
>   snapshots: SnapshotRecord[];
>   readOnly: boolean;
>   onRestore: (snapId: string) => void;
>   onRename: (snapId: string, nextName: string) => void;
>   onDelete: (snapId: string) => void;
>   onSaveAsNamed: (snapId: string, nextName: string) => void;
> }
>
> interface HistoryTabProps {
>   docId: string;
>   keyToken: string;
>   readOnly: boolean;
>   enabled: boolean; // only poll while tab is active
>   onRestore: (snapId: string) => Promise<{ preRestoreSnapshotId: string }>;
> }
> ```
>
> `HistoryTab` uses `useSnapshots(docId, keyToken, enabled)` for data. On Restore: it calls `onRestore` (wired by parent to the API helper), then refreshes the list. On Save-as-named / Rename / Delete: calls the corresponding API helper directly and refreshes.

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/client/history-tab.test.tsx
```

- [ ] **Step 4: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/components/panel/tabs/HistoryTab.tsx src/components/history/ tests/client/history-tab.test.tsx
git commit -m "feat(ui): HistoryTab with SnapshotCard + preview (frontend-design)"
```

---

### Task 17: RightPanel composition + Document route refactor + Sonner wiring + final audit + smoke test + tag

This is the integration task. It unblocks the broken `Document.tsx` imports from earlier tasks and ties everything together with Sonner toasts.

**Files:**
- Create: `src/components/panel/RightPanel.tsx`
- Modify: `src/routes/Document.tsx` (major refactor)
- Create: `tests/client/sonner-toasts.test.tsx`
- Update: `tests/client/document-route.test.tsx` (adjust selectors)

- [ ] **Step 1: Implement `src/components/panel/RightPanel.tsx`**

```typescript
import type { ReactNode } from "react";
import type { PanelTab } from "~/hooks/usePanelVisibility";
import { PanelTabs, type PanelTabDescriptor } from "./PanelTabs";

interface RightPanelProps {
  open: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  commentCount: number;
  hasNewCommentActivity: boolean;
  children: ReactNode; // body — DocsTab / CommentsTab / AiTab / HistoryTab based on activeTab
}

const TABS: readonly PanelTabDescriptor[] = [
  { id: "documents", label: "Documents", icon: "FileText", badge: null, hasNotification: false },
  { id: "comments", label: "Comments", icon: "MessageSquare", badge: null, hasNotification: false },
  { id: "ai", label: "AI", icon: "Sparkles", badge: null, hasNotification: false },
  { id: "history", label: "History", icon: "History", badge: null, hasNotification: false },
];

export function RightPanel({
  open,
  activeTab,
  onTabChange,
  commentCount,
  hasNewCommentActivity,
  children,
}: RightPanelProps) {
  const tabs = TABS.map((t) => {
    if (t.id === "comments") {
      return {
        ...t,
        badge: commentCount > 0 ? commentCount : null,
        hasNotification: hasNewCommentActivity && activeTab !== "comments",
      };
    }
    return t;
  });

  return (
    <aside
      role="complementary"
      aria-label="Document panel"
      className={`flex flex-col overflow-hidden border-l border-border bg-muted/20 transition-[width] duration-200 ease-out ${
        open ? "w-[360px]" : "w-0"
      }`}
    >
      {open && (
        <>
          <PanelTabs tabs={tabs} active={activeTab} onChange={(id) => onTabChange(id as PanelTab)} />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Refactor `src/routes/Document.tsx`**

The rewrite composes `DocHeader` + `RightPanel`, moves selection-action registration into the same effect, and wires Sonner toasts.

Key behavioral wiring:

- Pass `title` from metadata (fetch via `getDocument`); update via `updateDocumentTitle` on save; optimistically update local state.
- Pass `permission`, `connection`, `updatedAt` into `DocHeader`.
- `onSaveSnapshot` (from SaveSnapshotButton) → `createSnapshot(docId, key, name)` → toast success.
- Panel state lives in `usePanelVisibility()`.
- Restore flow: when user clicks Restore on a SnapshotCard, call `restoreSnapshot` → toast with Undo action → Undo action restores the pre-restore snapshot (second `restoreSnapshot` call targeting `preRestoreSnapshotId`).
- Remote-comment toasts: subscribe to thread changes (already emitted via `useThreads`); track threads seen-so-far in a ref; when new threads appear AFTER the initial sync AND their author is NOT the current user, fire `toast.info(...)` with a View action that opens the sidebar + focuses the thread. Same for new replies.
- Connection toasts: listen to `provider.on("status", ...)` — show persistent warning on disconnect, success on reconnect. Track first-connection to avoid toasting on initial mount.
- Suppression: avoid toasting during initial sync; don't toast your own actions.

Sketch of the new render tree (truncated — the frontend-design skill output for header/panel is used as-is):

```tsx
export default function DocumentRoute() {
  // ... existing hooks (docId, key, permission, editor, etc.)
  const { open, togglePanel, activeTab, setActiveTab } = usePanelVisibility();
  const [title, setTitle] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  // ...

  const handleSaveTitle = async (next: string | null) => {
    if (!docId || !key) return;
    const prev = title;
    setTitle(next); // optimistic
    try {
      const res = await updateDocumentTitle(docId, key, next);
      setUpdatedAt(res.updatedAt);
    } catch (e) {
      setTitle(prev);
      toast.error("Couldn't save title");
    }
  };

  const handleSaveSnapshot = async (name: string) => {
    if (!docId || !key) return;
    try {
      const snap = await createSnapshot(docId, key, name);
      toast.success(`Snapshot saved: ${snap.name}`);
    } catch {
      toast.error("Couldn't save snapshot");
    }
  };

  const handleRestore = async (snapId: string) => {
    if (!docId || !key) return;
    try {
      const { preRestoreSnapshotId } = await restoreSnapshot(docId, snapId, key);
      toast.success(`Restored snapshot`, {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreSnapshot(docId, preRestoreSnapshotId, key).catch(() => {
              toast.error("Undo failed");
            });
          },
        },
        duration: 5000,
      });
      return { preRestoreSnapshotId };
    } catch {
      toast.error("Couldn't restore snapshot");
      throw new Error("restore failed");
    }
  };

  return (
    <main className="mx-auto flex h-screen max-w-[1400px] flex-col px-4 py-4">
      <DocHeader
        title={title}
        onSaveTitle={handleSaveTitle}
        readOnly={readOnly}
        updatedAt={updatedAt}
        connection={status}
        permission={readOnly ? "view" : "edit"}
        mode={mode}
        onModeChange={setMode}
        panelOpen={open}
        onTogglePanel={togglePanel}
        onSaveSnapshot={handleSaveSnapshot}
        avatarSlot={
          <AvatarDropdown
            identity={identityRef.current}
            onRenameClick={() => setRenameOpen(true)}
            onDownloadClick={() => downloadAsMarkdown(editor!, title, docId!)}
            trigger={<AvatarButton name={identityRef.current.name} color={identityRef.current.color} onClick={() => {}} active={false} />}
          />
        }
      />

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div ref={editorHostRef} className={/* same as Phase 3, minus rounded-b change */ ...} />
          {mode === "preview" && /* preview div same as Phase 3 */}
        </div>

        <RightPanel
          open={open}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          commentCount={unresolvedCount}
          hasNewCommentActivity={hasNewCommentActivity}
        >
          {activeTab === "documents" && <DocsTab />}
          {activeTab === "comments" && (
            <CommentsTab
              threads={threads}
              currentAuthorName={identityRef.current.name}
              readOnly={readOnly}
              resolveAnchor={resolveAnchor}
              onReply={/* existing wiring */}
              onResolveToggle={/* existing */}
              onDeleteThreadRoot={/* existing */}
              onDeleteReply={/* existing */}
              onClickAnchor={handleScrollToAnchor}
            />
          )}
          {activeTab === "ai" && <AiTab />}
          {activeTab === "history" && (
            <HistoryTab
              docId={docId!}
              keyToken={key!}
              readOnly={readOnly}
              enabled={open && activeTab === "history"}
              onRestore={handleRestore}
            />
          )}
        </RightPanel>
      </div>

      <FloatingCommentButton editor={editor} disabled={readOnly} />

      {composer && (/* unchanged */)}

      <RenameModal
        open={renameOpen}
        initialName={identityRef.current.name}
        onSave={(next) => {
          storeIdentity({ ...identityRef.current, name: next });
          setRenameOpen(false);
          // trigger re-render
        }}
        onCancel={() => setRenameOpen(false)}
      />
    </main>
  );
}
```

Replace placeholder comments with the real Phase 3 wiring that already exists in the current Document.tsx.

- [ ] **Step 3: Wire remote-comment toasts inside Document.tsx**

Add a `previousThreadsRef` ref that tracks the last-seen thread IDs and reply IDs. Inside a `useEffect` that depends on `threads`:

```typescript
const previousRef = useRef<{ threadIds: Set<string>; replyIds: Set<string>; hydrated: boolean }>({
  threadIds: new Set(),
  replyIds: new Set(),
  hydrated: false,
});

useEffect(() => {
  const prev = previousRef.current;
  const currentThreadIds = new Set(threads.map((t) => t.id));
  const currentReplyIds = new Set(threads.flatMap((t) => t.replies.map((r) => r.id)));

  if (prev.hydrated) {
    // New threads added by someone else
    for (const thread of threads) {
      if (!prev.threadIds.has(thread.id) && thread.authorName !== identityRef.current.name) {
        toast.info(`${thread.authorName} commented`, {
          action: {
            label: "View",
            onClick: () => {
              setActiveTab("comments");
              handleScrollToAnchor(thread.id);
            },
          },
          duration: 4000,
        });
      }
      for (const reply of thread.replies) {
        if (!prev.replyIds.has(reply.id) && reply.authorName !== identityRef.current.name) {
          toast.info(`${reply.authorName} replied`, {
            action: {
              label: "View",
              onClick: () => {
                setActiveTab("comments");
                handleScrollToAnchor(thread.id);
              },
            },
            duration: 4000,
          });
        }
      }
    }
  }

  prev.threadIds = currentThreadIds;
  prev.replyIds = currentReplyIds;
  prev.hydrated = true;
}, [threads]);
```

- [ ] **Step 4: Wire connection toasts**

```typescript
const hasConnectedOnce = useRef(false);
const disconnectToastId = useRef<string | number | null>(null);

useEffect(() => {
  if (status === "disconnected" && hasConnectedOnce.current) {
    const id = toast.warning("Lost connection — retrying…", { duration: Infinity });
    disconnectToastId.current = id;
  }
  if (status === "connected") {
    if (disconnectToastId.current !== null) {
      toast.dismiss(disconnectToastId.current);
      toast.success("Reconnected", { duration: 2000 });
      disconnectToastId.current = null;
    }
    hasConnectedOnce.current = true;
  }
}, [status]);
```

- [ ] **Step 5: Write `tests/client/sonner-toasts.test.tsx`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  }),
  Toaster: () => null,
}));

// The test renders a minimal harness that exposes the toast wiring used by Document.tsx.
// Simplest approach: extract the two useEffects (remote-comments, connection) into small
// hooks (useRemoteCommentToasts, useConnectionToasts) and test those hooks directly with
// renderHook. The connection hook takes `status` + `identityName`, the comments hook takes
// `threads` + `identityName` + `onNavigate`.

describe("connection toasts", () => {
  it("does not toast the initial 'connecting' state", async () => {
    // ... see the extracted hook
  });

  it("toasts disconnection only after at least one successful connection", async () => {
    // ...
  });
});

describe("remote comment toasts", () => {
  it("does not toast during initial hydration", async () => {
    // ...
  });

  it("toasts when another author's thread appears", async () => {
    // ...
  });
});
```

Refactor guidance: pull the two effects in Document.tsx into `src/hooks/useConnectionToasts.ts` and `src/hooks/useRemoteCommentToasts.ts` so they can be tested in isolation. Both hooks accept the same arguments shown in the test sketches above, return void. Document.tsx just calls them.

- [ ] **Step 6: Update `tests/client/document-route.test.tsx`**

Phase 3 tests likely query for `CommentChip` or specific sidebar selectors. Update to match new DOM: title editor, avatar button, panel toggle, tab list. Keep the behavioral assertions (load/reject invalid key/etc.) — only swap selectors. Run them and adjust until green.

- [ ] **Step 7: Full test suite regression pass**

```bash
pnpm test
```
Expected: all ~170 tests pass (123 prior + ~46 new + minor adjustments).

- [ ] **Step 8: Typecheck + lint + build**

```bash
pnpm typecheck && pnpm lint && pnpm build:client
```
Expected: clean.

- [ ] **Step 9: Run shadcn audit checklist**

Call `mcp__shadcn__get_audit_checklist` and walk through each item. Fix any flagged issues inline before the tag.

- [ ] **Step 10: Manual two-browser smoke test**

Start the stack: `pnpm dev`.

Open the app in Browser A (edit URL) and Browser B (same edit URL in an incognito window, or a separate profile).

Walk the full Phase 4a acceptance flow (copy of `phase-4a-spec.md` §9 item 6 — all sub-items):

- [ ] Header shows title, FileText icon, relative-time meta, connection status in both browsers
- [ ] Edit title in Browser A → reflected in Browser B (may take up to a Yjs cycle)
- [ ] Tab switching animates smoothly (Documents / Comments / AI / History)
- [ ] Post a comment in Browser A → Browser B shows a Sonner toast "Sakura commented" with a View action that opens the Comments tab and scrolls
- [ ] Reply to a comment in Browser A → Browser B shows "Sakura replied" toast
- [ ] Save a named snapshot in Browser A → Browser B shows it in History tab within 30s
- [ ] Restore a snapshot in Browser A → both editors update; toast has Undo action; clicking Undo restores pre-restore state
- [ ] Dark mode toggle works in each browser independently
- [ ] ThemeTriState: switch to System; change OS appearance; theme follows live
- [ ] Rename via dropdown → awareness label updates in Browser B
- [ ] Click Download as Markdown → correct `.md` file downloads with slug filename
- [ ] Disconnect Browser A (kill WS via devtools or by stopping the server) → warning toast; restart → success toast
- [ ] Empty states: load a fresh doc; DocsTab / AiTab / empty History / empty Comments all look polished

Document any discovered polish issues and fix before tagging. Polish issues that can't be fixed: open an explicit `docs/phase-4a-followups.md` note listing them with reasons (this is a safety valve — the bar is zero known polish issues at tag time, but if something surfaces during smoke test, you either fix or explicitly defer).

- [ ] **Step 11: Commit final fixes + tag**

```bash
git add -A
git commit -m "feat(doc-route): integrate DocHeader + RightPanel + Sonner toasts"
git tag phase-4a-complete
git log --oneline -20
```

- [ ] **Step 12: Final summary report**

Print a short summary of what shipped, test counts (before/after), and any deferred-to-roadmap items discovered during implementation. This is the handoff moment back to the user.

---

## Appendix: Execution Notes

### TDD discipline

Every task above uses the Write-Test-Fail-Implement-Pass-Commit loop. Do not skip the "run test and verify it fails first" step — that's how you know the test is actually exercising the new code path.

### When to ask questions vs. proceed

- If the spec text in §5 of `phase-4a-spec.md` conflicts with this plan, surface the conflict immediately before implementing.
- If a shadcn component's API differs from what's prompted in the frontend-design call, adapt the component wiring — don't rewrite the design.
- If a test helper like `buildTestApp` already exists under a different name in the current codebase, use the existing one.

### Frontend-design skill behavior

The skill returns polished React + Tailwind source. Your job after receiving it:

1. Save the files to the target paths
2. Verify the required props match (adjust if the skill improvised a slightly different shape)
3. Scan for inline hex colors — replace with shadcn tokens
4. Scan for missing `aria-label` on icon-only buttons
5. Run the behavioral tests; iterate if they fail

Do NOT post-hoc simplify the visuals. The polish is the feature.

### shadcn MCP usage cadence

- Before each install: `mcp__shadcn__get_add_command_for_items`
- After Task 17: `mcp__shadcn__get_audit_checklist`
- If any component feels off-brand: `mcp__shadcn__view_items_in_registries` to look at the canonical output

### Commits

Each task ends in a commit. Commit messages follow existing repo style (see `git log`).

### Branch protection

Work on `phase-4a-polish`. Do not push to main mid-work. The tag `phase-4a-complete` marks the merge point; open a PR to main after §10 of the spec's acceptance list is green.

