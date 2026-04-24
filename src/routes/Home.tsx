import { useState } from "react";
import { useNavigate } from "react-router";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const body = await createProject();
      storeCreatorToken(body.project.id, body.creatorToken);
      setLoading(false);
      navigate(
        `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="m-0 text-2xl font-semibold">Katagami</h1>
      </header>
      <p className="mb-6 text-muted-foreground">
        Collaborative Markdown editor for spec teams.
      </p>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating…" : "Create new doc"}
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
