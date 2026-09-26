# Signed-in home: implementation plan

Status: in progress, 2026-09-26. Design: Round 7 option D (`/design/documents/documents-d` and `documents-d-project`), decisions in `docs/design-explorations/README.md` Round 7b.

## Rules the code follows

- **Team** is the word for what the database still calls a workspace. API fields and copy say team; tables stay.
- Every account gets a team at sign-up, named from the email domain ("Acme") or the first name ("Team Priya", slug team-priya). The plan does not follow membership: it is Free unless an admin override (later, a subscription) says Team. Free never sees the team name; Team users rename it from the account menu (`PATCH /api/teams/:id`, owner only).
- `/welcome` and `POST /api/teams` are kept but not linked from anywhere.
- Every document lives in a project. A person's **default project** (one per user, hidden) holds documents "not in a project". On Free that is the only project a person has. Projects the person creates or that belong to their team are the visible ones.
- A person sees: projects they own, projects in their teams, and their default project's documents. Team-mates' default projects are private to them.
- **Free** cannot create projects, move documents, or see anyone else's default project. **Team** (plan override today, subscription later) can.
- "Last edited" is anyone's edit: the name and colour of whoever made the most recent change, recorded from the WebSocket session's awareness state when the document persists.
- Open comment and suggestion counts are counted from the Yjs maps when the document persists and stored on the document row, so listing never decodes Yjs.
- Deleting a project moves its documents to the deleter's default project. The default project cannot be deleted.
- Claiming a project sets both its owner (the claimer) and its team.
- The claim strip on the home page shows while the browser holds creator keys for unclaimed projects, until dismissed. Never in the editor.

## Server

Schema (`prisma/schema.prisma`):
- `Project`: `ownerId String?` → `User`, `isDefault Boolean @default(false)`; index `[ownerId]`; unique partial on default per owner enforced in code.
- `Document`: `lastEditedByName String?`, `lastEditedByColor String?`, `openComments Int @default(0)`, `openSuggestions Int @default(0)`.

Routes (all session-based unless noted):
- `GET  /api/home` → `{ plan, team, projects[], documents[] }` (documents = default project's docs).
- `GET  /api/projects/:id` → `{ project, documents[] }` (visible projects only).
- `POST /api/documents { projectId? }` → creates a document in that project or the default one; returns project, document, edit and view tokens.
- `POST /api/projects { name }` (Team only).
- `PATCH /api/projects/:id { name }` (session, or creator token as today).
- `DELETE /api/projects/:id` (documents fall back to the caller's default project).
- `PATCH /api/docs/:id { projectId: string | null }` move; null = default project.
- `DELETE /api/docs/:id` (session, or creator token as today).
- Rename in existing routes: `/api/workspaces` → `/api/teams`, `MeResponse.workspaces` → `teams`, claim body `workspaceId` → `teamId`.
- Yjs handler: record last editor from the socket's awareness user on each update; compute open counts on persist.

## Client

- `/documents` (home) and `/documents/:projectId` (project page) built from option D with live data. Search and sort client-side; the many-projects table view kicks in past six projects.
- `AuthProvider` exposes `plan` and `teams`.
- Sign-in with no `next` lands on `/documents`. Welcome continues to `/claim` when the browser holds keys, otherwise `/documents`.
- Wordmark in the site header and utility bar, the editor's stencil mark, and the avatar menu's first item all go to `/documents` when signed in.
- Editor header: the wordmark-plus-initials block from the home header, with a background that works on indigo.
- "Start a spec" while signed in creates a document in the default project instead of an anonymous project.

## Out of scope for this pass

Status, "waiting on you", team switcher, second teams, billing, drag between groups.
