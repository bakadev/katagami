import type { SnapshotRecord } from "../../../shared/types";

async function jsonFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${url} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listSnapshots(docId: string, key: string): Promise<{ snapshots: SnapshotRecord[] }> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots?key=${encodeURIComponent(key)}`,
    { method: "GET" },
  );
}

export function createSnapshot(docId: string, key: string, name?: string): Promise<SnapshotRecord> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots?key=${encodeURIComponent(key)}`,
    { method: "POST", body: JSON.stringify(name ? { name } : {}) },
  );
}

export function restoreSnapshot(
  docId: string,
  snapId: string,
  key: string,
): Promise<{ restoredSnapshotId: string; preRestoreSnapshotId: string }> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}/restore?key=${encodeURIComponent(key)}`,
    { method: "POST" },
  );
}

export function renameSnapshot(
  docId: string,
  snapId: string,
  key: string,
  name: string,
): Promise<SnapshotRecord> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}?key=${encodeURIComponent(key)}`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
}

export function deleteSnapshot(docId: string, snapId: string, key: string): Promise<void> {
  return jsonFetch(
    `/api/docs/${encodeURIComponent(docId)}/snapshots/${encodeURIComponent(snapId)}?key=${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
}
