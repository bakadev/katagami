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
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const href = themeHref(resolvedTheme);
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [resolvedTheme]);
}
