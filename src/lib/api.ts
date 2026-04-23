import type {
  CreateProjectResponse,
  DocumentMetadataResponse,
} from "../../shared/types";

export async function createProject(): Promise<CreateProjectResponse> {
  const res = await fetch("/api/projects", { method: "POST" });
  if (!res.ok) throw new Error(`createProject failed: ${res.status}`);
  return (await res.json()) as CreateProjectResponse;
}

export async function getDocument(
  docId: string,
  key: string,
): Promise<DocumentMetadataResponse> {
  const res = await fetch(`/api/docs/${docId}?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`getDocument failed: ${res.status}`);
  return (await res.json()) as DocumentMetadataResponse;
}
