import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Exported so tests can read the plugin state via PluginKey.getState().
export const MD_DECORATIONS_KEY = new PluginKey<DecorationSet>("md-decorations");

// Matches opening+closing pairs of the same delimiter around non-empty content.
// Captures: 1) leading delimiter run, 2) inner content, 3) trailing delimiter run.
// Patterns intentionally simple — we're only fading *syntax*, not parsing MD.
const PATTERNS: Array<{ delim: string; regex: RegExp }> = [
  { delim: "**", regex: /(\*\*)([^*]+?)(\*\*)/g },
  { delim: "__", regex: /(__)([^_]+?)(__)/g },
  { delim: "*", regex: /(?<!\*)(\*)(?!\*)([^*]+?)(?<!\*)(\*)(?!\*)/g },
  { delim: "_", regex: /(?<!_)(_)(?!_)([^_]+?)(?<!_)(_)(?!_)/g },
  { delim: "`", regex: /(`)([^`]+?)(`)/g },
];

// Heading marker at line start: ^#{1,6} followed by a space.
const HEADING_REGEX = /^(#{1,6})(\s)/gm;

// Blockquote marker at line start.
const BLOCKQUOTE_REGEX = /^(>)(\s)/gm;

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    const base = pos;

    for (const { regex } of PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const openStart = base + m.index;
        const openEnd = openStart + m[1].length;
        const closeStart = base + m.index + m[1].length + m[2].length;
        const closeEnd = closeStart + m[3].length;
        decorations.push(
          Decoration.inline(openStart, openEnd, { class: "md-syntax" }),
          Decoration.inline(closeStart, closeEnd, { class: "md-syntax" }),
        );
      }
    }

    HEADING_REGEX.lastIndex = 0;
    let h: RegExpExecArray | null;
    while ((h = HEADING_REGEX.exec(text)) !== null) {
      const start = base + h.index;
      const end = start + h[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }

    BLOCKQUOTE_REGEX.lastIndex = 0;
    let b: RegExpExecArray | null;
    while ((b = BLOCKQUOTE_REGEX.exec(text)) !== null) {
      const start = base + b.index;
      const end = start + b[1].length;
      decorations.push(Decoration.inline(start, end, { class: "md-syntax" }));
    }
  });

  return DecorationSet.create(state.doc, decorations);
}

export function mdDecorationsPlugin() {
  return new Plugin<DecorationSet>({
    key: MD_DECORATIONS_KEY,
    state: {
      init(_config, state) {
        return buildDecorations(state);
      },
      apply(tr, oldSet, _oldState, newState) {
        if (!tr.docChanged) return oldSet;
        return buildDecorations(newState);
      },
    },
    props: {
      decorations(state) {
        return MD_DECORATIONS_KEY.getState(state);
      },
    },
  });
}
