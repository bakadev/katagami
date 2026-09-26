/**
 * Round 7 — signed-in home. Fake data shared by the three options.
 *
 * One team ("Acme", called a workspace in options A to C), two multi-document projects and four single-doc
 * projects, four people, edits from 12 minutes to 3 weeks ago. Everything is
 * relative to "now" so the relative times stay believable.
 */

export interface Person {
  id: string;
  name: string;
  /** Small colour dot beside the name. */
  color: string;
}

export interface Project {
  id: string;
  name: string;
}

export type DocStatus = "draft" | "review" | "signed";

export interface Doc {
  id: string;
  title: string;
  projectId: string;
  /** Minutes before now. */
  editedMinutesAgo: number;
  editedBy: Person["id"];
  status: DocStatus;
  /** Open comments or suggestions addressed to the signed-in person (option C). */
  waiting?: { comments: number; suggestions: number };
  /** Minutes before now the signed-in person last opened it (option C). */
  openedMinutesAgo?: number;
}

export const ME: Person = { id: "priya", name: "Priya Raman", color: "#274b8f" };

export const PEOPLE: Person[] = [
  ME,
  { id: "marcus", name: "Marcus Chen", color: "#b4552a" },
  { id: "sofia", name: "Sofia Almeida", color: "#2f7d5a" },
  { id: "tom", name: "Tom Okafor", color: "#8b5a9e" },
];

export const WORKSPACES = [
  { id: "acme", name: "Acme" },
  { id: "personal", name: "Personal" },
];

export const PROJECTS: Project[] = [
  { id: "checkout", name: "Checkout redesign" },
  { id: "onboarding", name: "Onboarding emails" },
  { id: "pricing", name: "Pricing page copy" },
  { id: "search", name: "Search relevance" },
  { id: "retention", name: "Retention study" },
  { id: "brand", name: "Brand voice" },
];

const H = 60;
const D = 24 * H;

export const DOCS: Doc[] = [
  {
    id: "d1",
    title: "Checkout redesign · PRD",
    projectId: "checkout",
    editedMinutesAgo: 12,
    editedBy: "marcus",
    status: "review",
    waiting: { comments: 4, suggestions: 2 },
    openedMinutesAgo: 25,
  },
  {
    id: "d2",
    title: "Payment step, error states",
    projectId: "checkout",
    editedMinutesAgo: 3 * H,
    editedBy: "sofia",
    status: "draft",
    waiting: { comments: 1, suggestions: 3 },
    openedMinutesAgo: 2 * H,
  },
  {
    id: "d3",
    title: "Address form, research readout",
    projectId: "checkout",
    editedMinutesAgo: 2 * D,
    editedBy: "priya",
    status: "signed",
    openedMinutesAgo: 2 * D,
  },
  {
    id: "d4",
    title: "Welcome sequence, v3",
    projectId: "onboarding",
    editedMinutesAgo: 50,
    editedBy: "tom",
    status: "review",
    waiting: { comments: 2, suggestions: 0 },
    openedMinutesAgo: 5 * H,
  },
  {
    id: "d5",
    title: "Trial-ending nudge",
    projectId: "onboarding",
    editedMinutesAgo: 4 * D,
    editedBy: "tom",
    status: "draft",
    openedMinutesAgo: 6 * D,
  },
  {
    id: "d6",
    title: "Pricing page copy, draft 2",
    projectId: "pricing",
    editedMinutesAgo: 26 * H,
    editedBy: "priya",
    status: "draft",
    openedMinutesAgo: 26 * H,
  },
  {
    id: "d7",
    title: "Search relevance principles",
    projectId: "search",
    editedMinutesAgo: 6 * D,
    editedBy: "marcus",
    status: "review",
    waiting: { comments: 0, suggestions: 5 },
    openedMinutesAgo: 8 * D,
  },
  {
    id: "d8",
    title: "Retention study, discussion guide",
    projectId: "retention",
    editedMinutesAgo: 9 * D,
    editedBy: "sofia",
    status: "signed",
    openedMinutesAgo: 12 * D,
  },
  {
    id: "d9",
    title: "Brand voice, principles and examples",
    projectId: "brand",
    editedMinutesAgo: 21 * D,
    editedBy: "priya",
    status: "signed",
    openedMinutesAgo: 20 * D,
  },
];

/** Option A: a Free user with a handful of specs, no projects worth grouping. */
export const SOLO_DOCS: Doc[] = [
  { ...DOCS[0]!, title: "Checkout redesign · PRD", projectId: "checkout", editedBy: "priya" },
  { ...DOCS[5]! },
  { ...DOCS[6]!, editedBy: "priya" },
  { ...DOCS[7]!, editedBy: "priya" },
  { ...DOCS[8]! },
];

export const UNCLAIMED_COUNT = 3;

export const STATUS_LABEL: Record<DocStatus, string> = {
  draft: "Draft",
  review: "In review",
  signed: "Signed off",
};

export function personById(id: string): Person {
  return PEOPLE.find((p) => p.id === id) ?? ME;
}

export function projectById(id: string): Project {
  return PROJECTS.find((p) => p.id === id) ?? { id, name: id };
}

/** "12 minutes ago", "3 hours ago", "yesterday", "6 days ago", "3 weeks ago". */
export function relative(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export type SortKey = "edited" | "title";

export function sortDocs(docs: Doc[], by: SortKey): Doc[] {
  const out = [...docs];
  if (by === "title") out.sort((a, b) => a.title.localeCompare(b.title));
  else out.sort((a, b) => a.editedMinutesAgo - b.editedMinutesAgo);
  return out;
}

export function filterDocs(docs: Doc[], q: string): Doc[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return docs;
  return docs.filter((d) => d.title.toLowerCase().includes(needle));
}

/* ---- Option D (composite) --------------------------------------------- */

/**
 * D calls the container a "team", never a workspace, and has no switcher.
 * Only projects the person made explicitly exist: "Checkout redesign" and
 * "Onboarding emails". Every other document sits in the Documents bucket,
 * marked with `NO_PROJECT`.
 */
export const NO_PROJECT = "";

export const D_PROJECTS: Project[] = PROJECTS.slice(0, 2);

const D_PROJECT_IDS = new Set(D_PROJECTS.map((p) => p.id));

export const D_DOCS: Doc[] = DOCS.map((d) =>
  D_PROJECT_IDS.has(d.projectId) ? d : { ...d, projectId: NO_PROJECT },
);

/** Free has no projects: the server keeps every document in one hidden default project. */
export const D_FREE_DOCS: Doc[] = DOCS.map((d) => ({ ...d, projectId: NO_PROJECT }));

/** Freshest document in a list, or undefined. */
export function latestDoc(docs: Doc[]): Doc | undefined {
  return docs.reduce<Doc | undefined>(
    (best, d) => (!best || d.editedMinutesAgo < best.editedMinutesAgo ? d : best),
    undefined,
  );
}

export const D_HOME = "/design/documents/documents-d";
export const D_PROJECT_PAGE = "/design/documents/documents-d-project";
