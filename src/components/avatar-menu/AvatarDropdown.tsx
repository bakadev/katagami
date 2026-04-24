import type { ReactNode } from "react";
import { Download, LogIn, PenLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ThemeTriState, type Theme } from "./ThemeTriState";

export interface AvatarDropdownProps {
  identity: { name: string; color: string };
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  onRenameClick: () => void;
  onDownloadClick: () => void;
  trigger: ReactNode;
  /** Force the menu open — useful for tests; not for production use. */
  defaultOpen?: boolean;
}

/**
 * AvatarDropdown — the top-right user menu panel.
 *
 * Composition (top to bottom):
 *   1. Header — color dot + display name + "You" label
 *   2. Theme row — inline label & ThemeTriState segmented control
 *   3. Actions — Rename & Download as Markdown (DropdownMenuItems)
 *   4. Separator
 *   5. Disabled "Log in" item, tooltip explains it's coming later
 *
 * The consumer passes an `AvatarButton` (or any trigger node) via the `trigger`
 * prop — it's wrapped with `DropdownMenuTrigger asChild`, so all Radix a11y and
 * keyboard behavior flows through.
 */
export function AvatarDropdown({
  identity,
  theme,
  onThemeChange,
  onRenameClick,
  onDownloadClick,
  trigger,
  defaultOpen,
}: AvatarDropdownProps) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[260px] p-0"
      >
        {/* 1. Identity header — not interactive, just information */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span
            aria-hidden
            className="relative size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
            style={{ backgroundColor: identity.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight text-foreground">
              {identity.name}
            </div>
            <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
              You
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* 2. Theme row — label left, segmented control right */}
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm text-foreground">Theme</span>
          <ThemeTriState value={theme} onChange={onThemeChange} />
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* 3. Primary actions */}
        <div className="p-1">
          <DropdownMenuItem
            onSelect={(e) => {
              // Defer to the next tick so the menu can close first; keeps
              // focus management clean when the Rename modal opens.
              e.preventDefault();
              queueMicrotask(onRenameClick);
            }}
            className="gap-2 px-2 py-1.5 text-sm"
          >
            <PenLine className="size-4 text-muted-foreground" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              queueMicrotask(onDownloadClick);
            }}
            className="gap-2 px-2 py-1.5 text-sm"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Download as Markdown</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* 4. Disabled "Log in" — tooltip explains the disable reason */}
        <div className="p-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/*
                 * Radix's DropdownMenuItem handles `disabled` by setting
                 * data-disabled and pointer-events: none — but that also kills
                 * tooltip hover. We wrap in a span so the tooltip can still
                 * detect pointer events while the item itself remains visually
                 * and semantically disabled.
                 */}
                <span tabIndex={0} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                  <DropdownMenuItem
                    disabled
                    className="gap-2 px-2 py-1.5 text-sm"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <LogIn className="size-4 text-muted-foreground" />
                    <span>Log in</span>
                  </DropdownMenuItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                Authentication coming in a future phase
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
