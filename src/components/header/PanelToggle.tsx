import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export interface PanelToggleProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * PanelToggle — icon-only toggle for the right-hand comments/snapshots panel.
 *
 * Keeps the button visually stable: same size and same grid slot whether the
 * panel is open or closed — only the icon direction changes. `aria-pressed`
 * communicates toggle-state semantics to assistive tech.
 */
export function PanelToggle({ open, onToggle }: PanelToggleProps) {
  const Icon = open ? PanelRightClose : PanelRightOpen;
  const label = open ? "Hide panel" : "Show panel";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={label}
            aria-pressed={open}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon strokeWidth={2} aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
