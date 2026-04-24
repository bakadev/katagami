import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import type { Editor } from "@tiptap/core";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import { createEditor } from "~/lib/editor/editor";
import { renderMarkdown } from "~/lib/preview/render";
import { getOrCreateIdentity } from "~/lib/user/identity";
import { ThemeToggle } from "~/lib/theme/ThemeToggle";
import { useHighlightTheme } from "~/lib/preview/theme";
import type { PermissionLevel } from "@shared/types";

export default function DocumentRoute() {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  const navigate = useNavigate();
  useHighlightTheme();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [markdown, setMarkdown] = useState("");

  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);

  useEffect(() => {
    if (!docId || !key) {
      setLoadError("Missing doc id or key");
      return;
    }
    let cancelled = false;
    getDocument(docId, key)
      .then((res) => {
        if (!cancelled) setPermissionLevel(res.permissionLevel);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [docId, key]);

  useEffect(() => {
    if (!loadError) return;
    const t = setTimeout(() => navigate("/", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [loadError, navigate]);

  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const host = editorHostRef.current;
    if (!host) return;

    const conn = connect(docId, key);
    connectionRef.current = conn;

    const identity = getOrCreateIdentity();
    const editor = createEditor({
      element: host,
      ydoc: conn.ydoc,
      provider: conn.provider,
      identity,
      editable: permissionLevel === "edit",
    });
    editorRef.current = editor;

    const syncMarkdown = () => {
      // tiptap-markdown's storage exposes getMarkdown() on any editor update.
      const md = (editor.storage as unknown as Record<string, { getMarkdown?: () => string }>).markdown?.getMarkdown?.() ?? "";
      setMarkdown(md);
    };
    syncMarkdown();
    editor.on("update", syncMarkdown);
    editor.on("transaction", syncMarkdown);

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      conn.provider.off("status", handleStatus);
      editor.off("update", syncMarkdown);
      editor.off("transaction", syncMarkdown);
      editor.destroy();
      conn.destroy();
      editorRef.current = null;
      connectionRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  if (loadError) {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold">Can't open this document</h1>
        <p>{loadError}</p>
        <p className="text-xs text-muted-foreground">Redirecting to home…</p>
      </main>
    );
  }

  if (!permissionLevel) {
    return (
      <main className="p-4">
        <p>Loading document…</p>
      </main>
    );
  }

  const readOnly = permissionLevel === "view";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-lg font-semibold">Document</h1>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {status} · {readOnly ? "view only" : "editing"}
          </span>
          <div role="tablist" aria-label="View mode" className="flex rounded border border-border">
            <button
              role="tab"
              aria-selected={mode === "edit"}
              className={`px-3 py-1 text-sm transition-colors ${mode === "edit" ? "bg-foreground text-background font-medium" : "hover:bg-muted"}`}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              role="tab"
              aria-selected={mode === "preview"}
              className={`px-3 py-1 text-sm transition-colors ${mode === "preview" ? "bg-foreground text-background font-medium" : "hover:bg-muted"}`}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div
        ref={editorHostRef}
        className={`prose max-w-none rounded border-2 border-border bg-muted/30 p-4 font-mono text-sm ${
          mode === "edit" ? "" : "hidden"
        }`}
      />

      {mode === "preview" && (
        <div
          className="prose max-w-none rounded border border-border bg-background p-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
        />
      )}
    </main>
  );
}
