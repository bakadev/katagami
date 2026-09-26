import type {
  ClaimCandidate,
  ClaimLookupResponse,
  ClaimResponse,
  CreateTeamResponse,
  CreateProjectResponse,
  HomeResponse,
  ProjectCard,
  ProjectPageResponse,
  MeResponse,
  SessionUser,
  UpdateMeRequest,
  AdminOverviewResponse,
} from "../../../shared/types";

/** Who is signed in, or null. Never throws for the signed-out case. */
export async function getMe(): Promise<MeResponse | null> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`getMe failed: ${res.status}`);
  return (await res.json()) as MeResponse;
}

export async function signOut(): Promise<void> {
  const res = await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
  if (!res.ok) throw new Error(`signOut failed: ${res.status}`);
}

/** Where a provider button should send the browser. */
export function signInUrl(provider: "github" | "google", next?: string): string {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return `/api/auth/${provider}${q}`;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      message = ((await res.json()) as { message?: string }).message ?? message;
    } catch {
      // keep status
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function createTeam(name: string): Promise<CreateTeamResponse> {
  return post("/api/teams", { name });
}

export function lookupClaims(projects: ClaimCandidate[]): Promise<ClaimLookupResponse> {
  return post("/api/claim/lookup", { projects });
}

/** Claim projects; with a team they join it, without one (Free) their documents land in the default project. */
export function claimProjects(projects: ClaimCandidate[], teamId?: string): Promise<ClaimResponse> {
  return post("/api/claim", teamId ? { teamId, projects } : { projects });
}

/* ---- signed-in home ----------------------------------------------------------- */

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

async function del(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
  if (!res.ok && res.status !== 204) throw new Error(`${res.status}`);
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

export const getHome = () => getJson<HomeResponse>("/api/home");
export const getProject = (id: string) => getJson<ProjectPageResponse>(`/api/projects/${id}`);
export const createDocument = (projectId?: string) =>
  post<CreateProjectResponse>("/api/documents", projectId ? { projectId } : {});
export const createProject = (name: string) =>
  post<{ project: ProjectCard }>("/api/projects/new", { name });
export const renameProject = (id: string, name: string) =>
  patch<{ project: { id: string; name: string | null } }>(`/api/projects/${id}`, { name });
export const deleteProject = (id: string) => del(`/api/projects/${id}`);
export const deleteDocument = (id: string) => del(`/api/docs/${id}`);
export const moveDocument = (id: string, projectId: string | null) =>
  patch<{ ok: true; projectId: string }>(`/api/docs/${id}/project`, { projectId });

export const updateMe = (body: UpdateMeRequest) => patch<{ user: SessionUser }>("/api/auth/me", body);

/* ---- admin ---------------------------------------------------------------------- */

export const getAdminOverview = () => getJson<AdminOverviewResponse>("/api/admin/overview");
export const setUserPlan = (userId: string, planOverride: "free" | "team" | null) =>
  patch<{ id: string; planOverride: string | null; plan: "free" | "team" }>(
    `/api/admin/users/${userId}/plan`,
    { planOverride },
  );
