import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Resets scroll to the top when the path changes. A single-page app keeps
 * the previous scroll position across client-side navigations, which is
 * wrong for page-to-page links (footer to another page, for example).
 * In-page anchors (a hash in the URL) are left to the browser.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}
