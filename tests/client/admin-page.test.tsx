// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { AdminOverviewResponse, MeResponse } from "../../shared/types";
import { AuthProvider } from "../../src/lib/auth/AuthProvider";
import Admin from "../../src/routes/Admin";

vi.mock("../../src/lib/api/auth", () => ({
  getMe: vi.fn(),
  signOut: vi.fn(),
  getAdminOverview: vi.fn(),
  deleteUser: vi.fn(),
  setUserPlan: vi.fn(),
}));

import * as api from "../../src/lib/api/auth";

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const user = { id: "u1", email: "ada@acme.co", name: "Ada Min", avatarUrl: null, color: null };
const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

const OVERVIEW: AdminOverviewResponse = {
  users: [
    {
      id: "u2",
      email: "tess@acme.co",
      name: "Tess Ter",
      createdAt: iso(5),
      plan: "free",
      planOverride: null,
      teams: [],
      documentCount: 3,
    },
    {
      id: "u1",
      email: "ada@acme.co",
      name: "Ada Min",
      createdAt: iso(60 * 24 * 3),
      plan: "team",
      planOverride: null,
      teams: [{ id: "t1", name: "Acme", role: "owner" }],
      documentCount: 7,
    },
  ],
  teams: [
    {
      id: "t1",
      name: "Acme",
      slug: "acme",
      createdAt: iso(60 * 24 * 3),
      members: [{ id: "u1", name: "Ada Min", email: "ada@acme.co", role: "owner" }],
      projectCount: 2,
      documentCount: 7,
    },
  ],
  totals: { users: 2, teams: 1, projects: 3, documents: 10, anonymousDocuments: 1 },
};

function renderAdmin(me: MeResponse | null) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AuthProvider initial={me}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/signin" element={<p>sign in page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  for (const fn of Object.values(mocked)) fn.mockReset();
});

describe("/admin", () => {
  it("redirects to sign-in without a session", () => {
    renderAdmin(null);
    expect(screen.getByText("sign in page")).toBeTruthy();
    expect(mocked.getAdminOverview).not.toHaveBeenCalled();
  });

  it("shows only 'Admins only' to a signed-in non-admin", () => {
    renderAdmin({ user, teams: [], plan: "free", isAdmin: false });
    expect(screen.getByRole("heading", { name: "Admins only" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to your documents" }).getAttribute("href")).toBe("/documents");
    expect(mocked.getAdminOverview).not.toHaveBeenCalled();
    expect(screen.queryByText("Users")).toBeNull();
  });

  it("renders totals, a user row and a team row", async () => {
    mocked.getAdminOverview.mockResolvedValue(OVERVIEW);
    renderAdmin({ user, teams: [], plan: "free", isAdmin: true });

    const totals = await screen.findByLabelText("Totals");
    expect(within(totals).getByText("10")).toBeTruthy();
    expect(within(totals).getByText("Documents")).toBeTruthy();

    const row = (await screen.findByText("tess@acme.co")).closest("tr")!;
    expect(within(row).getByText("Tess Ter")).toBeTruthy();
    expect(within(row).getByText("Free", { selector: "span" })).toBeTruthy();
    expect(within(row).getByText("3")).toBeTruthy();
    expect(within(row).getByText("5 minutes ago")).toBeTruthy();

    const adaRow = screen.getByText("ada@acme.co").closest("tr")!;
    expect(within(adaRow).getByText("Acme")).toBeTruthy();

    const teamRow = screen.getByText("acme").closest("tr")!;
    expect(within(teamRow).getByText("owner")).toBeTruthy();
    expect(within(teamRow).getByText("Ada Min")).toBeTruthy();

    expect(screen.getByText(/Admin access comes from ADMIN_EMAILS/)).toBeTruthy();
  });

  it("changing a user's plan calls setUserPlan and updates the chip", async () => {
    mocked.getAdminOverview.mockResolvedValue(OVERVIEW);
    mocked.setUserPlan.mockResolvedValue({ id: "u2", planOverride: "team", plan: "team" });
    renderAdmin({ user, teams: [], plan: "free", isAdmin: true });

    const row = (await screen.findByText("tess@acme.co")).closest("tr")!;
    const group = within(row).getByRole("radiogroup", { name: "Plan override for Tess Ter" });
    expect(within(group).getByRole("radio", { name: "Auto" }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(within(group).getByRole("radio", { name: "Team" }));
    await waitFor(() => expect(mocked.setUserPlan).toHaveBeenCalledWith("u2", "team"));
    expect(await within(row).findByText("Saved")).toBeTruthy();
    expect(within(row).getByText("Team", { selector: "span" })).toBeTruthy();
    expect(within(group).getByRole("radio", { name: "Team" }).getAttribute("aria-checked")).toBe("true");

    // Back to Auto sends null.
    mocked.setUserPlan.mockResolvedValue({ id: "u2", planOverride: null, plan: "free" });
    fireEvent.click(within(group).getByRole("radio", { name: "Auto" }));
    await waitFor(() => expect(mocked.setUserPlan).toHaveBeenLastCalledWith("u2", null));
  });

  it("shows an inline error when the plan change fails", async () => {
    mocked.getAdminOverview.mockResolvedValue(OVERVIEW);
    mocked.setUserPlan.mockRejectedValue(new Error("500"));
    renderAdmin({ user, teams: [], plan: "free", isAdmin: true });

    const row = (await screen.findByText("tess@acme.co")).closest("tr")!;
    fireEvent.click(within(row).getByRole("radio", { name: "Free" }));
    const alert = await within(row).findByRole("alert");
    expect(alert.textContent).toMatch(/Couldn't change the plan/);
    expect(within(row).getByRole("radio", { name: "Auto" }).getAttribute("aria-checked")).toBe("true");
  });

  it("filters both tables by name or email", async () => {
    mocked.getAdminOverview.mockResolvedValue(OVERVIEW);
    renderAdmin({ user, teams: [], plan: "free", isAdmin: true });
    await screen.findByText("tess@acme.co");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "tess" } });
    expect(screen.queryByText("ada@acme.co")).toBeNull();
    expect(screen.getByText("tess@acme.co")).toBeTruthy();
    expect(screen.getByText("No team matches.")).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ada@" } });
    expect(screen.getByText("ada@acme.co")).toBeTruthy();
    expect(screen.getByText("acme")).toBeTruthy();
  });
});
