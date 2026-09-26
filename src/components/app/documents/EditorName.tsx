import type { EditorRef } from "../../../../shared/types";

/**
 * Name plus the person's small colour dot. Callers set the display class
 * (`inline-flex`, `hidden sm:inline-flex`) so it can be hidden per breakpoint.
 */
export function EditorName({
  editor,
  className = "inline-flex",
}: {
  editor: EditorRef;
  className?: string;
}) {
  return (
    <span className={"items-center gap-2 " + className}>
      <span
        aria-hidden
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ background: editor.color }}
      />
      <span className="truncate">{editor.name}</span>
    </span>
  );
}
