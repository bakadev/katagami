import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import { getSelectionActions } from "~/lib/editor/selection-actions";

interface FloatingCommentButtonProps {
  editor: Editor | null;
  /** When true, hide the button entirely (e.g. view-only users). */
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
}

export function FloatingCommentButton({ editor, disabled }: FloatingCommentButtonProps) {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!editor || disabled) {
      setPosition(null);
      return;
    }
    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setPosition(null);
        return;
      }
      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const left = (start.left + end.left) / 2;
        const top = Math.min(start.top, end.top) - 48;
        setPosition({ top, left });
      } catch {
        setPosition(null);
      }
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor, disabled]);

  if (!editor || !position || disabled) return null;

  const invoke = (id: string) => {
    const actions = getSelectionActions();
    const action = actions.find((a) => a.id === id);
    if (!action) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    action.onInvoke({ editor, from, to, selectedText });
  };

  return (
    <div
      data-testid="floating-selection-bar"
      className="fixed z-50 flex items-center gap-1 rounded border border-border bg-background px-1 py-1 shadow-md"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => invoke("comment")}
        aria-label="Add comment"
      >
        <MessageSquare className="mr-1 h-4 w-4" />
        Comment
      </Button>
    </div>
  );
}
