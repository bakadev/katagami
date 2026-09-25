import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
        // Centre over the selection when it sits on one line. For a
        // multi-line selection the end can be left of the start, so anchor
        // to the first line instead of averaging into nowhere.
        const sameLine = Math.abs(start.top - end.top) < 4;
        const left = sameLine ? (start.left + end.left) / 2 : start.left + 80;
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

  // Keep the bar inside the viewport: measure it once rendered and clamp.
  const barRef = useRef<HTMLDivElement | null>(null);
  const [clamped, setClamped] = useState<Position | null>(null);
  useLayoutEffect(() => {
    if (!position || !barRef.current) {
      setClamped(null);
      return;
    }
    const { width, height } = barRef.current.getBoundingClientRect();
    const margin = 8;
    const halfW = width / 2;
    const left = Math.min(
      Math.max(position.left, margin + halfW),
      window.innerWidth - margin - halfW,
    );
    // If there's no room above the selection, sit just below it instead.
    const top =
      position.top < margin ? position.top + 48 + height + 8 : position.top;
    setClamped({ top, left });
  }, [position]);

  if (!editor || !position || disabled) return null;
  const shown = clamped ?? position;

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
      ref={barRef}
      data-testid="floating-selection-bar"
      className="fixed z-50 flex items-center gap-1 rounded-sm border border-border bg-background px-1 py-1 shadow-md"
      style={{ top: shown.top, left: shown.left, transform: "translateX(-50%)" }}
    >
      <Button
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
