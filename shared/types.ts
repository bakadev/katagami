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
