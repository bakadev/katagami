import { useId, type ReactNode } from "react";
import { Eye, FileText, PenLine } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { MetaLine, type ConnectionState, type Permission } from "./MetaLine";
import { PanelToggle } from "./PanelToggle";
import { SaveSnapshotButton } from "./SaveSnapshotButton";
import { TitleEditor } from "./TitleEditor";

export type EditorMode = "edit" | "preview";

export interface DocHeaderProps {
  title: string | null;
  onSaveTitle: (next: string | null) => void;
  readOnly: boolean;
  updatedAt: string | null;
  connection: ConnectionState;
  permission: Permission;
  mode: EditorMode;
  onModeChange: (m: EditorMode) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onSaveSnapshot: (name: string) => void | Promise<void>;
  avatarSlot: ReactNode;
}

type ModeOption = {
  value: EditorMode;
  label: string;
  shortLabel: string;
  icon: typeof PenLine;
};

const MODE_OPTIONS: readonly ModeOption[] = [
  { value: "edit", label: "Edit mode", shortLabel: "Edit", icon: PenLine },
  { value: "preview", label: "Preview mode", shortLabel: "Preview", icon: Eye },
];

/**
 * EditPreviewTabs — internal segmented control for Edit / Preview.
 *
 * Mirrors `ThemeTriState`'s sliding-thumb pattern (scaled to two options) so
 * the two segmented controls in this app share vocabulary. Uses proper tab
 * semantics: `role="tablist"` on the group, `role="tab"` on each option, and
 * `aria-selected` to mark the active state.
 */
function EditPreviewTabs({
  value,
  onChange,
}: {
  value: EditorMode;
  onChange: (m: EditorMode) => void;
}) {
  const groupId = useId();
  const index = MODE_OPTIONS.findIndex((o) => o.value === value);
  // translateX percentages resolve against the element's own width, so
  // `index * 100%` slides the thumb by exactly one thumb-width per slot.
  // Using `(100% / 2)` of the container would overshoot because the thumb
  // is narrower than half the container by the 4px of inset padding.
  const thumbOffset = `${index * 100}%`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="tablist"
        aria-label="View mode"
        aria-orientation="horizontal"
        className={cn(
          "relative inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5",
          "shadow-[inset_0_1px_0_rgb(0_0_0/0.02)]",
        )}
      >
        {/* Sliding thumb — matches the ThemeTriState easing curve */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 rounded-[5px] bg-secondary",
            "shadow-sm ring-1 ring-border/60",
            "transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          )}
          style={{
            width: "calc((100% - 4px) / 2)",
            transform: `translateX(${thumbOffset})`,
            // The thumb slides exactly one thumb-width per slot.
          }}
        />

        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.value === value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  id={`${groupId}-${opt.value}`}
                  aria-selected={isActive}
                  aria-controls={`${groupId}-${opt.value}-panel`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => {
                    if (!isActive) onChange(opt.value);
                  }}
                  className={cn(
                    "relative z-10 inline-flex h-6 items-center justify-center gap-1 rounded-[5px] px-2.5",
                    "cursor-pointer outline-none",
                    "text-xs font-medium",
                    "transition-colors duration-150 ease-out",
                    isActive
                      ? "text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring/60",
                  )}
                >
                  <Icon className="size-[13px]" strokeWidth={2} aria-hidden />
                  <span>{opt.shortLabel}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{opt.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

/**
 * DocHeader — the top chrome of the editor route.
 *
 * Two-column layout: document identity on the left (icon + title + meta), and
 * a cluster of controls on the right (snapshot, mode tabs, panel toggle, and
 * whatever avatar the route passes in). A hairline bottom border plus a
 * faintly tinted / blurred background separates the chrome from the doc body.
 */
export function DocHeader({
  title,
  onSaveTitle,
  readOnly,
  updatedAt,
  connection,
  permission,
  mode,
  onModeChange,
  panelOpen,
  onTogglePanel,
  onSaveSnapshot,
  avatarSlot,
}: DocHeaderProps) {
  return (
    <header
      role="banner"
      className={cn(
        // Header sits on the muted main backdrop; no border or fill of its
        // own so it reads as part of the page chrome rather than a card.
        "w-full",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3 md:gap-4",
          "px-4 py-2.5 md:px-6",
        )}
      >
        {/* ---- LEFT: document identity (single row) ---- */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <FileText
            aria-hidden
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <TitleEditor
            title={title}
            onSave={onSaveTitle}
            readOnly={readOnly}
          />
          {/* MetaLine sits inline to the right of the title with a quiet
              vertical separator so it reads as a status pair rather than
              part of the title itself. */}
          <span
            aria-hidden
            className="hidden h-4 w-px shrink-0 bg-border md:inline-block"
          />
          <MetaLine
            updatedAt={updatedAt}
            connection={connection}
            permission={permission}
          />
        </div>

        {/* ---- RIGHT: controls cluster ---- */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <SaveSnapshotButton
            disabled={readOnly}
            onSave={onSaveSnapshot}
          />

          <EditPreviewTabs value={mode} onChange={onModeChange} />

          {/* Vertical separator quietly groups the avatar cluster away from
              the mode tabs so the eye reads two zones instead of four icons */}
          <span
            aria-hidden
            className="hidden h-5 w-px bg-border/70 md:inline-block"
          />

          <PanelToggle open={panelOpen} onToggle={onTogglePanel} />

          {/* Avatar slot is a pass-through — whatever the route wires in */}
          {avatarSlot}
        </div>
      </div>
    </header>
  );
}
