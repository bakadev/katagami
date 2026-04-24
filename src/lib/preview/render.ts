import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import DOMPurify from "dompurify";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: true,
  highlight(code: string, lang: string): string {
    const lower = lang.toLowerCase();
    if (lower && hljs.getLanguage(lower)) {
      try {
        return `<pre class="hljs"><code class="hljs language-${lower}">${
          hljs.highlight(code, { language: lower, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch {
        // fall through
      }
    }
    // Unknown or empty lang: auto-detect, still wrap in hljs.
    return `<pre class="hljs"><code class="hljs">${
      hljs.highlightAuto(code).value
    }</code></pre>`;
  },
}).use(taskLists, { enabled: true });

export function renderMarkdown(source: string): string {
  if (!source) return "";
  const rawHtml = md.render(source);
  return DOMPurify.sanitize(rawHtml);
}
