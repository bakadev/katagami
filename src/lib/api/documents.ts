interface UpdateTitleResponse {
  id: string;
  title: string | null;
  updatedAt: string;
}

export async function updateDocumentTitle(
  docId: string,
  key: string,
  title: string | null,
): Promise<UpdateTitleResponse> {
  const res = await fetch(
    `/api/docs/${encodeURIComponent(docId)}?key=${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`updateDocumentTitle failed: ${res.status}: ${body}`);
  }
  return (await res.json()) as UpdateTitleResponse;
}
