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
