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

function decorationCount(state: EditorState): number {
  const set = MD_DECORATIONS_KEY.getState(state);
  return set ? set.find().length : 0;
}

describe("mdDecorationsPlugin", () => {
  it("decorates bold asterisks", () => {
    const state = buildState("**hello**");
    expect(decorationCount(state)).toBe(2); // opening + closing **
  });

  it("decorates italic underscores", () => {
    const state = buildState("_hi_");
    expect(decorationCount(state)).toBe(2);
  });

  it("decorates inline code backticks", () => {
    const state = buildState("`code`");
    expect(decorationCount(state)).toBe(2);
  });

  it("decorates heading markers at line start", () => {
    const state = buildState("## Heading");
    expect(decorationCount(state)).toBe(1); // the "##"
  });

  it("produces zero decorations for plain text", () => {
    const state = buildState("no syntax here");
    expect(decorationCount(state)).toBe(0);
  });
});
