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
  /** Caret and comment colour, when the person has picked one. */
  color: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "editor";
}

export interface MeResponse {
  user: SessionUser;
  teams: TeamSummary[];
  /** Admin override, else "team" when the person belongs to at least one team. */
  plan: "free" | "team";
  isAdmin: boolean;
}

export interface UpdateMeRequest {
  name?: string;
  color?: string;
}

/* ---- admin ---------------------------------------------------------------------- */

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  plan: "free" | "team";
  planOverride: "free" | "team" | null;
  teams: { id: string; name: string; role: string }[];
  documentCount: number;
}

export interface AdminTeamRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: { id: string; name: string; email: string; role: string }[];
  projectCount: number;
  documentCount: number;
}

export interface AdminOverviewResponse {
  users: AdminUserRow[];
  teams: AdminTeamRow[];
  totals: {
    users: number;
    teams: number;
    /** Projects people made: not hidden default buckets, not anonymous ones. */
    projects: number;
    documents: number;
    /** Documents in projects nobody has claimed (made without signing in). */
    anonymousDocuments: number;
  };
}

export interface AdminSetPlanRequest {
  planOverride: "free" | "team" | null;
}

export interface CreateTeamRequest {
  name: string;
}

export interface CreateTeamResponse {
  team: TeamSummary;
}

export interface RenameTeamRequest {
  name: string;
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
  /** Team to move the projects into. Absent on Free: the documents land in
   *  the person's default project instead. */
  teamId?: string;
  projects: ClaimCandidate[];
}

export interface ClaimResponse {
  moved: string[];
}

/* ---- signed-in home ----------------------------------------------------------- */

export interface EditorRef {
  name: string;
  color: string;
}

export interface DocumentRow {
  id: string;
  projectId: string;
  title: string | null;
  updatedAt: string;
  lastEditedBy: EditorRef | null;
  openComments: number;
  openSuggestions: number;
  /** Lets the owner open the editor straight from the list. */
  editToken: string;
}

export interface ProjectCard {
  id: string;
  name: string | null;
  documentCount: number;
  /** Latest document update, or the project's own timestamp when empty. */
  updatedAt: string;
  lastEditedBy: EditorRef | null;
  /** Distinct recent editors, newest first, at most five. */
  editors: EditorRef[];
}

export interface HomeResponse {
  plan: "free" | "team";
  team: TeamSummary | null;
  projects: ProjectCard[];
  /** Documents in the person's default project ("not in a project"). */
  documents: DocumentRow[];
}

export interface ProjectPageResponse {
  project: ProjectCard;
  documents: DocumentRow[];
}

export interface CreateDocumentRequest {
  projectId?: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface MoveDocumentRequest {
  /** null moves the document back to the default project. */
  projectId: string | null;
}
