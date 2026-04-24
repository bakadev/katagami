// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider } from "../../src/lib/theme/ThemeProvider";
import { useTheme } from "../../src/lib/theme/useTheme";

function Harness() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}>
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

  it("system mode resolves to light when system prefers light", () => {
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
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system mode resolves to dark when system prefers dark", () => {
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
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
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
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
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

  it("throws a helpful error when useTheme is used outside a provider", () => {
    // Suppress React's error boundary console output for this expected throw
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(
      "useTheme must be used inside a ThemeProvider",
    );
    errorSpy.mockRestore();
  });

  it("exposes 'system' as the default theme on first visit", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "(prefers-color-scheme: dark)",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    function Reader() {
      const { theme, resolvedTheme } = useTheme();
      return (
        <>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolved">{resolvedTheme}</span>
        </>
      );
    }
    render(<ThemeProvider><Reader /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("live-updates resolvedTheme when system preference changes while in 'system' mode", () => {
    const listeners = new Set<(ev: MediaQueryListEvent) => void>();
    let currentMatches = false;
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          get matches() { return currentMatches; },
          media: "(prefers-color-scheme: dark)",
          addEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.add(cb),
          removeEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.delete(cb),
        }) as unknown as MediaQueryList,
    );
    function Reader() {
      const { resolvedTheme } = useTheme();
      return <span data-testid="resolved">{resolvedTheme}</span>;
    }
    render(<ThemeProvider><Reader /></ThemeProvider>);
    expect(screen.getByTestId("resolved").textContent).toBe("light");

    act(() => {
      currentMatches = true;
      for (const cb of listeners) cb({ matches: true } as MediaQueryListEvent);
    });
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("pinned theme does NOT track system preference changes", () => {
    localStorage.setItem("katagami:theme", "light");
    const listeners = new Set<(ev: MediaQueryListEvent) => void>();
    let currentMatches = false;
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          get matches() { return currentMatches; },
          media: "(prefers-color-scheme: dark)",
          addEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.add(cb),
          removeEventListener: (_: string, cb: (ev: MediaQueryListEvent) => void) => listeners.delete(cb),
        }) as unknown as MediaQueryList,
    );
    function Reader() {
      const { theme, resolvedTheme } = useTheme();
      return (
        <>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolved">{resolvedTheme}</span>
        </>
      );
    }
    render(<ThemeProvider><Reader /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");

    act(() => {
      currentMatches = true;
      for (const cb of listeners) cb({ matches: true } as MediaQueryListEvent);
    });
    // Theme stays pinned to light; no re-render for system changes
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });
});
