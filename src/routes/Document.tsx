import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import type { Editor } from "@tiptap/core";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import { createEditor } from "~/lib/editor/editor";
import { renderMarkdown } from "~/lib/preview/render";
import { getOrCreateIdentity } from "~/lib/user/identity";
import { useHighlightTheme } from "~/lib/preview/theme";
import { Toolbar } from "~/components/editor/Toolbar";
import { FloatingCommentButton } from "~/components/editor/FloatingCommentButton";
import { CommentComposer } from "~/components/editor/CommentComposer";
import {
  registerSelectionAction,
  unregisterSelectionAction,
} from "~/lib/editor/selection-actions";
// Task 17 will re-introduce addReply, setResolved, deleteThreadRoot, deleteReply
// as they get wired into the new CommentsTab through the RightPanel.
import { createThread } from "~/lib/comments/threads";
import { useThreads } from "~/hooks/useThreads";
import type { PermissionLevel } from "@shared/types";

interface ComposerState {
  from: number;
  to: number;
  selectedText: string;
}

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
  const [editor, setEditor] = useState<Editor | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);

  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);
  const identityRef = useRef(getOrCreateIdentity());

  const threads = useThreads(editor, connectionRef.current?.ydoc ?? null);
  const unresolvedCount = threads.filter((t) => !t.resolved).length;
  const readOnly = permissionLevel === "view";

  // Load permission
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

  // Open editor once permission is known
  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const host = editorHostRef.current;
    if (!host) return;

    const conn = connect(docId, key);
    connectionRef.current = conn;

    const identity = identityRef.current;
    const tipTapEditor = createEditor({
      element: host,
      ydoc: conn.ydoc,
      provider: conn.provider,
      identity,
      editable: permissionLevel === "edit",
    });
    setEditor(tipTapEditor);

    const syncMarkdown = () => {
      const md = tipTapEditor.getText({ blockSeparator: "\n\n" });
      setMarkdown(md);
    };
    syncMarkdown();
    tipTapEditor.on("update", syncMarkdown);
    tipTapEditor.on("transaction", syncMarkdown);

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      conn.provider.off("status", handleStatus);
      tipTapEditor.off("update", syncMarkdown);
      tipTapEditor.off("transaction", syncMarkdown);
      tipTapEditor.destroy();
      conn.destroy();
      setEditor(null);
      connectionRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  // Register the Comment selection action
  useEffect(() => {
    if (!editor || readOnly) return;
    registerSelectionAction({
      id: "comment",
      label: "Comment",
      onInvoke: ({ from, to, selectedText }) => {
        setComposer({ from, to, selectedText });
      },
    });
    return () => unregisterSelectionAction("comment");
  }, [editor, readOnly]);

  // Post a new comment
  const handlePostComment = useCallback(
    (body: string) => {
      if (!editor || !connectionRef.current || !composer) return;
      const ydoc = connectionRef.current.ydoc;
      const threadId = createThread(ydoc, {
        authorName: identityRef.current.name,
        authorColor: identityRef.current.color,
        body,
        createdAt: Date.now(),
      });
      editor
        .chain()
        .focus()
        .setTextSelection({ from: composer.from, to: composer.to })
        .setCommentAnchor(threadId)
        .run();
      setComposer(null);
      // Task 17: open the RightPanel + focus the Comments tab here.
    },
    [editor, composer],
  );

  // Task 17: handleScrollToAnchor and resolveAnchor re-enter here once
  // the new CommentsTab wiring lands.

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

  return (
    <main className="mx-auto flex h-screen max-w-[1400px] flex-col px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="m-0 text-lg font-semibold">Document</h1>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {status} · {readOnly ? "view only" : "editing"}
          </span>
          <div role="tablist" aria-label="View mode" className="flex rounded border border-border">
            <button
              role="tab"
              aria-selected={mode === "edit"}
              className={`px-3 py-1 text-sm transition-colors ${
                mode === "edit"
                  ? "bg-foreground text-background font-medium"
                  : "hover:bg-muted"
              }`}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              role="tab"
              aria-selected={mode === "preview"}
              className={`px-3 py-1 text-sm transition-colors ${
                mode === "preview"
                  ? "bg-foreground text-background font-medium"
                  : "hover:bg-muted"
              }`}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
          {/* Task 17: avatar dropdown + panel toggle wire into this slot */}
          <span className="text-xs text-muted-foreground">{unresolvedCount} unresolved</span>
        </div>
      </header>

      {mode === "edit" && <Toolbar editor={editor} disabled={readOnly} />}

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div
            ref={editorHostRef}
            className={`prose max-w-none border-2 ${mode === "edit" ? "rounded-b" : "rounded"} border-border bg-muted/30 p-4 font-mono text-sm ${
              mode === "edit" ? "" : "hidden"
            }`}
          />
          {mode === "preview" && (
            <div
              className="prose max-w-none rounded border border-border bg-background p-6 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          )}
        </div>

        {/* Task 17: RightPanel with CommentsTab (et al.) mounts here. */}
      </div>

      <FloatingCommentButton editor={editor} disabled={readOnly} />

      {composer && (
        <div
          className="fixed z-50 w-80 rounded border border-border bg-background p-3 shadow-lg"
          style={{ top: 120, right: 40 }}
          data-testid="inline-comment-composer"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Commenting on: <span className="italic">"{composer.selectedText.slice(0, 60)}"</span>
          </p>
          <CommentComposer
            onSubmit={handlePostComment}
            onCancel={() => setComposer(null)}
          />
        </div>
      )}
    </main>
  );
}
