export type PermissionLevel = "edit" | "view";

export interface PermissionTokens {
  editToken: string;
  viewToken: string;
}

export interface CreateProjectResponse {
  project: {
    id: string;
    name: string | null;
  };
  document: {
    id: string;
  };
  permissions: PermissionTokens;
  creatorToken: string;
}

export interface DocumentMetadataResponse {
  document: {
    id: string;
    projectId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  };
  permissionLevel: PermissionLevel;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface SnapshotRecord {
  id: string;
  name: string | null;       // null = auto-snapshot
  takenAt: string;           // ISO
  takenByName: string | null;
  preview: string;           // up to 120 chars of plaintext
}

export interface ListSnapshotsResponse {
  snapshots: SnapshotRecord[];
}

export interface CreateSnapshotRequest {
  name?: string;
}

export interface RenameSnapshotRequest {
  name: string;
}

export interface UpdateDocumentRequest {
  title?: string | null;
}

/* ---- accounts --------------------------------------------------------------- */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "editor";
}

export interface MeResponse {
  user: SessionUser;
  workspaces: WorkspaceSummary[];
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface CreateWorkspaceResponse {
  workspace: WorkspaceSummary;
}

export interface ClaimCandidate {
  projectId: string;
  token: string;
}

export interface ClaimLookupRequest {
  projects: ClaimCandidate[];
}

export interface ClaimLookupResponse {
  projects: {
    id: string;
    title: string | null;
    documentCount: number;
    updatedAt: string;
  }[];
}

export interface ClaimRequest {
  workspaceId: string;
  projects: ClaimCandidate[];
}

export interface ClaimResponse {
  moved: string[];
}
