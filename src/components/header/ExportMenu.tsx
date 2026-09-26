import { Download, FileCode2, FileText, FileType2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export interface ExportMenuProps {
  onExportMarkdown: () => void;
  /**
   * Force the menu open at mount. Test-only seam, not part of the public API.
   * @internal
   */
  __testDefaultOpen?: boolean;
}

/**
 * ExportMenu: the header's "Export" button. Sits beside the account menu and
 * matches SaveSnapshotButton's face (outline, icon + label, label hidden on
 * phones). Markdown works today; styled HTML and PDF are listed but disabled
 * so the shape of the feature is visible before it lands.
 */
export function ExportMenu({ onExportMarkdown, __testDefaultOpen }: ExportMenuProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu defaultOpen={__testDefaultOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Export"
                className={cn("gap-1.5", "[&_svg]:size-[14px]")}
              >
                <Download strokeWidth={2} aria-hidden />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            Export this document
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" sideOffset={8} className="w-[200px]">
          <DropdownMenuItem
            onSelect={() => queueMicrotask(onExportMarkdown)}
            className="gap-2 px-2 py-1.5 text-sm"
          >
            <FileText className="size-4 text-muted-foreground" />
            <span>Markdown (.md)</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled aria-disabled className="gap-2 px-2 py-1.5 text-sm">
            <FileCode2 className="size-4 text-muted-foreground" />
            <span>Styled HTML</span>
            <DropdownMenuShortcut className="tracking-normal">Soon</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled aria-disabled className="gap-2 px-2 py-1.5 text-sm">
            <FileType2 className="size-4 text-muted-foreground" />
            <span>PDF</span>
            <DropdownMenuShortcut className="tracking-normal">Soon</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
