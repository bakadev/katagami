import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
} from "lucide-react";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ToolbarButton } from "./ToolbarButton";
import {
  wrapSelection,
  toggleLinePrefix,
  toggleHeading,
  insertHorizontalRule,
} from "~/lib/editor/toolbar-actions";

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function Toolbar({ editor, disabled = false }: ToolbarProps) {
  const noop = () => {};
  const act = (fn: () => void) => (disabled || !editor ? noop : fn);
  const e = editor;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="toolbar"
        aria-label="Formatting toolbar"
        className="flex items-center gap-1 bg-background p-2"
      >
        <ToolbarButton
          label="Heading 1"
          icon={Heading1}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 1))}
          data-testid="tb-h1"
        />
        <ToolbarButton
          label="Heading 2"
          icon={Heading2}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 2))}
          data-testid="tb-h2"
        />
        <ToolbarButton
          label="Heading 3"
          icon={Heading3}
          disabled={disabled || !e}
          onClick={act(() => toggleHeading(e!, 3))}
          data-testid="tb-h3"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Bold"
          icon={Bold}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "**", "**"))}
          data-testid="tb-bold"
        />
        <ToolbarButton
          label="Italic"
          icon={Italic}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "*", "*"))}
          data-testid="tb-italic"
        />
        <ToolbarButton
          label="Strikethrough"
          icon={Strikethrough}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "~~", "~~"))}
          data-testid="tb-strike"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Bullet list"
          icon={List}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "- "))}
          data-testid="tb-bullet"
        />
        <ToolbarButton
          label="Numbered list"
          icon={ListOrdered}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "1. "))}
          data-testid="tb-numbered"
        />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <ToolbarButton
          label="Code block"
          icon={Code}
          disabled={disabled || !e}
          onClick={act(() => wrapSelection(e!, "```\n", "\n```"))}
          data-testid="tb-code"
        />
        <ToolbarButton
          label="Blockquote"
          icon={Quote}
          disabled={disabled || !e}
          onClick={act(() => toggleLinePrefix(e!, "> "))}
          data-testid="tb-quote"
        />
        <ToolbarButton
          label="Horizontal rule"
          icon={Minus}
          disabled={disabled || !e}
          onClick={act(() => insertHorizontalRule(e!))}
          data-testid="tb-hr"
        />
      </div>
    </TooltipProvider>
  );
}
