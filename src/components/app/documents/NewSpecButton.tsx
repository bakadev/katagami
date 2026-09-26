import { Plus } from "lucide-react";
import { useCreateDoc } from "~/hooks/useCreateDoc";
import { cn } from "~/lib/utils";

/** Primary "New spec" button, notched, indigo. Creates in `projectId` or the default project. */
export function NewSpecButton({
  projectId,
  className,
}: {
  projectId?: string;
  className?: string;
}) {
  const { create, loading, error } = useCreateDoc(projectId);
  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={() => void create()}
        disabled={loading}
        className="notch-sm inline-flex h-10 items-center gap-2 bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden />
        {loading ? "Starting…" : "New spec"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          Couldn't start a spec. {error}
        </span>
      )}
    </span>
  );
}
