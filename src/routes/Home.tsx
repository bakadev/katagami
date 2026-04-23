import { useState } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { method: "POST" });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const body = await res.json();
      // Persist creator token (done properly in Task 12)
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 16px" }}>
      <h1>Katagami</h1>
      <p>Collaborative Markdown editor for spec teams.</p>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating…" : "Create new doc"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
