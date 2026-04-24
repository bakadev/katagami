import type { ComponentType, MouseEvent } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export interface ToolbarButtonProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "data-testid"?: string;
}

export function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  "data-testid": testid,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          data-testid={testid}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
