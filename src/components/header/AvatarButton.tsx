import { type ComponentPropsWithoutRef, type Ref } from "react";
import { User } from "lucide-react";
import { cn } from "~/lib/utils";

export interface AvatarButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "ref"> {
  /** Display name — used to compose the aria-label. */
  name: string;
  /** Whether the menu it triggers is currently open. */
  active: boolean;
  /** React 19 ref-as-prop. Radix's `asChild` Slot wires this up. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * AvatarButton — the user's sigil in the top-right of the editor.
 *
 * Restyled to match the rest of the icon buttons in the header (Save snapshot,
 * panel toggle): white surface + hairline border in light mode, inverse in
 * dark mode, with a quiet User icon inside.
 *
 * Implementation notes:
 *   - Spreads `...rest` so Radix's `DropdownMenuTrigger asChild` can clone its
 *     onClick / aria-* / data-* props directly onto the button. No bespoke
 *     onClick or data-active prop, both of which used to fight with Radix's
 *     own attributes.
 *   - Uses the React 19 `ref` prop pattern (no `forwardRef` wrapper).
 */
export function AvatarButton({
  name,
  active: _active,
  className,
  ref,
  ...rest
}: AvatarButtonProps) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-label={`Open user menu for ${name}`}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        "border border-border bg-background text-foreground",
        "outline-none transition-colors duration-150 ease-out",
        "hover:bg-muted hover:text-foreground",
        // Radix toggles data-state="open" on the trigger when the menu is open.
        "data-[state=open]:bg-muted data-[state=open]:ring-2 data-[state=open]:ring-primary/30",
        "focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
    >
      <User aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );
}
