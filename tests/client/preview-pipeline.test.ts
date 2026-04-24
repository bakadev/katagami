// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/lib/preview/render";

// Diagnostic tests: confirm markdown-it renders multi-heading, multi-paragraph
// documents correctly. These cases mirror the Preview pipeline's actual input
// (raw Markdown source with \n\n paragraph separators).

describe("preview pipeline — heading cases", () => {
  it("renders a standalone H1", () => {
    const html = renderMarkdown("# Refactor Roadmap");
    expect(html).toMatch(/<h1[^>]*>Refactor Roadmap<\/h1>/);
  });

  it("renders H1 at start of a multi-paragraph document", () => {
    const source = "# Refactor Roadmap\n\nTracking document for the platform refactor.";
    const html = renderMarkdown(source);
    expect(html).toMatch(/<h1[^>]*>Refactor Roadmap<\/h1>/);
    expect(html).toMatch(/<p>Tracking document/);
  });

  it("renders H1 + H2 mixed with paragraphs", () => {
    const source =
      "# Refactor Roadmap\n\nPara.\n\n## Phase 1\n\nAnother para.";
    const html = renderMarkdown(source);
    expect(html).toMatch(/<h1[^>]*>Refactor Roadmap<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>Phase 1<\/h2>/);
  });

  it("renders all 6 heading levels", () => {
    const source = [
      "# h1",
      "## h2",
      "### h3",
      "#### h4",
      "##### h5",
      "###### h6",
    ].join("\n\n");
    const html = renderMarkdown(source);
    for (let i = 1; i <= 6; i++) {
      expect(html).toMatch(new RegExp(`<h${i}[^>]*>h${i}</h${i}>`));
    }
  });

  it("renders horizontal rule from dashes", () => {
    const source = "Above\n\n---\n\nBelow";
    const html = renderMarkdown(source);
    expect(html).toMatch(/<hr/);
  });

  it("renders the exact text shape that TipTap getText produces", () => {
    // Emulates editor.getText({ blockSeparator: "\n\n" }) on a doc with
    // paragraphs ["# Title", "Body", "---", "## Heading", "**Bold**", "Text"]
    const source =
      "# Title\n\nBody\n\n---\n\n## Heading\n\n**Bold**\n\nText";
    const html = renderMarkdown(source);
    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>Heading<\/h2>/);
    expect(html).toMatch(/<strong>Bold<\/strong>/);
    expect(html).toMatch(/<hr/);
  });
});
