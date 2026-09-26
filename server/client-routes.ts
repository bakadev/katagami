/**
 * Paths the React app owns. The SPA fallback serves index.html for all of
 * them with a 200; anything else still gets index.html (so the app can show
 * its own 404 page) but with a 404 status, so crawlers and uptime checks
 * don't mistake a typo for a healthy page.
 *
 * Keep in sync with the <Route> list in src/App.tsx.
 */
const EXACT = new Set([
  "/",
  "/developers",
  "/pricing",
  "/privacy",
  "/terms",
  "/contact",
  "/signin",
  "/welcome",
  "/claim",
  "/documents",
  "/design",
]);

const PREFIXES = ["/p/", "/design/", "/documents/"];

export function isClientRoute(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (EXACT.has(path)) return true;
  return PREFIXES.some((p) => path.startsWith(p));
}
