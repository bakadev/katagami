import { useEffect } from "react";

const SITE = "Katagami";

/**
 * Sets the document title and description for a route. The app is a
 * single-page app without server rendering, so per-route metadata has to be
 * applied on the client; Open Graph tags stay site-wide in index.html.
 *
 * `title` is the page's own name; the site name is appended except on the
 * homepage, which passes the full title itself.
 */
export function usePageMeta({
  title,
  description,
  bare,
}: {
  title: string;
  description: string;
  /** Use `title` as-is instead of "title · Katagami". */
  bare?: boolean;
}) {
  useEffect(() => {
    document.title = bare ? title : `${title} · ${SITE}`;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [title, description, bare]);
}
