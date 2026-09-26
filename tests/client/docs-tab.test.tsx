// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { MeResponse, ProjectPageResponse } from "../../shared/types";
import { AuthProvider } from "../../src/lib/auth/AuthProvider";
import { DocsTab } from "../../src/components/panel/tabs/DocsTab";
import type { ProjectDocsState } from "../../src/hooks/useProjectDocuments";

const ME: MeResponse = {
  user: { id: "u1", email: "priya@acme.co", name: "Priya Raman", avatarUrl: null, color: null },
  teams: [],
  plan: "team",
  isAdmin: false,
};

const DATA: ProjectPageResponse = {
  project: {
    id: "p1",
    name: "Checkout",
    documentCount: 2,
    updatedAt: new Date().toISOString(),
    lastEditedBy: null,
    editors: [],
  },
  documents: [
    {
      id: "d1",
      projectId: "p1",
      title: "Guest checkout",
      updatedAt: new Date().toISOString(),
      lastEditedBy: { name: "Priya", color: "#123456" },
      openComments: 0,
      openSuggestions: 0,
      editToken: "tok1",
    },
    {
      id: "d2",
      projectId: "p1",
      title: null,
      updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
      lastEditedBy: null,
      openComments: 0,
      openSuggestions: 0,
      editToken: "tok2",
    },
  ],
};

function renderTab(me: MeResponse | null, state: ProjectDocsState) {
  return render(
    <MemoryRouter initialEntries={["/p/p1/d/d1?key=k"]}>
      <AuthProvider initial={me}>
        <DocsTab docId="d1" state={state} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("DocsTab", () => {
  it("signed out: asks to sign in with a next link", () => {
    renderTab(null, { status: "idle" });
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
      `/signin?next=${encodeURIComponent("/p/p1/d/d1?key=k")}`,
    );
  });

  it("lists the project's documents with the current one marked", () => {
    renderTab(ME, { status: "ready", data: DATA });
    expect(screen.getByText("Checkout")).toBeTruthy();
    expect(screen.getByText("2 documents")).toBeTruthy();
    const current = screen.getByRole("link", { name: /Guest checkout/ });
    expect(current.getAttribute("aria-current")).toBe("page");
    const other = screen.getByRole("link", { name: /Untitled/ });
    expect(other.getAttribute("href")).toBe("/p/p1/d/d2?key=tok2");
    expect(other.textContent).toMatch(/3 hours ago/);
  });

  it("Team, document in the default bucket: points at Your documents", () => {
    renderTab(ME, { status: "not-in-project" });
    expect(screen.getByText(/isn't in a project yet/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Your documents" }).getAttribute("href")).toBe("/documents");
  });

  it("Free: projects come with Team", () => {
    renderTab({ ...ME, plan: "free" }, { status: "not-in-project" });
    expect(screen.getByText("Projects come with Team")).toBeTruthy();
    expect(screen.getByRole("link", { name: "See Team" }).getAttribute("href")).toBe("/pricing");
  });

  it("shows a quiet loading line", () => {
    renderTab(ME, { status: "loading" });
    expect(screen.getByRole("status").textContent).toMatch(/Loading/);
  });
});
