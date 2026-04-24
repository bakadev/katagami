# Phase 4a Manual Smoke Test

Run this after merging `phase-4a-polish` to `main` (or against the branch
directly). It walks every user-facing Phase 4a acceptance item from the spec.

## Setup

```bash
pnpm dev   # starts server + client
```

Open two browsers side-by-side:

- **Browser A** — regular window, signed into the doc with the edit URL
- **Browser B** — incognito / separate profile, same edit URL

Create a new project + doc:

```bash
curl -X POST http://localhost:3000/api/projects
```

Copy the `editToken` and `viewToken` from the response. Open
`http://localhost:5173/p/<projectId>/d/<docId>?key=<editToken>` in both
browsers.

## Checklist

### Header

- [ ] DocHeader renders at the top of the page with: FileText icon, title
      (or "Untitled" placeholder in italic muted), MetaLine below, Save /
      Edit-Preview / PanelToggle / Avatar on the right.
- [ ] Click the title → it becomes an inline input with same font size
      (zero pixel shift).
- [ ] Type a new title → press Enter → saves. Browser B picks it up on the
      next metadata refresh (or after any Yjs update).
- [ ] Escape reverts an in-progress edit.
- [ ] Typing > 120 chars + Enter → stays in edit mode with inline
      destructive error below.

### MetaLine

- [ ] "Updated N minutes ago" shows; hover reveals absolute timestamp
      tooltip.
- [ ] Connection dot: emerald halo when connected, destructive halo when
      disconnected, pulse when connecting.
- [ ] Permission text: "Editing" for the edit URL, "View only" for the
      view URL.

### Panel Toggle + Tabs

- [ ] PanelToggle (icon button, right of Avatar) collapses / expands the
      right panel with a ~200ms width transition.
- [ ] PanelTabs row: 4 tabs (Documents / Comments / AI / History). The
      active tab expands to show its label; others collapse to icon only.
- [ ] Clicking inactive tabs animates the width change.
- [ ] Keyboard: Tab into the tablist → arrow-left/right moves + activates
      each tab. Home/End jump to first/last.
- [ ] Hovering an inactive tab reveals a Tooltip with the full name.

### Comments Tab

- [ ] With no threads: polished empty state (44px disc + ring) shown.
- [ ] Select text in the editor → click the floating Comment button →
      composer appears → submit → new thread appears in the Comments tab.
- [ ] Post-submit: the panel opens on the Comments tab if it wasn't
      already.
- [ ] Each thread card renders expanded by default. Click the Collapse
      chevron → compact summary row with author dot + truncated body +
      reply-count badge when replies exist.
- [ ] Click the anchor quote in a thread → scrolls to the anchor in the
      editor and flashes the highlighted span.
- [ ] Reply / Resolve / Delete still work as in Phase 3.
- [ ] "Show resolved" checkbox only appears when at least one thread is
      resolved.

### AI Tab

- [ ] Polished stub with "AI rewriting is in development" and disabled
      "Notify me" button (tooltip: "Available in Phase 5").

### Documents Tab

- [ ] Polished stub with "Documents are coming soon" and disabled
      "Browse documents" button (tooltip: "Available in an upcoming
      update").

### History Tab

- [ ] With no snapshots: polished empty state with roadmap footer
      ("Auto-snapshots · last 20 kept").
- [ ] Click Save in the header → name popover → type "Spec v1" → Save →
      success toast "Snapshot saved: Spec v1".
- [ ] Switch to History tab in Browser A → the named snapshot appears.
- [ ] Within 30s, Browser B's History tab picks it up via polling.
- [ ] Expand a snapshot → preview block visible; Restore / Rename /
      Delete actions on named, Restore / Save-as-named on auto.
- [ ] Click Restore on a named snapshot in Browser A → toast "Restored"
      with Undo action. Both browsers' editors update.
- [ ] Click Undo → the pre-restore state comes back. Secondary toast
      "Couldn't undo" if that restore fails.
- [ ] Delete a named snapshot → inline confirmation popover → Confirm →
      snapshot disappears.

### Avatar Dropdown

- [ ] Click avatar → dropdown opens with identity header (color dot +
      name), Theme tri-state (Sun / Monitor / Moon), Rename, Download as
      Markdown, and disabled Log in with tooltip.
- [ ] Theme tri-state: click Sun → immediate light mode. Click Monitor
      → follows OS preference. Click Moon → dark mode. Sliding thumb
      animates smoothly (unless `prefers-reduced-motion` is on).
- [ ] System → change OS appearance → resolvedTheme flips live.
- [ ] Rename → modal opens → type new name → Save → awareness label in
      Browser B updates when focus returns.
- [ ] Download as Markdown → `.md` file downloads with a slug filename
      (e.g. `spec-v1.md`) or `document-<prefix>.md` if title is empty.

### Connection Toasts

- [ ] Stop the backend server while connected in Browser A → warning
      toast "Lost connection — retrying…" (persistent).
- [ ] Restart server → warning dismissed + success toast "Reconnected".

### Remote Comment Toasts

- [ ] Post a comment in Browser A → Browser B shows info toast
      `"<author> commented"` with a View action.
- [ ] Click View in Browser B → panel opens on Comments tab + editor
      scrolls to the anchored text.
- [ ] Reply in Browser A → Browser B shows `"<author> replied"` toast.
- [ ] Do NOT receive a toast for your own actions in the same browser.

### Read-Only Surface

Open the doc with the view URL in a third tab. Verify:

- [ ] Title editor is a plain heading, not clickable.
- [ ] Toolbar hidden.
- [ ] Save button disabled / absent.
- [ ] MetaLine says "View only".
- [ ] Comments tab: no Reply / Resolve / Delete buttons.
- [ ] History tab: cards are expandable but no Restore / Rename /
      Delete / Save-as-named.

### Dark Mode

- [ ] Switch to Dark via the avatar dropdown.
- [ ] DocHeader, PanelTabs, all four tab bodies, empty states, popovers,
      Dialog, and toasts remain legible — no white-on-white, no muddy
      tokens.

### Reduced Motion

- [ ] Enable "Reduce motion" in your OS. Thumb slide + panel expand are
      instantaneous; toasts still render but don't animate in.

## Pass criteria

Every item above checked. Any issues surfaced during smoke test get
filed in `docs/phase-4a-followups.md` with a short reason — do NOT block
the tag on polish-debt items the reviewers already flagged as deferred.

## Automated verification

Everything below must be green before running the manual pass:

```bash
pnpm typecheck   # clean
pnpm lint        # 0 errors, pre-existing warnings tolerated
pnpm build:client
pnpm test        # 217/217 (persistence.test.ts has an occasional flake; rerun once)
```
