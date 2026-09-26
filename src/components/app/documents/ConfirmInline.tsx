import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { OutlinedButton } from "./OutlinedButton";

/** "Delete 'X'? This can't be undone. [Delete] [Keep]" in place of a row or card. Never window.confirm. */
export function ConfirmInline({
  question,
  note,
  onConfirm,
  onCancel,
  busy = false,
  className,
}: {
  question: ReactNode;
  note: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** The request is in flight: both buttons disabled. */
  busy?: boolean;
  className?: string;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    keepRef.current?.focus();
  }, []);
  return (
    <div
      role="alertdialog"
      aria-live="polite"
      className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm", className)}
    >
      <p>
        <span className="font-medium">{question}</span>{" "}
        <span className="text-muted-foreground">{note}</span>
      </p>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="notch-sm inline-flex h-8 items-center bg-destructive px-3 text-xs font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
        <OutlinedButton ref={keepRef} onClick={onCancel} disabled={busy} size="sm" icon={null}>
          Keep
        </OutlinedButton>
      </span>
    </div>
  );
}
