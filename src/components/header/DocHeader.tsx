import { useId, type ReactNode } from "react";
import { Eye, MessageSquareDiff, PenLine } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { StencilMark } from "~/components/site/StencilMark";
import { useAuth } from "~/lib/auth/AuthProvider";
import { MetaLine, type ConnectionState, type Permission } from "./MetaLine";
import { ExportMenu } from "./ExportMenu";
import { PanelToggle } from "./PanelToggle";
import { SaveSnapshotButton } from "./SaveSnapshotButton";
import { TitleEditor } from "./TitleEditor";

export type EditorMode = "edit" | "suggest" | "preview";

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
  onExportMarkdown: () => void;
  avatarSlot: ReactNode;
}

type ModeOption = {
  value: EditorMode;
  label: string;
  shortLabel: string;
  icon: typeof PenLine;
};

const MODE_OPTIONS: readonly ModeOption[] = [
  { value: "edit", label: "Edit directly", shortLabel: "Edit", icon: PenLine },
  {
    value: "suggest",
    label: "Suggest: edits become suggestions",
    shortLabel: "Suggest",
    icon: MessageSquareDiff,
  },
  { value: "preview", label: "Preview the rendered document", shortLabel: "Preview", icon: Eye },
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
  const thumbOffset = `${index * 100}%`;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="tablist"
        aria-label="View mode"
        aria-orientation="horizontal"
        className={cn(
          "relative items-center rounded-sm border border-border bg-muted/40 p-0.5 grid grid-cols-3",
          "shadow-[inset_0_1px_0_rgb(0_0_0/0.02)]",
        )}
      >
        {/* Sliding thumb — matches the ThemeTriState easing curve */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 rounded-sm bg-secondary",
            "shadow-sm ring-1 ring-border/60",
            "transition-transform duration-200 ease-in-out",
          )}
          style={{
            width: "calc((100% - 4px) / 3)",
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
                    // flex-1 makes the three modes share equal width so the
                    // sliding thumb's `(100% - 4px) / 3` math is correct.
                    "relative z-10 inline-flex h-7 w-9 flex-1 items-center justify-center rounded-sm md:h-6 md:w-auto md:gap-1 md:px-2.5",
                    "cursor-pointer outline-none",
                    "text-xs font-medium",
                    "transition-colors duration-150 ease-out",
                    isActive
                      ? "text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring/60",
                  )}
                >
                  <Icon className="size-[15px] md:size-[13px]" strokeWidth={2} aria-hidden />
                  <span className="sr-only md:not-sr-only md:inline">{opt.shortLabel}</span>
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
  onExportMarkdown,
  avatarSlot,
}: DocHeaderProps) {
  const signedIn = useAuth().user !== null;
  return (
    <header
      role="banner"
      className={cn(
        // The header takes the utility bar's ground: indigo with the faint
        // seigaiha, so the site carries straight into the app. Controls
        // read on it through the scoped `on-indigo` token overrides.
        "on-indigo relative w-full bg-brand",
      )}
    >
      <div
        aria-hidden
        className="seigaiha pointer-events-none absolute inset-0 text-white opacity-[0.12]"
      />
      <div
        className={cn(
          // Phones: identity on the first line, controls on a second line.
          // From md up, one row.
          "relative flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 md:flex-nowrap md:gap-4",
          "px-3 py-2 md:px-6 md:py-2.5",
        )}
      >
        {/* ---- LEFT: document identity ---- */}
        <div className="flex min-w-0 basis-full items-center gap-3 md:flex-1 md:basis-auto">
          <Link
            to={signedIn ? "/documents" : "/"}
            aria-label={signedIn ? "Your documents" : "Katagami home"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <StencilMark />
          </Link>
          <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
          <div className="min-w-0 max-w-[60ch] shrink">
            <TitleEditor
              title={title}
              onSave={onSaveTitle}
              readOnly={readOnly}
            />
          </div>
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
        <div className="flex w-full shrink-0 items-center gap-2 md:w-auto md:gap-3">
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

          {/* Export and the account menu sit together at the far end; on
              phones the pair is pushed to the end of the controls row. */}
          <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
            <ExportMenu onExportMarkdown={onExportMarkdown} />
            {avatarSlot}
          </div>
        </div>
      </div>
    </header>
  );
}

