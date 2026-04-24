import { forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface AvatarButtonProps {
  name: string;
  color: string;
  onClick?: () => void;
  active: boolean;
}

/**
 * AvatarButton — the user's colored sigil in the top-right of the editor.
 *
 * A 32px circle rendered in the user's cursor color, with the first letter of
 * their name centered inside. The button gains a soft primary-tinted ring on
 * hover and keeps the ring whenever the dropdown it triggers is `active`.
 *
 * Designed to be handed to `DropdownMenuTrigger asChild` — forwards ref, passes
 * through arbitrary DOM props via rest. The click handler is optional because
 * Radix takes over the trigger role when composed.
 */
export const AvatarButton = forwardRef<HTMLButtonElement, AvatarButtonProps>(
  function AvatarButton({ name, color, onClick, active }, ref) {
    const initial = name.trim().charAt(0).toUpperCase() || "?";

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={`Open user menu for ${name}`}
        data-active={active ? "" : undefined}
        className={cn(
          // Layout
          "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          // Reset native affordances
          "cursor-pointer select-none outline-none",
          // Ring behavior: none at rest, primary/30 on hover, same on active
          "ring-2 ring-transparent transition-[box-shadow,transform,background-color] duration-100 ease-out",
          "hover:ring-primary/30",
          "data-[active]:ring-primary/40",
          // Active press — subtle, only on hover/click, not when dropdown is open
          "active:not-data-[active]:scale-[0.96]",
          // Keyboard focus: clearer ring in our normal focus language
          "focus-visible:ring-ring/60 focus-visible:ring-[3px]",
        )}
        style={{ backgroundColor: color }}
      >
        {/* Dimensional inner gradient — subtle top highlight, soft bottom depth.
            Matches any hex background; only a white alpha overlay. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-black/10 mix-blend-overlay"
        />
        {/* Hairline inner border — reads crisp on any backdrop */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/5"
        />
        <span
          className="relative font-semibold leading-none text-white"
          style={{ fontSize: "13px" }}
        >
          {initial}
        </span>
      </button>
    );
  },
);
