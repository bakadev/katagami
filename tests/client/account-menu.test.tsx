// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { MeResponse } from "../../shared/types";
import { AuthProvider } from "../../src/lib/auth/AuthProvider";
import { AccountMenu } from "../../src/components/account/AccountMenu";
import { ExportMenu } from "../../src/components/header/ExportMenu";
import { CURSOR_COLORS } from "../../src/lib/user/names";

// Radix's Tooltip (on the export trigger) measures with ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

const updateMe = vi.fn(async () => ({ user: {} }));
vi.mock("../../src/lib/api/auth", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../src/lib/api/auth")>();
  return { ...mod, updateMe: (...args: unknown[]) => updateMe(...(args as [])) };
});

const ME: MeResponse = {
  user: { id: "u1", email: "priya@acme.co", name: "Priya Raman", avatarUrl: null, color: "#3b82f6" },
  teams: [],
  plan: "team",
  isAdmin: false,
};

function renderMenu(
  me: MeResponse | null,
  props: Partial<React.ComponentProps<typeof AccountMenu>> = {},
) {
  return render(
    <MemoryRouter initialEntries={["/p/p1/d/d1?key=k"]}>
      <AuthProvider initial={me}>
        <AccountMenu
          identity={{ name: "Sakura", color: "#e11d48" }}
          onNameChange={() => {}}
          onColorChange={() => {}}
          trigger={<button type="button">open</button>}
          __testDefaultOpen
          {...props}
        />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("AccountMenu signed out", () => {
  it("shows the random identity, Change name/colour, disabled Settings and Sign in with next", () => {
    renderMenu(null);
    expect(screen.getByText("Sakura")).toBeTruthy();
    expect(screen.getByText("(You)")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Change name/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Change colour/i })).toBeTruthy();
    const settings = screen.getByRole("menuitem", { name: /Settings/i });
    expect(settings.getAttribute("aria-disabled")).toBe("true");
    expect(settings.textContent).toMatch(/Soon/);
    const signIn = screen.getByRole("menuitem", { name: /Sign in/i });
    expect(signIn.getAttribute("href")).toBe(
      `/signin?next=${encodeURIComponent("/p/p1/d/d1?key=k")}`,
    );
    expect(screen.queryByRole("menuitem", { name: /Your documents/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Sign out/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Admin/i })).toBeNull();
  });
});

describe("AccountMenu signed in", () => {
  it("shows name + email, Your documents and Sign out; Admin only for admins", () => {
    renderMenu(ME);
    expect(screen.getByText("Priya Raman")).toBeTruthy();
    expect(screen.getByText("priya@acme.co")).toBeTruthy();
    expect(screen.queryByText("(You)")).toBeNull();
    expect(screen.getByRole("menuitem", { name: /Your documents/i }).getAttribute("href")).toBe(
      "/documents",
    );
    expect(screen.getByRole("menuitem", { name: /Sign out/i })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /Sign in/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Admin/i })).toBeNull();
  });

  it("links to /admin for admins", () => {
    renderMenu({ ...ME, isAdmin: true });
    expect(screen.getByRole("menuitem", { name: /Admin/i }).getAttribute("href")).toBe("/admin");
  });

  it("picking a colour calls onColorChange and saves it to the account", async () => {
    updateMe.mockClear();
    const onColorChange = vi.fn();
    renderMenu(ME, { onColorChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change colour/i }));
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(CURSOR_COLORS.length);
    // The current identity colour is the one marked.
    expect(screen.getByRole("radio", { name: `Colour #e11d48` }).getAttribute("aria-checked")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: "Colour #22c55e" }));
    expect(onColorChange).toHaveBeenCalledWith("#22c55e");
    await waitFor(() => expect(updateMe).toHaveBeenCalledWith({ color: "#22c55e" }));
  });

  it("renaming saves the name to the account", async () => {
    updateMe.mockClear();
    const onNameChange = vi.fn();
    renderMenu(ME, { onNameChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change name/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Priya R" } });
    fireEvent.submit(input.closest("form")!);
    expect(onNameChange).toHaveBeenCalledWith("Priya R");
    await waitFor(() => expect(updateMe).toHaveBeenCalledWith({ name: "Priya R" }));
  });
});

describe("AccountMenu colour pick signed out", () => {
  it("only updates the local identity", () => {
    updateMe.mockClear();
    const onColorChange = vi.fn();
    renderMenu(null, { onColorChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change colour/i }));
    fireEvent.click(screen.getByRole("radio", { name: "Colour #8b5cf6" }));
    expect(onColorChange).toHaveBeenCalledWith("#8b5cf6");
    expect(updateMe).not.toHaveBeenCalled();
  });
});

describe("ExportMenu", () => {
  it("lists Markdown, Styled HTML and PDF with the last two disabled", async () => {
    const onExportMarkdown = vi.fn();
    render(<ExportMenu onExportMarkdown={onExportMarkdown} __testDefaultOpen />);
    const md = screen.getByRole("menuitem", { name: /Markdown \(\.md\)/i });
    const html = screen.getByRole("menuitem", { name: /Styled HTML/i });
    const pdf = screen.getByRole("menuitem", { name: /PDF/i });
    expect(md.getAttribute("aria-disabled")).toBeNull();
    expect(html.getAttribute("aria-disabled")).toBe("true");
    expect(pdf.getAttribute("aria-disabled")).toBe("true");
    expect(html.textContent).toMatch(/Soon/);
    expect(pdf.textContent).toMatch(/Soon/);
    fireEvent.click(md);
    await waitFor(() => expect(onExportMarkdown).toHaveBeenCalledTimes(1));
  });
});
