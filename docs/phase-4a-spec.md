# Katagami — Phase 4a Spec: Polish + Version History + Export

> **Status:** Approved design — ready for implementation planning
> **Date:** 2026-04-24
> **Depends on:** Phase 3 (tag `phase-3-complete`)
> **Parent spec:** [`mvp-spec.md`](./mvp-spec.md)
> **Sibling:** Phase 4b (multi-doc UI; separate spec to come)

---

## 1. Goal

Transform the Phase 3 MVP into a polished, demo-ready product by landing seven UX-critical features while restructuring the right-side panel to accommodate tabs (Docs stub / Comments / AI stub / History). This phase emphasizes **UI polish quality** — the "does this feel like a real product" bar is the primary success criterion alongside feature completeness.

**In scope for Phase 4a:**

1. Polished document header with editable title, icon, relative update time, connection/permission meta line
2. Tabbed right panel with animated expand/collapse active-tab pattern
3. Comments tab restructure (collapsible per-thread cards with reply-count badges)
4. History tab with auto + named snapshots, inline preview, Restore + Save-as-named
5. Avatar-menu dropdown (tri-state theme, rename, download, disabled Log-in placeholder)
6. Sonner toasts for connection, snapshots, remote comments
7. Markdown export (content-only download)
8. Empty states, reconnection UX, dark-mode polish, relative-time hook

**Explicitly NOT in 4a (moves to 4b or roadmap):**

- Multi-doc UI (Phase 4b) — we stub the Docs tab as a placeholder
- AI text operations — stub as Phase 5+ placeholder tab
- Fly.io deployment — roadmap
- Image upload — roadmap
- Markdown export with comments (round-trippable) — roadmap (only content-only export in 4a)
- Icon picker (per-doc custom icons) — roadmap
- Drag-to-resize panel width — roadmap
- WebSocket notifications for snapshots — roadmap (poll-based in 4a)
- Scroll sync, nested replies, hide-vs-resolve — all roadmap (spec carried from Phase 3)

---

## 2. Quality Bar

The primary non-functional goal of this phase is **production-grade visual polish**. Any component built in 4a should meet these standards:

- **Micro-animations on state transitions** — tab switching animates width; dropdown opens with slight scale/fade; toast slides in; modal has backdrop fade. No abrupt pops.
- **Keyboard accessibility** — full keyboard navigation for dropdowns, modals, tabs; visible focus rings; Escape dismisses overlays; Enter activates.
- **Dark-mode parity** — every color decision verified in both modes; no placeholder grey blocks that look different in dark.
- **Consistent spacing and type scale** — uses shadcn's token system (`var(--muted-foreground)`, `--border`, `--primary`); no one-off hex colors.
- **Hover and active feedback** — every interactive element has distinct hover + active + focus states.
- **Empty states never look broken** — even the stubbed tabs get considered visual treatment (not just "Coming soon" left-aligned text).

### Implementation mandate

Every UI task in the Phase 4a plan **must**:

1. Use shadcn MCP to install and verify components. Call `mcp__shadcn__get_add_command_for_items` before installing anything.
2. Invoke the `frontend-design:frontend-design` skill when crafting the visual design of headers, the tabbed panel, dropdowns, modals, toast variants, and empty states. The skill generates polished, non-generic UI code.
3. Run `mcp__shadcn__get_audit_checklist` as the final verification step.

---

## 3. Success Criteria

At Phase 4a completion, a user can:

1. See the doc's title, icon, relative update time, connection status, and permission level in a clean header. Click title to rename inline (with validation and save feedback).
2. Toggle the right panel on/off from a header button. Panel opens with a polished animation.
3. Switch between 4 tabs (Documents / Comments / AI / History) — active tab expands to show name + count; inactive tabs collapse to icon + optional notification dot. Transitions animate smoothly.
4. Expand/collapse individual comment threads in the Comments tab; collapsed cards show author + truncated body + reply count badge.
5. View snapshot history in the History tab: auto + named snapshots distinguished visually; click to preview inline; Restore creates a pre-restore safety snapshot; Save-as-named promotes an auto-snapshot.
6. Click the avatar to open a dropdown: switch theme between Light / System / Dark; rename themselves via a small modal; download the doc as Markdown; see a disabled "Log in" placeholder.
7. Receive Sonner toasts for connection changes, manual snapshot saves, snapshot restores (with Undo), and remote comment activity.
8. Download the current doc as a `.md` file with a meaningful filename.
9. See graceful empty states in every panel (History, Comments, Docs, AI) — none look broken.
10. Confirm all Phase 1-3 tests still pass plus ~46 new Phase 4a tests (see §8.2 for breakdown).

---

## 4. Architecture Changes

### Backend additions (server-side)

**New endpoints in `server/routes/documents.ts`:**
- `PATCH /api/docs/:id?key=<edit-token>` with `{ title: string | null }` → updates `Document.title`. Max 120 chars.

**New endpoints in `server/routes/snapshots.ts` (new file):**
- `GET /api/docs/:id/snapshots?key=<token>` → lists snapshots (any valid token)
- `POST /api/docs/:id/snapshots?key=<edit-token>` with `{ name?: string }` → creates a named snapshot of current state (edit-only)
- `POST /api/docs/:id/snapshots/:snapId/restore?key=<edit-token>` → creates pre-restore auto-snapshot, then applies the snapshot to the live Y.Doc
- `PATCH /api/docs/:id/snapshots/:snapId?key=<edit-token>` with `{ name: string }` → promotes an auto-snapshot to named
- `DELETE /api/docs/:id/snapshots/:snapId?key=<edit-token>` → delete named snapshot (auto-snapshots age out)

**New module `server/ws/snapshot-timer.ts`:**
- Tracks per-document last-edit timestamp inside the y-websocket handler
- After 5 min of idle (no edits), takes an auto-snapshot
- Rolling buffer: auto-snapshots limited to last 20 per document; older auto-snapshots are deleted when a new one pushes over the cap. Named snapshots are not counted in the 20 and are never deleted by this timer.
- `.unref()` on the timer so test teardown doesn't hang

**Snapshot data shape:**
- `Snapshot` table already exists (Phase 1). Need to add a `name: String?` column — null = auto-snapshot, non-null = named.
- Database migration: add `name String?` to `Snapshot` model.

### Frontend additions

**New routes:** none. Existing `/p/:projectId/d/:docId?key=...` remains the single document route.

**New / restructured components:**

```
src/
  components/
    header/
      DocHeader.tsx              # Icon + title + meta; editable title
      TitleEditor.tsx            # Click-to-edit inline title
      MetaLine.tsx               # Relative time + connection + permission
      SaveSnapshotButton.tsx     # Button + inline name popover
      PanelToggle.tsx            # Right-panel on/off button
      AvatarButton.tsx           # Colored circle with user initial
    avatar-menu/
      AvatarDropdown.tsx         # Dropdown content
      ThemeTriState.tsx          # [sun][monitor][moon] inline selector
      RenameModal.tsx            # Dialog for user rename
    panel/
      RightPanel.tsx             # The entire tabbed panel
      PanelTabs.tsx              # Animated expanding-icon tabs
      tabs/
        DocsTab.tsx              # Stub
        CommentsTab.tsx          # Migrated from Phase 3 CommentSidebar
        AiTab.tsx                # Stub
        HistoryTab.tsx           # New
    history/
      SnapshotList.tsx           # Chronological list
      SnapshotCard.tsx           # One snapshot entry
      SnapshotPreview.tsx        # Inline-expanded preview
  hooks/
    useRelativeTime.ts           # Re-renders every 60s
    useSnapshots.ts              # Poll + refresh on tab open
    usePanelVisibility.ts        # Sidebar open/closed, persisted
  lib/
    export/
      markdown-download.ts       # editor → Blob → filename → download
    api/
      snapshots.ts               # fetch helpers for snapshot endpoints
      documents.ts               # fetch helpers for title PATCH
  routes/
    Document.tsx                 # Major refactor: extract header, panel
```

**Modified:**
- `src/lib/theme/ThemeProvider.tsx` — upgrade to 3-state (`"light" | "dark" | "system"`). Default first-visit: `"system"`. Listens for system preference changes when set to `"system"`.
- `src/routes/Document.tsx` — refactored to compose the new DocHeader and RightPanel. Selection-action registry and thread handlers move into the new panel structure.
- `src/styles.css` — add any new tokens (none expected — shadcn's default set covers this).

**Removed / replaced:**
- `src/components/comments/CommentChip.tsx` — chip-based toggle goes away; replaced by PanelToggle in the header + notification dot on the Comments tab icon.
- `src/components/comments/CommentSidebar.tsx` — content migrates into `CommentsTab.tsx` (with the new per-thread collapse UX).
- `src/lib/theme/ThemeToggle.tsx` — replaced by ThemeTriState inside the dropdown.

### New dependencies

- `sonner` — installed via shadcn MCP (`@shadcn/sonner`)
- shadcn additions: `Dialog` (rename modal), `DropdownMenu` (avatar menu), `Tabs` (if helpful, or pure custom — decide during implementation)

---

## 5. Component Specs

### 5.1 DocHeader

Left column:
- **Icon** — lucide `FileText`, foreground color. 20px.
- **Title** — 18px semi-bold. Click to convert into a controlled `<input>` with current value; Enter or blur saves; Esc reverts. Placeholder when empty: `"Untitled"` (muted-foreground color). Max 120 chars enforced client-side.
- **Meta line** — small text (`text-xs text-muted-foreground`): `Updated <relative> · <connection> · <permission>`. Each piece separated by middle dot.

Right column (stacked two rows):
- Row 1 (top): `Save` button (with Bookmark icon), Edit/Preview segmented control, Panel toggle, Avatar
- Row 2 (if needed): no additional row; everything fits in one line at target width

Visual: bordered card feel, slight shadow. Responsive: at narrow widths, some controls migrate into the avatar dropdown (defer exact breakpoints to implementation).

### 5.2 TitleEditor

Minimal controlled component:
- Idle state: renders title as a clickable heading with subtle underline-on-hover
- Edit state: renders as an input with same font size, autofocused, selects all text on enter-to-edit
- Enter or blur: calls `PATCH /api/docs/:id` and updates local state
- Esc: reverts to previous value, exits edit state
- Validation: trim; reject if > 120 chars; show tiny error below on validation failure

### 5.3 MetaLine

- `Updated <relative-time>` — uses `useRelativeTime` hook. Tooltip shows absolute timestamp. Re-renders every 60 seconds.
- Connection status — direct reflection of y-websocket status
- Permission — `"editing"` (edit-URL) or `"view only"` (view-URL)

### 5.4 SaveSnapshotButton

- Button shows `Bookmark` icon + "Save" label
- Click opens a shadcn `Popover` anchored to the button with: input for name, `Save` / `Cancel` buttons, Enter to save
- On submit: calls `POST /api/docs/:id/snapshots { name }`; on success fires a toast `"Snapshot saved: <name>"`; popover closes
- Keyboard shortcut: `Cmd/Ctrl+Shift+S` opens the popover

### 5.5 RightPanel + PanelTabs

**RightPanel:**
- Persistent layout cell when open; zero width when closed
- State lives in `usePanelVisibility` hook (persists to localStorage `katagami:panel-open`)
- Opens/closes with a CSS transition (~200ms ease-out)
- `role="complementary"` + `aria-label="Document panel"`
- Width: 360px by default (comfortable, slightly wider than the 320px we used in Phase 3's CommentSidebar)

**PanelTabs:**
- 4 tabs in this order left-to-right: Documents, Comments, AI, History (locked per §10)
- Active tab: icon + label + count badge (if applicable)
- Inactive tabs: icon only + red dot indicator on new activity
- Hover tooltip (shadcn `Tooltip`) on inactive tabs showing the label
- Width animates on tab switch: active tab grows to fit label, inactive tabs shrink to icon-only. Use CSS `transition: flex 200ms ease-out` or Framer Motion if simple CSS feels insufficient.
- Keyboard: arrow-left/right navigates tabs; Enter activates; each tab is `role="tab"` under a `role="tablist"`

### 5.6 CommentsTab

Preserves Phase 3 comment behavior; restructures the UI:

**Per-thread collapsible card:**

Collapsed state — toggled by clicking the card's collapsed summary row. Default state for all threads on initial render is **expanded**; no read-tracking in 4a:
```
[●Sakura] "First 50 chars of the comment body ellipsized…"    [💬3]  [›]
```
- Author pill (color + name) + ellipsized body preview
- Right side: reply count badge (only if > 0), chevron-right
- Full card is clickable to expand

Expanded state (default):
```
┌──────────────────────────────────────────────────┐
│ "Anchored quote from document"                   │
│                                                  │
│ [●Sakura] · 2h ago                 [✓] [🗑] [∧] │
│                                                  │
│ Full comment body with                           │
│ whatever-long paragraphs.                        │
│                                                  │
│ ├ [●Tanuki] · 1h ago   [🗑]                      │
│ │ Reply body                                     │
│ ├ [●Sakura] · 30m ago  [🗑]                      │
│ │ Another reply                                  │
│                                                  │
│ [Reply composer (hidden until Reply clicked)]    │
└──────────────────────────────────────────────────┘
```

**Tab structure:**
- Sticky top: count label + "Show resolved" toggle (carried from Phase 3)
- Scrollable list: unresolved threads first (document order), then resolved (only when toggle is on)
- Empty state: `"No comments yet. Select text and click Comment."` with an encouraging illustration/icon

### 5.7 HistoryTab

```
┌──────────────────────────────────────────────────┐
│ ⭐ "Spec v1 - ready for review"                  │
│    Sakura · Mar 24, 3:40 PM                      │
│    "It was the best of times, …"                 │
│    [Restore] [✏️ Rename]                         │
├──────────────────────────────────────────────────┤
│ 🕐 Auto-snapshot                                 │
│    Just now                                      │
│    "It was the best of times, …"                 │
│    [Restore] [⭐ Save as named]                  │
├──────────────────────────────────────────────────┤
│ 🕐 Auto-snapshot                                 │
│    12m ago                                       │
│    ...                                           │
└──────────────────────────────────────────────────┘
```

**SnapshotCard** shows:
- Icon (⭐ for named, 🕐 for auto)
- Name (or "Auto-snapshot")
- Relative time + absolute tooltip
- ~80 char preview of doc content
- Actions: Restore (all), Rename (named), Save-as-named (auto), Delete (named)

**Expand on click:**
- Card expands in-place showing full doc text in a scrollable pre-formatted block
- Actions stay at the bottom when expanded
- Collapse affordance returns to compact card

**Polling:**
- `useSnapshots(docId, key)` hook fetches on mount and every 30s while component is mounted
- Cancels interval on unmount

### 5.8 AvatarButton + AvatarDropdown

**AvatarButton:**
- 32px circle
- Background = user's cursor color
- Inside: first letter of user's current name, uppercased, white, 13px bold
- Click: opens DropdownMenu

**Dropdown content** (shadcn `DropdownMenu`):

```
┌────────────────────────────────┐
│ [●] Sakura                     │  ← header row, non-interactive label
├────────────────────────────────┤
│ Theme       [☀️][🖥️][🌙]       │  ← ThemeTriState
├────────────────────────────────┤
│ ✎  Rename                      │  ← opens RenameModal
│ ↓  Download as Markdown        │  ← triggers export
├────────────────────────────────┤
│ →  Log in        (disabled)    │  ← tooltip: "Authentication coming in a future phase"
└────────────────────────────────┘
```

### 5.9 ThemeTriState

- 3 icon buttons in a row: `Sun` / `Monitor` / `Moon`
- Active button has shadcn `secondary` variant; inactive are `ghost`
- Click: calls `setTheme("light" | "system" | "dark")`
- Keyboard: Tab focuses each; Enter activates

### 5.10 RenameModal

- shadcn `Dialog` triggered from dropdown
- Title: "Rename yourself"
- Single input, prefilled with current name, autofocus
- Validation: 1-40 chars, trimmed
- `Save` (primary) / `Cancel` (ghost) buttons
- On save: `storeIdentity({ name, color })`, close dialog, awareness updates automatically
- Keyboard: Enter saves, Esc cancels

### 5.11 Sonner toasts

Install `@shadcn/sonner`. Wrap in `Toaster` at app root (`src/main.tsx`).

Toast variants used:

| Trigger | Variant | Message | Dismiss |
|---|---|---|---|
| WS status → disconnected | warning | "Lost connection — retrying…" | persistent |
| WS status → connected (after disconnect) | success | "Reconnected" | 2s |
| Manual snapshot saved | success | `"Snapshot saved: ${name}"` | 3s |
| Snapshot restored | success + Undo action | `"Restored ${name}"` (Undo restores the pre-restore auto-snapshot) | 5s |
| Remote comment added (thread created by another user) | info + View action | `"${author} commented"` (View clicks through to the thread in the Comments tab) | 4s |
| Remote reply added | info + View action | `"${author} replied"` | 4s |

Suppression rules:
- Don't toast your own actions (you clicked Post, you know)
- Don't toast during initial Yjs sync (only events AFTER the initial state arrives)
- Don't toast auto-snapshots (noise)

### 5.12 Markdown export

`markdown-download.ts` exports `downloadAsMarkdown(editor, title)`:
- Gets text content via `editor.getText({ blockSeparator: "\n\n" })`
- Strips `commentAnchor` marks (just keeps text)
- Filename: slugify(title) + ".md" or `"document-" + docId.slice(0, 8) + ".md"` if title empty
- Creates a `Blob` with type `"text/markdown"`, triggers download via dynamic `<a>` element

---

## 6. Theme Tri-state Upgrade

### 6.1 Changes to ThemeProvider

```typescript
type Theme = "light" | "dark" | "system";
```

- First visit default: `"system"` (previously: detect and store the result)
- When set to `"system"`: resolve via `matchMedia("(prefers-color-scheme: dark)")` at render + listen for changes
- When explicit: `"light"` / `"dark"` lock to that value; ignore system changes
- localStorage key stays `katagami:theme`; value set: `"light" | "dark" | "system"` (previously: only first two)

### 6.2 Migration

- Old stored values (`"light"` / `"dark"`) continue to work
- On first visit with no stored preference, store nothing (signal means "system"); or set to `"system"` explicitly for clarity

### 6.3 Test updates

- Extend existing `tests/client/theme-provider.test.tsx` to cover the new system state: verify `"system"` reads live from matchMedia, that changing system preference while set to system actually updates the class, and that switching away from system pins the value.

---

## 7. Polling, Connection, Reconnection Details

### 7.1 Snapshot polling

- `useSnapshots` polls `GET /api/docs/:id/snapshots` every 30s while the History tab is mounted
- Poll stops immediately on tab unmount / tab switch away from History
- Also fetches on tab enter (so data is current on every visit)

### 7.2 Title persistence conflict handling

- Title update is an HTTP PATCH. Concurrent renames: last-writer-wins at the DB level. No realtime sync for titles in 4a — acceptable because renames are rare and non-conflicting in practice.
- After a successful PATCH, the local state updates to reflect the new value. Refresh of metadata (pulling updated `updatedAt`) happens opportunistically via the next Yjs update event.

### 7.3 Reconnection sequencing

- On WS disconnect: show persistent warning toast
- On WS reconnect: dismiss the warning toast, show success toast (auto-dismiss 2s)
- Editor stays open and usable offline (Yjs offline queue) — this is existing behavior, not new

---

## 8. Testing Strategy

### 8.1 Preserve prior coverage

All tests from Phases 1, 2, 3 (123 at this writing) must continue to pass after 4a refactors. Changes to `Document.tsx` and theme provider will likely require updates to the existing `document-route.test.tsx` and `theme-provider.test.tsx`; update them minimally.

### 8.2 New tests

Estimated new test counts by area:

| Area | Tests |
|---|---|
| Title editor (click-to-edit, validation, Escape revert, Enter save) | ~5 |
| Relative time hook | ~3 |
| Theme tri-state (new system state, live response, pinning) | ~3 |
| Snapshot storage helpers (similar pattern to Phase 3 threads) | ~6 |
| Snapshot API endpoints (integration) | ~8 |
| Snapshot timer (auto-fire, rolling buffer, named preservation) | ~4 |
| useSnapshots polling hook | ~3 |
| Avatar dropdown + rename modal | ~3 |
| Markdown export helper | ~3 |
| Panel tabs (switching, state, tooltips on inactive) | ~3 |
| Comments tab thread collapse + reply count badge | ~3 |
| Sonner toast integration (wiring only; not rendering specifics) | ~2 |

Total estimated: ~46 new tests. Full suite at Phase 4a completion: ~170 tests.

### 8.3 Visual regression / snapshot testing

**Out of scope for 4a.** We don't currently have visual regression tests and adding that infrastructure is a Phase 5+ concern. Manual two-browser smoke test remains the final quality gate before tagging `phase-4a-complete`.

---

## 9. Acceptance

Phase 4a is done when:

1. All prior tests (123) still pass after refactors
2. ~46 new tests pass
3. `pnpm typecheck` + `pnpm lint` clean (≤ 4 pre-existing cosmetic warnings tolerated)
4. `pnpm build:client` succeeds
5. shadcn MCP audit checklist clean
6. Manual two-browser smoke test:
   - Both browsers show the polished header with title, icon, relative-time meta
   - Title editing in Browser A is reflected in Browser B on next metadata refresh
   - Tab switching in the panel animates smoothly on both browsers
   - Posting a comment in Browser A fires a toast in Browser B
   - Saving a named snapshot in Browser A shows up in Browser B's History tab within 30s
   - Restoring a snapshot in Browser A applies to both browsers' editors
   - Snapshot restore toast shows Undo action; clicking Undo restores the pre-restore state
   - Dark mode swap looks polished in both browsers; every element is legible
   - Avatar dropdown opens, ThemeTriState works, Rename modal updates the user's name on both browsers
   - Markdown download delivers a valid `.md` file with expected content
7. Tag `phase-4a-complete` at HEAD

---

## 10. Open Questions Explicitly Closed

These were discussed during brainstorming and are locked:

- Tab order: Documents, Comments, AI, History (left to right)
- Default tab: Comments (most-used functional)
- Auto-snapshot cadence: 5 min idle, rolling buffer of 20
- Named snapshots: persist forever, deleteable by author
- Snapshot restore: creates pre-restore auto-snapshot first (undo-friendly)
- Who can save/restore snapshots: edit-URL holders only
- Polling vs WebSocket: polling (30s interval, stops on unmount)
- Auto-snapshot attribution: none (anonymous); named has attribution
- Title permission model: edit-URL holders (not creator-only)
- Markdown export: content-only, no comments
- Theme dropdown: tri-state inline (light / system / dark)
- Rename UX: small modal (not popover)
- Log In: full label + icon, disabled, tooltip
- Avatar: colored circle + first letter of name

---

## Appendix: Frontend-Design Skill Integration

The implementation plan MUST direct subagents to invoke `frontend-design:frontend-design` for the following tasks:

- DocHeader design (overall composition, micro-interactions)
- RightPanel + PanelTabs (animation, empty-state presentation)
- AvatarDropdown (visual hierarchy, theme tri-state treatment)
- RenameModal (modal quality, input styling)
- HistoryTab SnapshotCard (visual distinction between named/auto, expand animation)
- Empty states (Documents stub, AI stub, History empty, Comments empty)
- Sonner toast variants (customization of appearance per variant)

For commodity components (Button/Input/etc. inside shadcn), skip `frontend-design` — use shadcn defaults.
