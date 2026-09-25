import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { createProject } from "~/lib/api";
import { storeCreatorToken } from "~/lib/creator-token";

/**
 * Round 5 — editor header tone. There is no mock: each option opens a real
 * document with the header drawn in that tone (`?chrome=<tone>`), and a
 * strip on the document lets you flip between tones on the same doc.
 */
const TONES: Record<string, string> = {
  a: "indigo-pattern",
  b: "indigo",
  c: "rail",
};

export default function EditorHeaderExploration() {
  const { variant = "a" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const body = await createProject();
        storeCreatorToken(body.project.id, body.creatorToken);
        const tone = TONES[variant] ?? "indigo-pattern";
        navigate(
          `/p/${body.project.id}/d/${body.document.id}?key=${body.permissions.editToken}&chrome=${tone}`,
          { replace: true },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    })();
  }, [variant, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8 text-sm text-muted-foreground">
      {error ? `Couldn't open a document: ${error}` : "Opening a document…"}
    </main>
  );
}
