import { forwardRef, type ReactNode } from "react";
import { Lock, Plus } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Secondary outlined notched button ("New project", "Keep"). The 6px cut with
 * the border following it: an outer box in the border colour with 1px of
 * padding and an inner face one pixel smaller. Disabled shows a lock.
 */
export const OutlinedButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    lock?: boolean;
    className?: string;
    /** Leading icon; `null` for none. Defaults to a plus. */
    icon?: ReactNode;
    /** `md` is the 40px page button, `sm` the 32px inline one. */
    size?: "md" | "sm";
  }
>(function OutlinedButton(
  { children, onClick, disabled = false, lock = false, className, icon, size = "md" },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={disabled && lock ? "Projects come with Team" : undefined}
      className={cn(
        "notch-sm inline-flex items-center border-0 bg-border p-px outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "md" ? "h-10 text-sm" : "h-8 text-xs",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "notch-sm-in flex h-full items-center gap-2 bg-card",
          size === "md" ? "px-3.5" : "px-3 font-medium",
          !disabled && "hover:bg-muted/60",
        )}
      >
        {icon === undefined ? <Plus className="size-4" aria-hidden /> : icon}
        {children}
        {lock && <Lock className="size-3.5 text-muted-foreground" aria-hidden />}
      </span>
    </button>
  );
});
