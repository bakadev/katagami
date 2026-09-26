import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router";
import type { AdminOverviewResponse, AdminTeamRow, AdminUserRow } from "../../shared/types";
import { useAuth } from "~/lib/auth/AuthProvider";
import { deleteUser, getAdminOverview, setUserPlan } from "~/lib/api/auth";
import { ConfirmInline } from "~/components/app/documents/ConfirmInline";
import { usePageMeta } from "~/hooks/usePageMeta";
import { formatRelative } from "~/hooks/useRelativeTime";
import { SiteFooter } from "~/components/site/SiteFooter";
import { NotchCard } from "~/components/site/NotchCard";
import { AppHeader } from "~/components/app/AppHeader";
import { SERIF } from "~/components/app/serif";
import { SearchField } from "~/components/app/documents/SearchField";

/**
 * Admin MVP at /admin: totals, every user with a plan control, every team
 * with its members. Who gets in is decided by ADMIN_EMAILS on the server;
 * this page only reads `isAdmin` from the session and shows a plain
 * "Admins only" note to everyone else.
 */

type PlanChoice = "auto" | "free" | "team";

function message(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : "";
  return /^\d{3}$/.test(m) || !m ? fallback : `${fallback} (${m})`;
}

export default function Admin() {
  usePageMeta({ title: "Admin", description: "Users, teams and plans." });
  const { user, loading, isAdmin } = useAuth();
  if (!loading && !user) return <Navigate to="/signin?next=%2Fadmin" replace />;
  if (!user) return null;
  if (!isAdmin) return <AdminsOnly />;
  return <Overview selfId={user.id} />;
}

function AdminsOnly() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <h1 style={{ fontFamily: SERIF }} className="text-3xl">
            Admins only
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <Link to="/documents" className="underline underline-offset-4">
              Back to your documents
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Overview({ selfId }: { selfId: string }) {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAdminOverview()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(message(e, "Couldn't load the overview."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = q.trim().toLowerCase();
  const users = useMemo(() => {
    const all = data?.users ?? [];
    if (!needle) return all;
    return all.filter(
      (u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle),
    );
  }, [data, needle]);
  const teams = useMemo(() => {
    const all = data?.teams ?? [];
    if (!needle) return all;
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.slug.toLowerCase().includes(needle) ||
        t.members.some(
          (m) => m.name.toLowerCase().includes(needle) || m.email.toLowerCase().includes(needle),
        ),
    );
  }, [data, needle]);

  const removeUser = (id: string) =>
    setData((d) =>
      d
        ? {
            ...d,
            users: d.users.filter((u) => u.id !== id),
            totals: { ...d.totals, users: d.totals.users - 1 },
          }
        : d,
    );
  const updateUser = (id: string, patch: Partial<AdminUserRow>) =>
    setData((d) =>
      d ? { ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) } : d,
    );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-10 sm:pt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 style={{ fontFamily: SERIF }} className="text-3xl leading-tight sm:text-4xl">
              Admin
            </h1>
            <SearchField
              value={q}
              onChange={setQ}
              className="sm:w-72"
              label="Search users and teams"
              placeholder="Search by name or email"
            />
          </div>

          {loadError && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {loadError}
            </p>
          )}

          {/* Totals */}
          <section className="mt-8" aria-label="Totals">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
              <Stat label="Users" value={data?.totals.users} />
              <Stat label="Teams" value={data?.totals.teams} />
              <Stat label="Projects" value={data?.totals.projects} />
              <Stat label="Documents" value={data?.totals.documents} />
              <Stat label="Anonymous documents" value={data?.totals.anonymousDocuments} />
            </div>
          </section>

          {/* Users */}
          <section className="mt-12" aria-labelledby="admin-users">
            <div className="flex items-baseline gap-3">
              <h2 id="admin-users" style={{ fontFamily: SERIF }} className="text-2xl">
                Users
              </h2>
              {data && (
                <span className="text-xs text-muted-foreground">
                  {needle ? `${users.length} of ${data.users.length}` : data.users.length}
                </span>
              )}
            </div>
            <NotchCard outerClassName="mt-4" className="overflow-x-auto">
              {!data ? (
                <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>
              ) : users.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {needle ? "No one matches." : "No users yet."}
                </p>
              ) : (
                <table className="w-full min-w-[840px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Joined</Th>
                      <Th>Plan</Th>
                      <Th>Teams</Th>
                      <Th className="text-right">Documents</Th>
                      <Th>Override</Th>
                      <Th className="text-right">
                        <span className="sr-only">Actions</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        self={u.id === selfId}
                        onChange={(patch) => updateUser(u.id, patch)}
                        onRemoved={() => {
                          removeUser(u.id);
                          // Totals and the teams table may have changed too.
                          void getAdminOverview().then(setData).catch(() => undefined);
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </NotchCard>
          </section>

          {/* Teams */}
          <section className="mt-12" aria-labelledby="admin-teams">
            <div className="flex items-baseline gap-3">
              <h2 id="admin-teams" style={{ fontFamily: SERIF }} className="text-2xl">
                Teams
              </h2>
              {data && (
                <span className="text-xs text-muted-foreground">
                  {needle ? `${teams.length} of ${data.teams.length}` : data.teams.length}
                </span>
              )}
            </div>
            <NotchCard outerClassName="mt-4" className="overflow-x-auto">
              {!data ? (
                <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>
              ) : teams.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {needle ? "No team matches." : "No teams yet."}
                </p>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Th>Name</Th>
                      <Th>Slug</Th>
                      <Th>Created</Th>
                      <Th>Members</Th>
                      <Th className="text-right">Projects</Th>
                      <Th className="text-right">Documents</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teams.map((t) => (
                      <TeamRow key={t.id} team={t} />
                    ))}
                  </tbody>
                </table>
              )}
            </NotchCard>
          </section>

          <p className="mt-10 text-xs text-muted-foreground">
            Admin access comes from ADMIN_EMAILS on the server. Promo codes, invites and
            subscriptions are not built yet.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <NotchCard className="px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p style={{ fontFamily: SERIF }} className="mt-1 text-3xl leading-none">
        {value === undefined ? "–" : value}
      </p>
    </NotchCard>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th scope="col" className={"whitespace-nowrap px-4 py-2.5 font-normal " + className}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={"px-4 py-3 align-top " + className}>
      {children}
    </td>
  );
}

function Chip({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "indigo" }) {
  return (
    <span
      className={
        "notch-sm inline-block px-2 py-0.5 text-xs " +
        (tone === "indigo" ? "bg-brand-tint text-brand-ink" : "bg-muted text-muted-foreground")
      }
    >
      {children}
    </span>
  );
}

function UserRow({
  user,
  self,
  onChange,
  onRemoved,
}: {
  user: AdminUserRow;
  /** The signed-in admin's own row: no delete. */
  self: boolean;
  onChange: (patch: Partial<AdminUserRow>) => void;
  onRemoved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(user.id);
      onRemoved();
    } catch (e) {
      setError(message(e, "Couldn't delete the user."));
      setDeleting(false);
      setConfirming(false);
    }
  };
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choice: PlanChoice = user.planOverride ?? "auto";

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(id);
  }, [saved]);

  const pick = async (next: PlanChoice) => {
    if (busy || next === choice) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await setUserPlan(user.id, next === "auto" ? null : next);
      onChange({ planOverride: res.planOverride as AdminUserRow["planOverride"], plan: res.plan });
      setSaved(true);
    } catch (e) {
      setError(message(e, "Couldn't change the plan."));
    } finally {
      setBusy(false);
    }
  };

  if (confirming) {
    return (
      <tr>
        <Td className="bg-destructive/5" colSpan={8}>
          <ConfirmInline
            question={
              <>
                Delete <strong>{user.name}</strong> ({user.email})?
              </>
            }
            note={`Removes their ${user.documentCount === 1 ? "document" : `${user.documentCount} documents`}, their projects, and any team they were the last member of. This can't be undone.`}
            busy={deleting}
            onConfirm={() => void remove()}
            onCancel={() => setConfirming(false)}
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </Td>
      </tr>
    );
  }

  return (
    <tr>
      <Td className="whitespace-nowrap">{user.name}</Td>
      <Td className="whitespace-nowrap text-muted-foreground">{user.email}</Td>
      <Td className="whitespace-nowrap text-muted-foreground">{formatRelative(user.createdAt)}</Td>
      <Td>
        <Chip tone={user.plan === "team" ? "indigo" : "gray"}>{user.plan === "team" ? "Team" : "Free"}</Chip>
      </Td>
      <Td className="text-muted-foreground">
        {user.teams.length === 0 ? "–" : user.teams.map((t) => t.name).join(", ")}
      </Td>
      <Td className="text-right tabular-nums">{user.documentCount}</Td>
      <Td>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label={`Plan override for ${user.name}`}
            value={choice}
            disabled={busy}
            onChange={(v) => void pick(v)}
          />
          {saved && (
            <span role="status" className="text-xs text-brand-ink">
              Saved
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </Td>
      <Td className="text-right">
        {!self && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
          >
            Delete
          </button>
        )}
      </Td>
    </tr>
  );
}

const CHOICES: { value: PlanChoice; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "free", label: "Free" },
  { value: "team", label: "Team" },
];

/** Three-way "Auto · Free · Team" control; Auto means no override. */
function Segmented({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: PlanChoice;
  disabled?: boolean;
  onChange: (v: PlanChoice) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="notch-sm inline-flex bg-border p-px"
    >
      <div className="notch-sm-in flex divide-x divide-border bg-card">
        {CHOICES.map((c) => {
          const on = c.value === value;
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(c.value)}
              className={
                "h-7 px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60 " +
                (on ? "bg-brand-tint font-medium text-brand-ink" : "text-muted-foreground hover:text-foreground")
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: AdminTeamRow }) {
  return (
    <tr>
      <Td className="whitespace-nowrap">{team.name}</Td>
      <Td className="whitespace-nowrap text-muted-foreground">{team.slug}</Td>
      <Td className="whitespace-nowrap text-muted-foreground">{formatRelative(team.createdAt)}</Td>
      <Td>
        {team.members.length === 0 ? (
          <span className="text-muted-foreground">–</span>
        ) : (
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {team.members.map((m) => (
              <li key={m.id} className="flex items-center gap-1.5 whitespace-nowrap">
                <span title={m.email}>{m.name}</span>
                <Chip>{m.role}</Chip>
              </li>
            ))}
          </ul>
        )}
      </Td>
      <Td className="text-right tabular-nums">{team.projectCount}</Td>
      <Td className="text-right tabular-nums">{team.documentCount}</Td>
    </tr>
  );
}
