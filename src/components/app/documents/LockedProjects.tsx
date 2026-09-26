import { Link } from "react-router";
import { NotchCard } from "~/components/site/NotchCard";

/** The Projects section body on Free: what Team adds, and where to get it. */
export function LockedProjects() {
  return (
    <NotchCard
      outerClassName="mt-4"
      fill="none"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-4 py-4 text-sm sm:px-5"
    >
      <p>
        <span className="font-medium">Projects come with Team.</span>{" "}
        <span className="text-muted-foreground">
          Group specs, share seats and keep named history.
        </span>
      </p>
      <Link to="/pricing" className="text-brand-ink underline underline-offset-4">
        See Team
      </Link>
    </NotchCard>
  );
}
