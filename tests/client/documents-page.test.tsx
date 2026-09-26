// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { HomeResponse, MeResponse } from "../../shared/types";
import { AuthProvider } from "../../src/lib/auth/AuthProvider";
import Documents from "../../src/routes/Documents";

vi.mock("../../src/lib/api/auth", () => ({
  getMe: vi.fn(),
  signOut: vi.fn(),
  getHome: vi.fn(),
  getProject: vi.fn(),
  createDocument: vi.fn(),
  createProject: vi.fn(),
  renameProject: vi.fn(),
  deleteProject: vi.fn(),
  deleteDocument: vi.fn(),
  moveDocument: vi.fn(),
  lookupClaims: vi.fn(),
}));

import * as api from "../../src/lib/api/auth";

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const user = { id: "u1", email: "priya@acme.co", name: "Priya Raman", avatarUrl: null };
const team = { id: "t1", name: "Acme", slug: "acme", role: "owner" as const };

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

const priya = { name: "Priya Raman", color: "#274b8f" };
const marcus = { name: "Marcus Chen", color: "#b4552a" };

function doc(id: string, title: string, minutesAgo: number, extra: Partial<HomeResponse["documents"][number]> = {}) {
  return {
    id,
    projectId: "default",
    title,
    createdAt: iso(minutesAgo + 60),
    updatedAt: iso(minutesAgo),
    lastEditedBy: priya,
    openComments: 0,
    openSuggestions: 0,
    editToken: `edit-${id}`,
    ...extra,
  };
}

const TEAM_HOME: HomeResponse = {
  plan: "team",
  team,
  projects: [
    {
      id: "p1",
      name: "Checkout redesign",
      documentCount: 3,
      updatedAt: iso(12),
      lastEditedBy: marcus,
      editors: [marcus, priya],
    },
    {
      id: "p2",
      name: "Onboarding emails",
      documentCount: 0,
      updatedAt: iso(60),
      lastEditedBy: null,
      editors: [],
    },
  ],
  documents: [
    doc("d1", "Pricing page copy", 30, { openComments: 2, openSuggestions: 1, lastEditedBy: marcus }),
    doc("d2", "Search relevance principles", 90),
  ],
};

const FREE_HOME: HomeResponse = {
  plan: "free",
  team: null,
  projects: [],
  documents: [doc("d1", "Pricing page copy", 30)],
};

const EMPTY_HOME: HomeResponse = { plan: "free", team: null, projects: [], documents: [] };

function renderHome(me: MeResponse) {
  return render(
    <MemoryRouter initialEntries={["/documents"]}>
      <AuthProvider initial={me}>
        <Routes>
          <Route path="/documents" element={<Documents />} />
          <Route path="/signin" element={<p>sign in page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/** Radix opens its menu from the keyboard; Enter on the trigger is the reliable path in jsdom. */
async function openMenu(name: RegExp) {
  const trigger = screen.getByRole("button", { name });
  fireEvent.keyDown(trigger, { key: "Enter" });
  return await screen.findByRole("menu");
}

beforeEach(() => {
  localStorage.clear();
  for (const fn of Object.values(mocked)) fn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("/documents", () => {
  it("redirects to sign-in without a session", () => {
    render(
      <MemoryRouter initialEntries={["/documents"]}>
        <AuthProvider initial={null}>
          <Routes>
            <Route path="/documents" element={<Documents />} />
            <Route path="/signin" element={<p>sign in page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("sign in page")).toBeTruthy();
    expect(mocked.getHome).not.toHaveBeenCalled();
  });

  it("on Free shows the locked Projects card and no Move to project", async () => {
    mocked.getHome.mockResolvedValue(FREE_HOME);
    renderHome({ user, teams: [], plan: "free" });

    await screen.findByText("Pricing page copy");
    expect(screen.getByText("Projects come with Team.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "See Team" }).getAttribute("href")).toBe("/pricing");
    const newProject = screen.getByRole("button", { name: /New project/ });
    expect(newProject.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Free keeps every document you make/)).toBeTruthy();

    const menu = await openMenu(/More actions for Pricing page copy/);
    expect(within(menu).queryByText("Move to project")).toBeNull();
    expect(within(menu).getByText("Delete document")).toBeTruthy();
  });

  it("on Team renders project cards and the documents table with counts", async () => {
    mocked.getHome.mockResolvedValue(TEAM_HOME);
    renderHome({ user, teams: [team], plan: "team" });

    const card = await screen.findByRole("link", { name: "Checkout redesign" });
    expect(card.getAttribute("href")).toBe("/documents/p1");
    expect(screen.getByRole("link", { name: "Onboarding emails" })).toBeTruthy();
    expect(screen.getByText("3 documents")).toBeTruthy();
    expect(screen.getByText("Nothing in it yet")).toBeTruthy();
    expect(screen.getByText("2 not in a project")).toBeTruthy();

    const row = screen.getByRole("link", { name: "Pricing page copy" });
    expect(row.getAttribute("href")).toBe("/p/default/d/d1?key=edit-d1");
    expect(screen.getByText("open comments", { exact: false }).parentElement?.textContent).toContain("2");
    expect(screen.getByText("open suggestions", { exact: false }).parentElement?.textContent).toContain("1");
    expect(screen.queryByText("Projects come with Team.")).toBeNull();

    const menu = await openMenu(/More actions for Pricing page copy/);
    expect(within(menu).getByText("Move to project")).toBeTruthy();
  });

  it("deleting a document asks inline, then calls the API on Delete", async () => {
    mocked.getHome.mockResolvedValue(TEAM_HOME);
    mocked.deleteDocument.mockResolvedValue(undefined);
    renderHome({ user, teams: [team], plan: "team" });
    await screen.findByText("Pricing page copy");

    const menu = await openMenu(/More actions for Pricing page copy/);
    fireEvent.click(within(menu).getByText("Delete document"));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog.textContent).toContain("Delete “Pricing page copy”?");
    expect(mocked.deleteDocument).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocked.deleteDocument).toHaveBeenCalledWith("d1"));
    /* The row leaves after the collapse; the other row stays put. */
    await waitFor(() => expect(screen.queryByText("Pricing page copy")).toBeNull(), { timeout: 1500 });
    expect(screen.getByText("Search relevance principles")).toBeTruthy();
  });

  it("Keep leaves the document alone", async () => {
    mocked.getHome.mockResolvedValue(TEAM_HOME);
    renderHome({ user, teams: [team], plan: "team" });
    await screen.findByText("Pricing page copy");
    const menu = await openMenu(/More actions for Pricing page copy/);
    fireEvent.click(within(menu).getByText("Delete document"));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByText("Pricing page copy")).toBeTruthy();
    expect(mocked.deleteDocument).not.toHaveBeenCalled();
  });

  it("renders the empty state when there is nothing at all", async () => {
    mocked.getHome.mockResolvedValue(EMPTY_HOME);
    renderHome({ user, teams: [], plan: "free" });
    await screen.findByText("Nothing cut yet.");
    expect(screen.getAllByRole("button", { name: /New spec/ }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText(/from this browser/)).toBeNull();
  });

  it("shows the claim strip only for keys the server verifies, until dismissed", async () => {
    const P1 = "11111111-1111-1111-1111-111111111111";
    const STALE = "99999999-9999-9999-9999-999999999999";
    localStorage.setItem(`katagami:creator-token:${P1}`, "tok");
    localStorage.setItem(`katagami:creator-token:${STALE}`, "gone");
    mocked.getHome.mockResolvedValue(FREE_HOME);
    mocked.lookupClaims.mockResolvedValue({
      projects: [{ id: P1, title: "Draft", documentCount: 1, updatedAt: iso(5) }],
    });
    const { unmount } = renderHome({ user, teams: [], plan: "free" });
    await screen.findByText("Pricing page copy");
    expect(await screen.findByRole("link", { name: "Bring it in" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bring it in" }).getAttribute("href")).toBe("/claim");
    expect(mocked.lookupClaims).toHaveBeenCalledTimes(1);
    expect(mocked.lookupClaims.mock.calls[0][0]).toHaveLength(2);
    // The key the server didn't return is dropped; the verified one stays.
    expect(localStorage.getItem(`katagami:creator-token:${STALE}`)).toBeNull();
    expect(localStorage.getItem(`katagami:creator-token:${P1}`)).toBe("tok");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/still on this browser/)).toBeNull();
    unmount();

    /* Same verified projects: stays dismissed. */
    renderHome({ user, teams: [], plan: "free" });
    await screen.findByText("Pricing page copy");
    await waitFor(() => expect(mocked.lookupClaims).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/still on this browser/)).toBeNull();

    /* A new verified key with two documents: comes back, and counts documents. */
    const P2 = "22222222-2222-2222-2222-222222222222";
    localStorage.setItem(`katagami:creator-token:${P2}`, "tok2");
    mocked.lookupClaims.mockResolvedValue({
      projects: [
        { id: P1, title: "Draft", documentCount: 1, updatedAt: iso(5) },
        { id: P2, title: "Other", documentCount: 2, updatedAt: iso(1) },
      ],
    });
    renderHome({ user, teams: [], plan: "free" });
    await screen.findAllByText("Pricing page copy");
    expect(await screen.findByText(/3 documents from before you signed in/)).toBeTruthy();
  });

  it("shows no strip when every key is stale", async () => {
    localStorage.setItem("katagami:creator-token:11111111-1111-1111-1111-111111111111", "tok");
    mocked.getHome.mockResolvedValue(FREE_HOME);
    mocked.lookupClaims.mockResolvedValue({ projects: [] });
    renderHome({ user, teams: [], plan: "free" });
    await screen.findByText("Pricing page copy");
    await waitFor(() => expect(mocked.lookupClaims).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/still on this browser/)).toBeNull();
    expect(localStorage.getItem("katagami:creator-token:11111111-1111-1111-1111-111111111111")).toBeNull();
  });

  it("makes no lookup when the browser holds no keys", async () => {
    mocked.getHome.mockResolvedValue(FREE_HOME);
    renderHome({ user, teams: [], plan: "free" });
    await screen.findByText("Pricing page copy");
    expect(mocked.lookupClaims).not.toHaveBeenCalled();
  });
});
