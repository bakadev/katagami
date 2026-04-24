import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Exported so tests can read the plugin state via PluginKey.getState().
export const MD_DECORATIONS_KEY = new PluginKey<DecorationSet>("md-decorations");

// Pairs: delimiter regex and the CSS class to apply to the INNER content
// between the delimiters (in addition to `md-syntax` on the delimiters).
const PATTERNS: Array<{ regex: RegExp; innerClass: string }> = [
  { regex: /(\*\*)([^*]+?)(\*\*)/g, innerClass: "md-bold" },
  { regex: /(__)([^_]+?)(__)/g, innerClass: "md-bold" },
  { regex: /(~~)([^~]+?)(~~)/g, innerClass: "md-strike" },
  // Single * and _ must avoid adjacent delimiters so **x** doesn't match *x*.
  { regex: /(?<!\*)(\*)(?!\*)([^*]+?)(?<!\*)(\*)(?!\*)/g, innerClass: "md-italic" },
  { regex: /(?<!_)(_)(?!_)([^_]+?)(?<!_)(_)(?!_)/g, innerClass: "md-italic" },
  { regex: /(`)([^`]+?)(`)/g, innerClass: "md-code" },
];

const HEADING_REGEX = /^(#{1,6})(\s)/gm;
const BLOCKQUOTE_REGEX = /^(>)(\s)/gm;

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    const base = pos;

    for (const { regex, innerClass } of PATTERNS) {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        const openStart = base + m.index;
        const openEnd = openStart + m[1].length;
        const innerStart = openEnd;
        const innerEnd = innerStart + m[2].length;
        const closeStart = innerEnd;
        const closeEnd = closeStart + m[3].length;

        decorations.push(
          Decoration.inline(openStart, openEnd, { class: "md-syntax" }),
          Decoration.inline(innerStart, innerEnd, { class: innerClass }),
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
