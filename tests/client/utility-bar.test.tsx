// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "../../src/lib/theme/ThemeProvider";
import { UtilityBar, audienceFor } from "../../src/components/site/UtilityBar";

function mount(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <UtilityBar />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("UtilityBar", () => {
  it("derives the audience from the path", () => {
    expect(audienceFor("/")).toBe("teams");
    expect(audienceFor("/pricing")).toBe("teams");
    expect(audienceFor("/developers")).toBe("developers");
  });

  it("marks the current audience link", () => {
    const { getByRole } = mount("/developers");
    expect(
      getByRole("link", { name: "Developers" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      getByRole("link", { name: "Teams" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("offers a theme toggle", () => {
    const { getByRole } = mount("/");
    expect(getByRole("button", { name: /switch to (dark|light) mode/i })).toBeTruthy();
  });
});
