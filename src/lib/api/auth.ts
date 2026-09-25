import type {
  ClaimCandidate,
  ClaimLookupResponse,
  ClaimResponse,
  CreateWorkspaceResponse,
  MeResponse,
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

export function createWorkspace(name: string): Promise<CreateWorkspaceResponse> {
  return post("/api/workspaces", { name });
}

export function lookupClaims(projects: ClaimCandidate[]): Promise<ClaimLookupResponse> {
  return post("/api/claim/lookup", { projects });
}

export function claimProjects(
  workspaceId: string,
  projects: ClaimCandidate[],
): Promise<ClaimResponse> {
  return post("/api/claim", { workspaceId, projects });
}
