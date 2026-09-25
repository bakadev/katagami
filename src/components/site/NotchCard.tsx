import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * NotchCard — the stencil-sheet container: a box with all four corners cut
 * at 45°, outlined by a 1px border that follows the cut.
 *
 * A CSS border can't do that (the clip-path slices it off at the corners),
 * so the card is two layers: an outer box painted in the border colour with
 * 1px of padding, and an inner box one pixel smaller painted in the fill.
 * Callers style the inner box through `className`; `outerClassName` is for
 * layout that must apply to the whole card (grid placement, height).
 *
 *   tone   gray    hairline border (default)
 *          indigo  brand border, lighter blue in dark mode
 *   fill   card    card surface (default)
 *          tint    indigo wash, for the selected one of a set
 *          background  page surface (editor card, panel)
 *          none    caller paints the inner box
 *   size   md      10px cut (cards, panels, forms)
 *          sm      6px cut (chips, stepper numbers, small tiles)
 */

export type NotchTone = "gray" | "indigo";
export type NotchFill = "card" | "tint" | "background" | "none";
export type NotchSize = "md" | "sm";

type Own<T extends ElementType> = {
  as?: T;
  tone?: NotchTone;
  fill?: NotchFill;
  size?: NotchSize;
  /** Drop shadow on the whole card. */
  shadow?: boolean;
  /** Classes for the outer (border) layer. */
  outerClassName?: string;
  /** Classes for the inner (fill) layer, where content lives. */
  className?: string;
  children?: ReactNode;
};

export type NotchCardProps<T extends ElementType = "div"> = Own<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof Own<T>>;

const TONE: Record<NotchTone, string> = {
  gray: "bg-border",
  indigo: "bg-brand-ink",
};

const FILL: Record<NotchFill, string> = {
  card: "bg-card",
  tint: "bg-brand-tint",
  background: "bg-background",
  none: "",
};

export function NotchCard<T extends ElementType = "div">({
  as,
  tone = "gray",
  fill = "card",
  size = "md",
  shadow = false,
  outerClassName,
  className,
  children,
  ...rest
}: NotchCardProps<T>) {
  const Inner = (as ?? "div") as ElementType;
  const outerCut = size === "md" ? "notch" : "notch-sm";
  const innerCut = size === "md" ? "notch-in" : "notch-sm-in";
  return (
    <div
      className={cn(
        outerCut,
        "flex flex-col p-px",
        TONE[tone],
        shadow && "shadow-md",
        outerClassName,
      )}
    >
      <Inner {...rest} className={cn(innerCut, "min-h-0 flex-1", FILL[fill], className)}>
        {children}
      </Inner>
    </div>
  );
}
