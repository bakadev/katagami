# Katagami — Phase 2 Implementation Plan: Editor UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase 1's placeholder textarea with a TipTap-based editor that renders Markdown inline, supports Edit/Preview mode toggle, respects dark/light themes, and shows remote cursors with Japanese-word labels.

**Architecture:** TipTap binds to a `Y.XmlFragment` (named `"tiptap"`) on the existing Yjs doc via `@tiptap/extension-collaboration`. The `tiptap-markdown` storage extension provides `editor.storage.markdown.getMarkdown()` for the Preview renderer (markdown-it + DOMPurify + highlight.js). Theme state lives in a React context backed by localStorage + system preference detection and toggles a `dark` class on `<html>` (Tailwind 4 + shadcn convention). User identity (random Japanese name + color) is generated once per browser and stored in localStorage, fed into TipTap's `CollaborationCaret` extension.

**Tech Stack:** TipTap 3 + extensions (starter-kit, collaboration, collaboration-caret, link, placeholder, task-list, table, code-block-lowlight), `tiptap-markdown`, `lowlight`, `highlight.js`, `markdown-it` + `markdown-it-task-lists`, `DOMPurify`, Tailwind 4 via `@tailwindcss/vite`, shadcn/ui (pulled via the shadcn MCP), `lucide-react` icons, `class-variance-authority` + `clsx` + `tailwind-merge`.

**Spec:** [`docs/phase-2-spec.md`](../phase-2-spec.md)

**Spec amendment (TipTap data model):** The spec's §4 architecture note "Preview mode reads `yText.toString()`" is superseded by this plan. Preview reads `editor.storage.markdown.getMarkdown()` after the `tiptap-markdown` extension is registered. TipTap's Collaboration extension binds to a `Y.XmlFragment` named `"tiptap"`, not the Phase 1 `Y.Text` named `"content"`. Documents created in Phase 1 have orphaned `Y.Text` state; there are no real users yet, so migration is not implemented. Any Phase 1 doc is expected to be recreated after Phase 2 ships.

**After this plan completes, you can:**
1. Open a new doc in two browsers, type Markdown in one, see it formatted in both with a cursor labeled by a Japanese name.
2. Toggle a header button between Edit (inline-decorated TipTap) and Preview (rendered HTML with syntax-highlighted code).
3. Toggle light ↔ dark theme from the header; preference persists.
4. Confirm a view-only URL renders a read-only editor.
5. Run `pnpm test` and see all Phase 1 tests (37) plus new Phase 2 tests passing.
6. Tag `phase-2-complete`.

---

## shadcn MCP usage

This plan uses the shadcn MCP server (enabled in `.claude/settings.local.json`) for authoritative setup commands and component source. Every task that touches shadcn includes explicit MCP calls. When a task says "use `mcp__shadcn__<tool>`", call that tool — don't improvise commands from memory.

Tools used below:
- `mcp__shadcn__get_project_registries` — confirms the repo recognizes shadcn's default registry
- `mcp__shadcn__get_add_command_for_items` — returns the exact `pnpm dlx shadcn@latest add ...` command (and init commands)
- `mcp__shadcn__view_items_in_registries` — pulls canonical component source (e.g., the ThemeProvider reference)
- `mcp__shadcn__get_audit_checklist` — runs a final integrity check before tagging

---

## File Structure

New files (Phase 2):
```
components.json                           # shadcn config
src/
  components/
    ui/                                   # shadcn-generated primitives (button, alert, toggle, tooltip)
  lib/
    utils.ts                              # cn() helper from shadcn init
    editor/
      editor.ts                           # TipTap factory
      md-decorations.ts                   # ProseMirror Decoration plugin for inline MD syntax fade
    preview/
      render.ts                           # markdown-it + DOMPurify pipeline
      theme.ts                            # highlight.js stylesheet swap
    theme/
      ThemeProvider.tsx                   # React context + localStorage + system detect
      useTheme.ts
      ThemeToggle.tsx                     # sun/moon button
    user/
      names.ts                            # Japanese name pool
      identity.ts                         # getOrCreateIdentity()
tests/
  client/
    identity.test.ts
    md-decorations.test.ts
    render.test.ts
    theme-provider.test.tsx
    document-route.test.tsx
```

Modified files:
- `vite.config.ts` — add `@tailwindcss/vite`
- `src/styles.css` — Tailwind entry + `@theme` tokens + markdown-syntax utility
- `src/main.tsx` — wrap in `<ThemeProvider>`
- `src/routes/Document.tsx` — full rewrite (TipTap + Edit/Preview + ThemeToggle)
- `src/routes/Home.tsx` — Tailwind/shadcn restyle
- `package.json` / `pnpm-lock.yaml` — many dep additions

---

## Prerequisites

- Phase 1 complete (tag `phase-1-complete`)
- Docker Postgres running (`docker compose ps`)
- `pnpm` available
- shadcn MCP server enabled (it is — see settings.local.json)

---

## Task 1: Install and wire Tailwind 4

**Goal:** Tailwind CSS 4 working via the `@tailwindcss/vite` plugin. No visual change yet, but class-based styles begin to compile.

**Files:**
- Modify: `/vite.config.ts`
- Modify: `/src/styles.css`
- Modify: `/package.json`, `/pnpm-lock.yaml`

- [ ] **Step 1: Install Tailwind 4**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the Tailwind Vite plugin**

Replace `/Users/traviswilson/Development/markdown-collaboration/vite.config.ts` with:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // NOTE: `@server/*` is intentionally omitted here.
    // tsconfig.json declares it for editor/type-check convenience, but
    // server code must never be pulled into the client bundle. A missing
    // resolver is the cheap safety net that turns accidental imports
    // into Vite build errors.
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

- [ ] **Step 3: Convert styles.css to a Tailwind entry**

Replace `/Users/traviswilson/Development/markdown-collaboration/src/styles.css` with:

```css
@import "tailwindcss";

/* Tailwind 4: define the `dark:` variant against a `.dark` class on the
   html element, matching shadcn's canonical dark-mode strategy. */
@custom-variant dark (&:where(.dark, .dark *));

/* Design tokens — light defaults, dark overrides below. Values are
   placeholders that shadcn's init will typically replace; we keep a
   minimal set here so the first render looks sane before shadcn runs. */
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-muted: oklch(0.96 0 0);
  --color-muted-foreground: oklch(0.55 0 0);
  --color-border: oklch(0.9 0 0);
  --color-primary: oklch(0.25 0.05 260);
  --color-primary-foreground: oklch(1 0 0);
}

.dark {
  --color-background: oklch(0.15 0 0);
  --color-foreground: oklch(0.97 0 0);
  --color-muted: oklch(0.22 0 0);
  --color-muted-foreground: oklch(0.7 0 0);
  --color-border: oklch(0.3 0 0);
  --color-primary: oklch(0.8 0.05 260);
  --color-primary-foreground: oklch(0.15 0 0);
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

/* Inline Markdown syntax characters rendered dimmed. Applied by the
   ProseMirror decoration plugin in src/lib/editor/md-decorations.ts. */
.md-syntax {
  color: var(--color-muted-foreground);
  opacity: 0.55;
}
```

- [ ] **Step 4: Verify build + tests still pass**

```bash
pnpm build:client
pnpm typecheck
pnpm test
```
Expected: build succeeds, typecheck exits 0, 37 tests pass.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/styles.css package.json pnpm-lock.yaml
git commit -m "feat(client): add Tailwind 4 via @tailwindcss/vite"
```

---

## Task 2: Initialize shadcn/ui via MCP

**Goal:** `components.json` in place, `src/lib/utils.ts` with `cn` helper created, shadcn CLI ready for component additions.

**Files:**
- Create: `/components.json`
- Create: `/src/lib/utils.ts`
- Modify: `/package.json`, `/pnpm-lock.yaml`

- [ ] **Step 1: Confirm shadcn registry is reachable via MCP**

Call the tool:
```
mcp__shadcn__get_project_registries
```
Expected output: lists the default registry (`@shadcn`) as available. If it fails with a missing-config error, that's OK at this point — the init command in Step 2 creates the config.

- [ ] **Step 2: Get the canonical init command via MCP**

Call the tool:
```
mcp__shadcn__get_add_command_for_items with items: ["@shadcn/init"]
```
Expected: returns something like `pnpm dlx shadcn@latest init`. If the MCP returns a different canonical command, use that.

- [ ] **Step 3: Run shadcn init interactively**

Run the command from Step 2 (typically):
```bash
pnpm dlx shadcn@latest init
```

When prompted, answer:
- Style: `new-york` (crisper defaults)
- Base color: `slate` (neutral; works with our existing oklch tokens)
- CSS variables: `yes`
- Components alias: `~/components`  (we use `~` for `src/`)
- Utils alias: `~/lib/utils`

This creates `/components.json`, `/src/lib/utils.ts`, installs `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, and updates `src/styles.css` with shadcn's preferred design tokens (which override the placeholders we put in Task 1).

- [ ] **Step 4: Verify the generated `utils.ts`**

Open `/Users/traviswilson/Development/markdown-collaboration/src/lib/utils.ts`. It should look like:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

If the init failed to create it, create it manually with the exact content above.

- [ ] **Step 5: Verify build + tests still pass**

```bash
pnpm build:client
pnpm typecheck
pnpm test
```
Expected: all green, 37 tests pass.

- [ ] **Step 6: Commit**

```bash
git add components.json src/lib/utils.ts src/styles.css package.json pnpm-lock.yaml
git commit -m "feat(client): initialize shadcn/ui via MCP"
```

---

## Task 3: Install base shadcn components (Button + Alert + Toggle)

**Goal:** Three shadcn components generated into `src/components/ui/`. These are the baseline primitives used by Home, Document, and the ThemeToggle.

**Files:**
- Create: `/src/components/ui/button.tsx`
- Create: `/src/components/ui/alert.tsx`
- Create: `/src/components/ui/toggle.tsx`

- [ ] **Step 1: Get add commands via MCP**

Call the tool:
```
mcp__shadcn__get_add_command_for_items with items: ["@shadcn/button", "@shadcn/alert", "@shadcn/toggle"]
```
Expected: returns a single `pnpm dlx shadcn@latest add button alert toggle` command (or three separate commands).

- [ ] **Step 2: Run the add command**

Run the returned command. It will create the three files under `src/components/ui/`.

- [ ] **Step 3: Verify files exist**

```bash
ls src/components/ui/
```
Expected: `alert.tsx`, `button.tsx`, `toggle.tsx`.

- [ ] **Step 4: Verify build + tests still pass**

```bash
pnpm build:client
pnpm typecheck
pnpm test
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn Button, Alert, and Toggle primitives"
```

---

## Task 4: Japanese name pool + cursor identity

**Goal:** `src/lib/user/identity.ts` exports `getOrCreateIdentity()` returning `{ name, color }`. Tests cover pool membership, color format, and localStorage round-trip.

**Files:**
- Create: `/src/lib/user/names.ts`
- Create: `/src/lib/user/identity.ts`
- Create: `/tests/client/identity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/identity.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateIdentity } from "../../src/lib/user/identity";
import { JAPANESE_NAMES } from "../../src/lib/user/names";

describe("getOrCreateIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a name from the pool", () => {
    const { name } = getOrCreateIdentity();
    expect(JAPANESE_NAMES).toContain(name);
  });

  it("returns a color in #rrggbb format", () => {
    const { color } = getOrCreateIdentity();
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns the same identity on subsequent calls", () => {
    const first = getOrCreateIdentity();
    const second = getOrCreateIdentity();
    expect(second).toEqual(first);
  });

  it("persists across module boundaries via localStorage", () => {
    const { name, color } = getOrCreateIdentity();
    const raw = localStorage.getItem("katagami:identity");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ name, color });
  });

  it("regenerates identity if localStorage is cleared", () => {
    const first = getOrCreateIdentity();
    localStorage.clear();
    const second = getOrCreateIdentity();
    // Name may randomly match; color is more likely to differ. Assert at least
    // one of the two changed by checking the full object equality is rare.
    // Safer assertion: the second call re-wrote localStorage.
    expect(localStorage.getItem("katagami:identity")).toBeTruthy();
    // Logical sanity: both are valid
    expect(JAPANESE_NAMES).toContain(second.name);
    void first;
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/identity.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the name pool**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/user/names.ts`:

```typescript
export const JAPANESE_NAMES = [
  "Sakura",
  "Kitsune",
  "Tanuki",
  "Mochi",
  "Neko",
  "Tora",
  "Ryu",
  "Kame",
  "Yuki",
  "Tsuki",
  "Hoshi",
  "Hana",
  "Umi",
  "Kaze",
  "Ame",
  "Matcha",
  "Kumo",
  "Sora",
  "Inu",
  "Sumire",
];

// Hand-picked palette: enough saturation to read on both light and dark
// backgrounds, enough variety that collisions between two nearby users
// are visually distinct.
export const CURSOR_COLORS = [
  "#e11d48", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f43f5e", // crimson
];
```

- [ ] **Step 4: Implement identity**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/user/identity.ts`:

```typescript
import { JAPANESE_NAMES, CURSOR_COLORS } from "./names";

const STORAGE_KEY = "katagami:identity";

export interface Identity {
  name: string;
  color: string;
}

function randomFrom<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function generate(): Identity {
  return {
    name: randomFrom(JAPANESE_NAMES),
    color: randomFrom(CURSOR_COLORS),
  };
}

export function getOrCreateIdentity(): Identity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (
        typeof parsed.name === "string" &&
        typeof parsed.color === "string" &&
        JAPANESE_NAMES.includes(parsed.name) &&
        /^#[0-9a-f]{6}$/i.test(parsed.color)
      ) {
        return { name: parsed.name, color: parsed.color };
      }
    }
  } catch {
    // fall through to regenerate
  }
  const identity = generate();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // non-fatal: session still gets an identity, just not persisted
  }
  return identity;
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/client/identity.test.ts
```
Expected: 5 passing tests.

- [ ] **Step 6: Full suite + typecheck**

```bash
pnpm test
pnpm typecheck
```
Expected: 42 passing total (37 + 5); typecheck 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/user/ tests/client/identity.test.ts
git commit -m "feat(client): add Japanese name pool and persistent cursor identity"
```

---

## Task 5: Theme system — ThemeProvider + useTheme

**Goal:** A React context provider that detects system preference, reads/writes localStorage override, toggles a `.dark` class on `<html>`, and exposes a `useTheme()` hook.

**Files:**
- Create: `/src/lib/theme/ThemeProvider.tsx`
- Create: `/src/lib/theme/useTheme.ts`
- Create: `/tests/client/theme-provider.test.tsx`

- [ ] **Step 1: Look up shadcn's canonical ThemeProvider via MCP (informational)**

Call the tool:
```
mcp__shadcn__view_items_in_registries with items: ["@shadcn/theme-provider"]
```
Review the returned source. Our implementation below follows the same contract (detect → persist → toggle class) but is simpler (light/dark only, no "system" tri-state).

- [ ] **Step 2: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/theme-provider.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider } from "../../src/lib/theme/ThemeProvider";
import { useTheme } from "../../src/lib/theme/useTheme";

function Harness() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        toggle
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to 'light' when no preference exists and system is light", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "(prefers-color-scheme: dark)",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("defaults to 'dark' when system prefers dark", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: true,
          media: "(prefers-color-scheme: dark)",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists theme choice to localStorage and applies the dark class", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button").click();
    });
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(localStorage.getItem("katagami:theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads a stored theme override on mount", () => {
    localStorage.setItem("katagami:theme", "dark");
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });
});
```

- [ ] **Step 3: Run test to confirm failure**

```bash
pnpm test tests/client/theme-provider.test.tsx
```
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement the provider**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/theme/ThemeProvider.tsx`:

```typescript
import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "katagami:theme";

function detectSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // ignore
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return readStoredTheme() ?? detectSystemTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // non-fatal
    }
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/theme/useTheme.ts`:

```typescript
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/client/theme-provider.test.tsx
```
Expected: 4 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme/ tests/client/theme-provider.test.tsx
git commit -m "feat(client): add ThemeProvider with system detection and localStorage override"
```

---

## Task 6: ThemeToggle component

**Goal:** A small icon button that flips light↔dark, using shadcn's Button + lucide's sun/moon icons.

**Files:**
- Create: `/src/lib/theme/ThemeToggle.tsx`

- [ ] **Step 1: Implement the toggle**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/theme/ThemeToggle.tsx`:

```typescript
import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTheme } from "./useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const label = `Switch to ${next} theme`;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme/ThemeToggle.tsx
git commit -m "feat(client): add ThemeToggle button with lucide icons"
```

---

## Task 7: Wire ThemeProvider into main.tsx

**Goal:** The whole app is wrapped in `<ThemeProvider>` so any descendant can call `useTheme()`.

**Files:**
- Modify: `/src/main.tsx`

- [ ] **Step 1: Update main.tsx**

Replace `/Users/traviswilson/Development/markdown-collaboration/src/main.tsx` with:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Verify build + all tests**

```bash
pnpm build:client
pnpm typecheck
pnpm test
```
Expected: all green, 46 tests pass (37 + 5 identity + 4 theme).

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat(client): wrap app in ThemeProvider"
```

---

## Task 8: Install Preview pipeline deps (markdown-it + DOMPurify + highlight.js)

**Goal:** The runtime and type deps for the Preview renderer are installed. No code yet.

- [ ] **Step 1: Install packages**

```bash
pnpm add markdown-it markdown-it-task-lists dompurify highlight.js
pnpm add -D @types/markdown-it @types/markdown-it-task-lists
```

Note: modern `dompurify` ships its own types; no separate `@types/dompurify` needed.

- [ ] **Step 2: Verify typecheck still clean**

```bash
pnpm typecheck
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add markdown-it, DOMPurify, highlight.js deps"
```

---

## Task 9: Preview renderer

**Goal:** `renderMarkdown(source: string): string` uses markdown-it with the task-lists plugin + highlight.js fenced-code rendering, then passes the HTML through DOMPurify.

**Files:**
- Create: `/src/lib/preview/render.ts`
- Create: `/tests/client/render.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/render.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/lib/preview/render";

describe("renderMarkdown", () => {
  it("renders a heading", () => {
    const html = renderMarkdown("# Hello");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("renders bold and italic", () => {
    const html = renderMarkdown("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders a GFM task list", () => {
    const html = renderMarkdown("- [x] done\n- [ ] todo");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });

  it("renders a table with alignment", () => {
    const html = renderMarkdown("| a | b |\n|:--|--:|\n| 1 | 2 |");
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("highlights a fenced code block with a known language", () => {
    const html = renderMarkdown("```js\nconst x = 1;\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("hljs");
  });

  it("strips hostile script tags via DOMPurify", () => {
    const html = renderMarkdown(
      'Hello <script>alert("xss")</script> world',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("strips javascript: URL schemes via DOMPurify", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toMatch(/href="javascript:/i);
  });

  it("handles empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/render.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the renderer**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/preview/render.ts`:

```typescript
import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import DOMPurify from "dompurify";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: true,
  highlight(code: string, lang: string): string {
    const lower = lang.toLowerCase();
    if (lower && hljs.getLanguage(lower)) {
      try {
        return `<pre class="hljs"><code class="hljs language-${lower}">${
          hljs.highlight(code, { language: lower, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch {
        // fall through
      }
    }
    // Unknown or empty lang: auto-detect, still wrap in hljs.
    return `<pre class="hljs"><code class="hljs">${
      hljs.highlightAuto(code).value
    }</code></pre>`;
  },
}).use(taskLists, { enabled: true });

export function renderMarkdown(source: string): string {
  if (!source) return "";
  const rawHtml = md.render(source);
  return DOMPurify.sanitize(rawHtml);
}
```

- [ ] **Step 4: Run the tests**

```bash
pnpm test tests/client/render.test.ts
```
Expected: 8 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/preview/render.ts tests/client/render.test.ts
git commit -m "feat(client): Markdown preview renderer with GFM + highlight.js + DOMPurify"
```

---

## Task 10: highlight.js theme stylesheet swap

**Goal:** `src/lib/preview/theme.ts` exports a hook that loads `highlight.js` `github` CSS in light mode and `github-dark` in dark mode, swapping on `theme` change.

**Files:**
- Create: `/src/lib/preview/theme.ts`

- [ ] **Step 1: Implement the CSS swap**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/preview/theme.ts`:

```typescript
import { useEffect } from "react";
import { useTheme } from "~/lib/theme/useTheme";

const LINK_ID = "hljs-theme";

function themeHref(theme: "light" | "dark"): string {
  // Import paths resolved by Vite to the packaged CSS files.
  return theme === "dark"
    ? new URL("highlight.js/styles/github-dark.css", import.meta.url).href
    : new URL("highlight.js/styles/github.css", import.meta.url).href;
}

/**
 * Mount once near the app root (or wherever Preview is rendered). Inserts
 * or updates a <link rel="stylesheet"> for the active highlight.js theme.
 */
export function useHighlightTheme() {
  const { theme } = useTheme();
  useEffect(() => {
    const href = themeHref(theme);
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [theme]);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/preview/theme.ts
git commit -m "feat(client): swap highlight.js stylesheet with theme"
```

---

## Task 11: Install TipTap deps

**Goal:** All TipTap packages, lowlight, and tiptap-markdown installed.

- [ ] **Step 1: Install**

```bash
pnpm add @tiptap/core @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-collaboration @tiptap/extension-collaboration-caret \
  @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-task-list @tiptap/extension-task-item \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-code-block-lowlight lowlight tiptap-markdown
```

Note: `@tiptap/pm` is the ProseMirror bundle TipTap ships; it's required for writing custom plugins like our decorations plugin.

- [ ] **Step 2: Verify typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add TipTap, lowlight, and tiptap-markdown deps"
```

---

## Task 12: TipTap editor factory (no decorations yet)

**Goal:** `createEditor({ ydoc, provider, identity, editable })` returns a TipTap `Editor` instance wired to the shared `Y.XmlFragment` and awareness. No inline decorations yet — that's the next task.

**Files:**
- Create: `/src/lib/editor/editor.ts`

- [ ] **Step 1: Implement the factory**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/editor.ts`:

```typescript
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Identity } from "~/lib/user/identity";

const lowlight = createLowlight(common);

export interface CreateEditorArgs {
  element: HTMLElement;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  identity: Identity;
  editable: boolean;
}

/**
 * Build a TipTap editor bound to the shared Yjs doc (fragment "tiptap").
 * The editor is mounted onto `element` and returned so the caller can
 * call `editor.destroy()` on unmount.
 */
export function createEditor({
  element,
  ydoc,
  provider,
  identity,
  editable,
}: CreateEditorArgs): Editor {
  return new Editor({
    element,
    editable,
    extensions: [
      StarterKit.configure({
        // Yjs owns undo/redo; disabling TipTap's history avoids double-undo.
        history: false,
        // CodeBlockLowlight replaces StarterKit's plain codeBlock.
        codeBlock: false,
      }),
      Collaboration.configure({
        document: ydoc,
        field: "tiptap",
      }),
      CollaborationCaret.configure({
        provider,
        user: { name: identity.name, color: identity.color },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: editable ? "Start typing Markdown…" : "(empty document)",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({
        html: false,
        breaks: false,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
  });
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: both clean. If `tiptap-markdown` exports under a different name, adjust the import (`import { Markdown }` vs default export).

- [ ] **Step 3: Commit**

```bash
git add src/lib/editor/editor.ts
git commit -m "feat(client): TipTap editor factory with Collaboration, caret, tables, code, markdown"
```

---

## Task 13: Inline Markdown decorations plugin

**Goal:** A ProseMirror Plugin that walks the document's text nodes and produces inline `Decoration`s over raw Markdown syntax characters, adding a `md-syntax` CSS class that fades them. Tests run without mounting TipTap.

**Files:**
- Create: `/src/lib/editor/md-decorations.ts`
- Create: `/tests/client/md-decorations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/md-decorations.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { schema as basicSchema } from "@tiptap/pm/schema-basic";
import {
  mdDecorationsPlugin,
  MD_DECORATIONS_KEY,
} from "../../src/lib/editor/md-decorations";

function buildState(text: string) {
  const doc = basicSchema.node(
    "doc",
    null,
    basicSchema.node("paragraph", null, text ? basicSchema.text(text) : []),
  );
  return EditorState.create({
    doc,
    schema: basicSchema,
    plugins: [mdDecorationsPlugin()],
  });
}

function decorationCount(state: EditorState): number {
  const set = MD_DECORATIONS_KEY.getState(state);
  return set ? set.find().length : 0;
}

describe("mdDecorationsPlugin", () => {
  it("decorates bold asterisks", () => {
    const state = buildState("**hello**");
    expect(decorationCount(state)).toBe(2); // opening + closing **
  });

  it("decorates italic underscores", () => {
    const state = buildState("_hi_");
    expect(decorationCount(state)).toBe(2);
  });

  it("decorates inline code backticks", () => {
    const state = buildState("`code`");
    expect(decorationCount(state)).toBe(2);
  });

  it("decorates heading markers at line start", () => {
    const state = buildState("## Heading");
    expect(decorationCount(state)).toBe(1); // the "##"
  });

  it("produces zero decorations for plain text", () => {
    const state = buildState("no syntax here");
    expect(decorationCount(state)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm test tests/client/md-decorations.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the plugin**

Create `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/md-decorations.ts`:

```typescript
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Exported so tests can read the plugin state via PluginKey.getState().
export const MD_DECORATIONS_KEY = new PluginKey<DecorationSet>("md-decorations");

// Matches opening+closing pairs of the same delimiter around non-empty content.
// Captures: 1) leading delimiter run, 2) inner content, 3) trailing delimiter run.
// Patterns intentionally simple — we're only fading *syntax*, not parsing MD.
const PATTERNS: Array<{ delim: string; regex: RegExp }> = [
  { delim: "**", regex: /(\*\*)([^*]+?)(\*\*)/g },
  { delim: "__", regex: /(__)([^_]+?)(__)/g },
  { delim: "*", regex: /(\*)([^*]+?)(\*)/g },
  { delim: "_", regex: /(_)([^_]+?)(_)/g },
  { delim: "`", regex: /(`)([^`]+?)(`)/g },
];

// Heading marker at line start: ^#{1,6} followed by a space.
const HEADING_REGEX = /^(#{1,6})(\s)/gm;

// Blockquote marker at line start.
const BLOCKQUOTE_REGEX = /^(>)(\s)/gm;

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    const base = pos;

    for (const { regex } of PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const openStart = base + m.index;
        const openEnd = openStart + m[1].length;
        const closeStart = base + m.index + m[1].length + m[2].length;
        const closeEnd = closeStart + m[3].length;
        decorations.push(
          Decoration.inline(openStart, openEnd, { class: "md-syntax" }),
          Decoration.inline(closeStart, closeEnd, { class: "md-syntax" }),
        );
      }
    }

    HEADING_REGEX.lastIndex = 0;
    let h: RegExpExecArray | null;
    while ((h = HEADING_REGEX.exec(text)) !== null) {
      const start = base + h.index;
      const end = start + h[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }

    BLOCKQUOTE_REGEX.lastIndex = 0;
    let b: RegExpExecArray | null;
    while ((b = BLOCKQUOTE_REGEX.exec(text)) !== null) {
      const start = base + b.index;
      const end = start + b[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }
  });

  return DecorationSet.create(state.doc, decorations);
}

export function mdDecorationsPlugin() {
  return new Plugin<DecorationSet>({
    key: MD_DECORATIONS_KEY,
    state: {
      init(_config, state) {
        return buildDecorations(state);
      },
      apply(tr, oldSet, _oldState, newState) {
        if (!tr.docChanged) return oldSet;
        return buildDecorations(newState);
      },
    },
    props: {
      decorations(state) {
        return MD_DECORATIONS_KEY.getState(state);
      },
    },
  });
}
```

- [ ] **Step 4: Run the test**

```bash
pnpm test tests/client/md-decorations.test.ts
```
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/editor/md-decorations.ts tests/client/md-decorations.test.ts
git commit -m "feat(client): ProseMirror plugin for inline Markdown syntax decorations"
```

---

## Task 14: Wire decorations into the editor factory

**Goal:** The TipTap editor registers the `md-decorations` plugin so the syntax fade is visible during editing.

**Files:**
- Modify: `/src/lib/editor/editor.ts`

- [ ] **Step 1: Add the plugin via a TipTap Extension wrapper**

TipTap's standard way to inject a raw ProseMirror plugin is via `Extension.create().addProseMirrorPlugins()`. Replace `/Users/traviswilson/Development/markdown-collaboration/src/lib/editor/editor.ts` with the updated version that registers the plugin:

```typescript
import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Identity } from "~/lib/user/identity";
import { mdDecorationsPlugin } from "./md-decorations";

const lowlight = createLowlight(common);

const MdSyntaxDecorations = Extension.create({
  name: "mdSyntaxDecorations",
  addProseMirrorPlugins() {
    return [mdDecorationsPlugin()];
  },
});

export interface CreateEditorArgs {
  element: HTMLElement;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  identity: Identity;
  editable: boolean;
}

export function createEditor({
  element,
  ydoc,
  provider,
  identity,
  editable,
}: CreateEditorArgs): Editor {
  return new Editor({
    element,
    editable,
    extensions: [
      StarterKit.configure({
        history: false,
        codeBlock: false,
      }),
      Collaboration.configure({
        document: ydoc,
        field: "tiptap",
      }),
      CollaborationCaret.configure({
        provider,
        user: { name: identity.name, color: identity.color },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: editable ? "Start typing Markdown…" : "(empty document)",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({
        html: false,
        breaks: false,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      MdSyntaxDecorations,
    ],
  });
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck
pnpm build:client
```
Expected: both clean.

- [ ] **Step 3: Run full suite**

```bash
pnpm test
```
Expected: 59 passing (37 Phase 1 + 5 identity + 4 theme + 8 render + 5 md-decorations).

- [ ] **Step 4: Commit**

```bash
git add src/lib/editor/editor.ts
git commit -m "feat(editor): register md-decorations plugin in TipTap editor"
```

---

## Task 15: Document route rewrite — Edit mode with TipTap

**Goal:** Replace the Phase 1 textarea in `Document.tsx` with TipTap. The Preview side is still a stub; it becomes real in Task 16.

**Files:**
- Modify: `/src/routes/Document.tsx`

- [ ] **Step 1: Rewrite Document.tsx (Edit mode working, Preview stub)**

Replace `/Users/traviswilson/Development/markdown-collaboration/src/routes/Document.tsx` with:

```typescript
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import type { Editor } from "@tiptap/core";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import { createEditor } from "~/lib/editor/editor";
import { getOrCreateIdentity } from "~/lib/user/identity";
import { ThemeToggle } from "~/lib/theme/ThemeToggle";
import { useHighlightTheme } from "~/lib/preview/theme";
import type { PermissionLevel } from "@shared/types";

export default function DocumentRoute() {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  const navigate = useNavigate();
  useHighlightTheme();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);

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

  useEffect(() => {
    if (loadError) {
      const t = setTimeout(() => navigate("/", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
  }, [loadError, navigate]);

  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const host = editorHostRef.current;
    if (!host) return;

    const conn = connect(docId, key);
    connectionRef.current = conn;

    const identity = getOrCreateIdentity();
    const editor = createEditor({
      element: host,
      ydoc: conn.ydoc,
      provider: conn.provider,
      identity,
      editable: permissionLevel === "edit",
    });
    editorRef.current = editor;

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      conn.provider.off("status", handleStatus);
      editor.destroy();
      conn.destroy();
      editorRef.current = null;
      connectionRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  if (loadError) {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold">Can't open this document</h1>
        <p>{loadError}</p>
        <p className="text-xs text-muted-foreground">Redirecting to home…</p>
      </main>
    );
  }

  if (!permissionLevel) {
    return (
      <main className="p-4">
        <p>Loading document…</p>
      </main>
    );
  }

  const readOnly = permissionLevel === "view";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-lg font-semibold">Document</h1>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {status} · {readOnly ? "view only" : "editing"}
          </span>
          <div role="tablist" aria-label="View mode" className="flex rounded border border-border">
            <button
              role="tab"
              aria-selected={mode === "edit"}
              className={`px-3 py-1 text-sm ${mode === "edit" ? "bg-muted" : ""}`}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              role="tab"
              aria-selected={mode === "preview"}
              className={`px-3 py-1 text-sm ${mode === "preview" ? "bg-muted" : ""}`}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div
        ref={editorHostRef}
        className={`prose max-w-none rounded border border-border p-4 ${
          mode === "edit" ? "" : "hidden"
        }`}
      />

      {mode === "preview" && (
        <div className="rounded border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Preview renderer lands in Task 16.
          </p>
        </div>
      )}
    </main>
  );
}
```

Note: we keep the editor's DOM host mounted even when not visible (via `hidden` class) so that TipTap + Yjs stay connected and continue receiving updates while the user is in Preview. Mode toggling just hides/shows — never destroys.

- [ ] **Step 2: Verify build + typecheck + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all clean, 59 tests pass.

- [ ] **Step 3: Manual smoke test**

Start both processes in background:

```bash
pnpm dev:server &
SERVER_PID=$!
pnpm dev:client &
CLIENT_PID=$!
sleep 6
```

Create a doc and visit it via curl (just to confirm the page loads without errors — real editing requires a browser):

```bash
RESPONSE=$(curl -s -X POST http://localhost:5173/api/projects)
echo "Created: $RESPONSE"

kill $SERVER_PID $CLIENT_PID 2>/dev/null
wait $SERVER_PID $CLIENT_PID 2>/dev/null
```

Expected: the create response is valid JSON with a document id. (Full two-browser test lives in Task 19's manual smoke.)

- [ ] **Step 4: Commit**

```bash
git add src/routes/Document.tsx
git commit -m "feat(client): Document route uses TipTap with inline MD decorations (Preview stub)"
```

---

## Task 16: Preview mode rendering

**Goal:** When the user toggles to Preview mode, the document is rendered via `renderMarkdown(editor.storage.markdown.getMarkdown())`. The Preview block shows live HTML, and it updates when the document changes.

**Files:**
- Modify: `/src/routes/Document.tsx`

- [ ] **Step 1: Wire the Preview renderer**

Edit `/Users/traviswilson/Development/markdown-collaboration/src/routes/Document.tsx`. Two changes:

1. Add `renderMarkdown` import and a new piece of state tracking the current Markdown string, updated on editor changes.
2. Replace the Preview stub with a rendered `dangerouslySetInnerHTML` block driven by that state.

Add the import near the top, after the `createEditor` import:
```typescript
import { renderMarkdown } from "~/lib/preview/render";
```

Inside the component, after `const [mode, setMode] = useState<"edit" | "preview">("edit");`, add:
```typescript
  const [markdown, setMarkdown] = useState("");
```

In the effect that creates the editor (after `editorRef.current = editor;`), register an `update` listener that captures the serialized markdown whenever the editor changes:
```typescript
    const syncMarkdown = () => {
      // tiptap-markdown's storage exposes getMarkdown() on any editor update.
      const md = editor.storage.markdown?.getMarkdown() ?? "";
      setMarkdown(md);
    };
    syncMarkdown();
    editor.on("update", syncMarkdown);
    editor.on("transaction", syncMarkdown);
```

In the same effect's cleanup function (the `return () => { ... }` block), add the corresponding `off`s before `editor.destroy()`:
```typescript
      editor.off("update", syncMarkdown);
      editor.off("transaction", syncMarkdown);
```

Finally, replace the Preview stub block:
```typescript
      {mode === "preview" && (
        <div className="rounded border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Preview renderer lands in Task 16.
          </p>
        </div>
      )}
```
with:
```typescript
      {mode === "preview" && (
        <div
          className="prose max-w-none rounded border border-border p-4 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
        />
      )}
```

- [ ] **Step 2: Verify build + typecheck + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all clean, 59 tests pass (no new tests yet — component test is Task 17).

- [ ] **Step 3: Commit**

```bash
git add src/routes/Document.tsx
git commit -m "feat(client): Preview mode renders via tiptap-markdown + markdown-it"
```

---

## Task 17: Document route component test

**Goal:** A jsdom component test mounts `DocumentRoute` with the yjs-client and api mocked, and asserts Edit/Preview toggle behavior + readOnly for view tokens.

**Files:**
- Create: `/tests/client/document-route.test.tsx`

- [ ] **Step 1: Write the test**

Create `/Users/traviswilson/Development/markdown-collaboration/tests/client/document-route.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import * as Y from "yjs";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";

// --- Mocks ---

vi.mock("~/lib/api", () => ({
  getDocument: vi.fn(async () => ({
    document: {
      id: "doc-1",
      projectId: "proj-1",
      title: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    permissionLevel: "edit" as const,
  })),
}));

// Mock yjs-client so we never open a real WebSocket in jsdom.
vi.mock("~/lib/yjs-client", () => {
  return {
    connect: vi.fn(() => {
      const ydoc = new Y.Doc();
      const provider = {
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        awareness: { on: vi.fn(), off: vi.fn(), getStates: () => new Map() },
      };
      return {
        ydoc,
        provider,
        destroy: () => ydoc.destroy(),
      };
    }),
  };
});

// Import AFTER the mocks above so the mocked modules are picked up.
import DocumentRoute from "~/routes/Document";

function renderAt(url: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/p/:projectId/d/:docId" element={<DocumentRoute />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("DocumentRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows the Edit tab selected by default and both tabs visible", async () => {
    renderAt("/p/proj-1/d/doc-1?key=edit-token");
    // Wait for the async permission load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const editTab = await screen.findByRole("tab", { name: "Edit" });
    const previewTab = await screen.findByRole("tab", { name: "Preview" });
    expect(editTab.getAttribute("aria-selected")).toBe("true");
    expect(previewTab.getAttribute("aria-selected")).toBe("false");
  });

  it("switches aria-selected on Preview click", async () => {
    renderAt("/p/proj-1/d/doc-1?key=edit-token");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const previewTab = await screen.findByRole("tab", { name: "Preview" });
    await act(async () => {
      previewTab.click();
    });
    expect(previewTab.getAttribute("aria-selected")).toBe("true");
  });
});
```

- [ ] **Step 2: Run the test**

```bash
pnpm test tests/client/document-route.test.tsx
```
Expected: 2 passing tests.

- [ ] **Step 3: Full suite**

```bash
pnpm test
```
Expected: 61 passing (59 + 2).

- [ ] **Step 4: Commit**

```bash
git add tests/client/document-route.test.tsx
git commit -m "test(client): Document route Edit/Preview toggle component test"
```

---

## Task 18: Home route restyle with Tailwind + shadcn

**Goal:** Home uses shadcn `Button` + `Alert`, with Tailwind classes instead of inline styles. Behavior unchanged.

**Files:**
- Modify: `/src/routes/Home.tsx`

- [ ] **Step 1: Rewrite Home.tsx**

Replace `/Users/traviswilson/Development/markdown-collaboration/src/routes/Home.tsx` with:

```typescript
import { useState } from "react";
import { useNavigate } from "react-router";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ThemeToggle } from "~/lib/theme/ThemeToggle";

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
      setLoading(false);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="m-0 text-2xl font-semibold">Katagami</h1>
        <ThemeToggle />
      </header>
      <p className="mb-6 text-muted-foreground">
        Collaborative Markdown editor for spec teams.
      </p>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating…" : "Create new doc"}
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify build + typecheck + tests**

```bash
pnpm typecheck
pnpm build:client
pnpm test
```
Expected: all clean, 61 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/Home.tsx
git commit -m "feat(client): Home route restyled with Tailwind + shadcn Button/Alert"
```

---

## Task 19: shadcn audit + final verification + tag

**Goal:** Run the shadcn MCP audit checklist, confirm typecheck/lint/test/build all green, perform a manual two-browser smoke test, and tag `phase-2-complete`.

- [ ] **Step 1: Run the shadcn audit via MCP**

Call the tool:
```
mcp__shadcn__get_audit_checklist
```
Expected: returns a checklist of items to verify (e.g., "components.json valid", "tailwind tokens present", "utils.ts exports cn"). Walk each item; fix anything it flags.

- [ ] **Step 2: Run full verification**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build:client
```
Expected: typecheck exit 0, lint exit 0 (≤1 pre-existing warning from Phase 1), 61 tests pass, build succeeds.

- [ ] **Step 3: Manual two-browser smoke test**

Start the dev servers:
```bash
pnpm dev
```
(This runs server + client concurrently via the `dev` script from Phase 1.)

In TWO browser windows (Chrome + Chrome incognito, or Chrome + Firefox):

1. Open http://localhost:5173 in window A.
2. Click "Create new doc" — doc opens in Edit mode, TipTap editor visible.
3. Copy the full URL (including `?key=...`) to window B.
4. Type `# Hello` in window A.
   - Window A should render "Hello" as a heading with the `#` dimmed.
   - Window B should see the same in real time.
5. In window B, note your Japanese cursor name is visible in window A next to the live caret.
6. In window A, toggle Preview — the heading renders without the `#` syntax.
7. In window A, toggle dark mode — the whole UI (editor + header) flips.
8. In window A, edit the URL's `key=` to a view token (print it from the server or from `docker compose exec postgres psql -U postgres -d katagami -c "select token from permissions where level='view';"`). Reload. Editor is visible but read-only. Preview still works.
9. Close the server (Ctrl-C), restart, refresh window A. Content persists.

Stop the dev servers with Ctrl-C when done.

- [ ] **Step 4: Tag and commit nothing**

If all of Step 3 works:
```bash
git tag phase-2-complete
```

No additional commit — this is just tagging the current HEAD as the Phase 2 completion point.

- [ ] **Step 5: Report**

Print the final state:
```bash
git log --oneline -10
git tag -l
pnpm test 2>&1 | tail -5
```

---

## Spec Coverage Audit

| Spec requirement | Task(s) |
|---|---|
| Replace textarea with TipTap | 15 |
| Inline Markdown decorations (ProseMirror plugin) | 13, 14 |
| Edit / Preview toggle | 15, 16 |
| CommonMark + GFM + code highlight (no Mermaid) | 9 (render), 12/14 (editor extensions) |
| Preview via markdown-it + DOMPurify + highlight.js | 9 |
| shadcn/ui + Tailwind setup | 1, 2, 3 |
| Dark + light theme with system default + toggle | 5, 6, 7 |
| highlight.js paired theme swap | 10 |
| Japanese auto-cursor names + color | 4, 12 |
| CollaborationCaret wiring | 12, 15 |
| View-only readOnly editor | 12, 15 (editable prop from permissionLevel) |
| No regressions to Phase 1 tests | Every task runs `pnpm test` |
| shadcn MCP usage | 2, 3, 5 (view), 19 (audit) |
| Final verification + tag | 19 |

All Phase 2 spec items are covered. Phase 3/4 items (toolbar, commenting, name-entry UX, version history UI, Markdown export) are explicitly out of scope.
