import { Link } from "react-router";
import { NotchCard } from "~/components/site/NotchCard";
import { RegMarks } from "~/components/site/RegMark";
import { StencilMark } from "~/components/site/StencilMark";
import { SERIF } from "../serif";
import { NewSpecButton } from "./NewSpecButton";

/** Komon field with the mark, for when there is nothing to list at all. */
export function EmptyState({
  projectId,
  unclaimed = 0,
}: {
  /** Where "New spec" creates; the default project when absent. */
  projectId?: string;
  /** Creator keys still on this browser; shows the claim link when above zero. */
  unclaimed?: number;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="komon pointer-events-none absolute inset-0 text-brand-ink opacity-[0.12] dark:opacity-[0.2]"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center sm:py-20">
        <div className="relative">
          <RegMarks />
          <NotchCard tone="indigo" className="flex size-16 items-center justify-center">
            <StencilMark className="size-7" />
          </NotchCard>
        </div>
        <h2 style={{ fontFamily: SERIF }} className="mt-8 text-2xl leading-tight">
          Nothing cut yet.
        </h2>
        <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
          {unclaimed > 0
            ? "Start a spec, or bring in the ones on this browser."
            : "Start a spec. It saves as you type and has a link from the first word."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <NewSpecButton projectId={projectId} />
          {unclaimed > 0 && (
            <Link to="/claim" className="text-sm text-brand-ink underline underline-offset-4">
              Bring in {unclaimed} from this browser
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
