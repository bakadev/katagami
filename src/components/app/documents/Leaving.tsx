import { useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

/* Height collapse + fade + slight slide, ~250ms. */
export const LEAVE_MS = 250;

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Wraps a row or card. When `leaving` turns true the element collapses
 * (height, padding, border), fades and slides up over 250ms, then `onGone`
 * fires so the parent removes it from state. With reduced motion `onGone`
 * fires at once. `mode="fade"` skips the height collapse (grid cards).
 */
export function Leaving<T extends "li" | "div" = "li">({
  as,
  leaving,
  onGone,
  mode = "collapse",
  className,
  children,
  ...rest
}: {
  as?: T;
  leaving: boolean;
  onGone: () => void;
  mode?: "collapse" | "fade";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">) {
  const Tag = (as ?? "li") as "li";
  const ref = useRef<HTMLLIElement>(null);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  useLayoutEffect(() => {
    if (!leaving) return;
    const el = ref.current;
    if (!el || reducedMotion()) {
      goneRef.current();
      return;
    }
    const h = el.getBoundingClientRect().height;
    const st = el.style;
    st.overflow = "hidden";
    st.pointerEvents = "none";
    if (mode === "collapse") st.height = `${h}px`;
    st.transition = `height ${LEAVE_MS}ms ease, padding ${LEAVE_MS}ms ease, border-width ${LEAVE_MS}ms ease, opacity ${LEAVE_MS}ms ease, transform ${LEAVE_MS}ms ease`;
    /* Reflow so the transition starts from the measured height. */
    void el.getBoundingClientRect();
    st.opacity = "0";
    st.transform = "translateY(-6px)";
    if (mode === "collapse") {
      st.height = "0px";
      st.paddingTop = "0px";
      st.paddingBottom = "0px";
      st.borderTopWidth = "0px";
      st.borderBottomWidth = "0px";
    }
    const t = window.setTimeout(() => goneRef.current(), LEAVE_MS + 20);
    return () => window.clearTimeout(t);
  }, [leaving, mode]);

  return (
    <Tag ref={ref} className={className} aria-hidden={leaving || undefined} {...(rest as object)}>
      {children}
    </Tag>
  );
}
