import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentAnchorOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentAnchor: {
      setCommentAnchor: (threadId: string) => ReturnType;
      unsetCommentAnchor: () => ReturnType;
    };
  }
}

export const CommentAnchor = Mark.create<CommentAnchorOptions>({
  name: "commentAnchor",
  inclusive: false,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-thread-id"),
        renderHTML: (attrs) => {
          if (!attrs.threadId) return {};
          return { "data-comment-thread-id": attrs.threadId };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-comment-thread-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "comment-anchor",
      }),
      0,
    ];
  },
  addCommands() {
    return {
      setCommentAnchor:
        (threadId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { threadId }),
      unsetCommentAnchor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
