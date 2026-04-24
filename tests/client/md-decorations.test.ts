// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { schema as basicSchema } from "prosemirror-schema-basic";
import {
  mdDecorationsPlugin,
  MD_DECORATIONS_KEY,
} from "../../src/lib/editor/md-decorations";

function buildState(text: string) {
  const doc = basicSchema.node(
    "doc",
    null,
    basicSchema.node("paragraph", null, text ? basicSchema.text(text) : []),
  );
  return EditorState.create({
    doc,
    schema: basicSchema,
    plugins: [mdDecorationsPlugin()],
  });
}

function decorationsWithClass(state: EditorState, className: string): number {
  const set = MD_DECORATIONS_KEY.getState(state);
  if (!set) return 0;
  return set
    .find()
    .filter((d) => {
      const attrs = (d as unknown as { type: { attrs?: { class?: string } } }).type.attrs;
      return attrs && typeof attrs.class === "string" && attrs.class === className;
    }).length;
}

describe("mdDecorationsPlugin — syntax fading", () => {
  it("fades bold asterisks", () => {
    const state = buildState("**hello**");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades italic underscores", () => {
    const state = buildState("_hi_");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades inline code backticks", () => {
    const state = buildState("`code`");
    expect(decorationsWithClass(state, "md-syntax")).toBe(2);
  });

  it("fades heading markers at line start", () => {
    const state = buildState("## Heading");
    expect(decorationsWithClass(state, "md-syntax")).toBe(1);
  });

  it("produces zero syntax decorations for plain text", () => {
    const state = buildState("no syntax here");
    expect(decorationsWithClass(state, "md-syntax")).toBe(0);
  });
});

describe("mdDecorationsPlugin — inner-content styling", () => {
  it("applies .md-bold to the inner content of **...**", () => {
    const state = buildState("say **hello** friend");
    expect(decorationsWithClass(state, "md-bold")).toBe(1);
  });

  it("applies .md-italic to the inner content of *...*", () => {
    const state = buildState("this is *italic* text");
    expect(decorationsWithClass(state, "md-italic")).toBe(1);
  });

  it("applies .md-strike to ~~...~~", () => {
    const state = buildState("remove ~~this~~ please");
    expect(decorationsWithClass(state, "md-strike")).toBe(1);
  });

  it("applies .md-code to `...`", () => {
    const state = buildState("use `npm` to install");
    expect(decorationsWithClass(state, "md-code")).toBe(1);
  });
});
