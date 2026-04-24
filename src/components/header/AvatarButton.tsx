import { forwardRef } from "react";
import { User } from "lucide-react";
import { cn } from "~/lib/utils";

export interface AvatarButtonProps {
  name: string;
  /** Kept for API parity; unused in the icon-only variant. */
  color?: string;
  onClick?: () => void;
  active: boolean;
}

/**
 * AvatarButton — the user's sigil in the top-right of the editor.
 *
 * A 32px circle filled with the foreground token (black in light mode, white
 * in dark mode) with a User icon in the inverse color. Identity-color is no
 * longer rendered here — color stays in the dropdown header so the trigger
 * itself reads as a quiet, theme-coherent control.
 *
 * Designed to be handed to `DropdownMenuTrigger asChild` — forwards ref so
 * Radix can wire its own onClick through.
 */
export const AvatarButton = forwardRef<HTMLButtonElement, AvatarButtonProps>(
  function AvatarButton({ name, onClick, active }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={`Open user menu for ${name}`}
        data-active={active ? "" : undefined}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          "select-none outline-none",
          "bg-foreground text-background",
          // Quiet ring states — transparent at rest, primary tint on hover/open
          "ring-2 ring-transparent transition-shadow duration-150 ease-out",
          "hover:ring-primary/30 data-[active]:ring-primary/40",
          "focus-visible:ring-ring/60 focus-visible:ring-[3px]",
        )}
      >
        <User aria-hidden className="size-4" />
      </button>
    );
  },
);
