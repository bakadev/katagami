/**
 * PanelFiller: the komon field that fills whatever space a tab's list leaves
 * below its last item, behind a hairline. Lists end where their content
 * ends; the sheet keeps its pattern to the bottom of the panel.
 */
export function PanelFiller({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={"relative min-h-[96px] flex-1 border-t border-border " + className}>
      <div className="komon pointer-events-none absolute inset-0 text-brand-ink opacity-[0.10] dark:opacity-[0.16]" />
    </div>
  );
}
