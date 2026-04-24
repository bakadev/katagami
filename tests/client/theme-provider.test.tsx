// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
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
  beforeAll(() => {
    // jsdom does not implement matchMedia — define a stub so vi.spyOn can wrap it
    if (!window.matchMedia) {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (_query: string): MediaQueryList =>
          ({
            matches: false,
            media: _query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      });
    }
  });

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
