// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../../src/lib/auth/AuthProvider";
import { AvatarButton } from "../../src/components/header/AvatarButton";
import { AvatarDropdown } from "../../src/components/avatar-menu/AvatarDropdown";
import { guessWorkspaceName } from "../../src/routes/Welcome";
import { listCreatorTokens, storeCreatorToken } from "../../src/lib/creator-token";

describe("guessWorkspaceName", () => {
  it("uses the company from a work email", () => {
    expect(guessWorkspaceName("priya@acme.co", "Priya Raman")).toBe("Acme");
  });
  it("falls back to the first name for personal mail", () => {
    expect(guessWorkspaceName("travis@gmail.com", "Travis Wilson")).toBe("Travis's workspace");
  });
});

describe("listCreatorTokens", () => {
  afterEach(() => localStorage.clear());
  it("lists every stored creator key", () => {
    storeCreatorToken("11111111-1111-1111-1111-111111111111", "tok-a");
    storeCreatorToken("22222222-2222-2222-2222-222222222222", "tok-b");
    localStorage.setItem("katagami:identity", "{}");
    expect(listCreatorTokens().sort((a, b) => a.token.localeCompare(b.token))).toEqual([
      { projectId: "11111111-1111-1111-1111-111111111111", token: "tok-a" },
      { projectId: "22222222-2222-2222-2222-222222222222", token: "tok-b" },
    ]);
  });
});

describe("AvatarDropdown with an account", () => {
  it("shows the email and a Sign out item that calls back", async () => {
    const onSignOut = vi.fn();
    render(
      <MemoryRouter>
        <AuthProvider initial={null}>
          <AvatarDropdown
            identity={{ name: "Priya Raman", color: "#123" }}
            account={{ name: "Priya Raman", email: "priya@acme.co" }}
            onSignOut={onSignOut}
            theme="system"
            onThemeChange={() => {}}
            onRenameSave={() => {}}
            onDownloadClick={() => {}}
            trigger={<AvatarButton name="Priya Raman" active={false} />}
            __testDefaultOpen
          />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText("priya@acme.co")).toBeTruthy());
    expect(screen.queryByText("Sign in")).toBeNull();
    fireEvent.click(screen.getByText("Sign out"));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
