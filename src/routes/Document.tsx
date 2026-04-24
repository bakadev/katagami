import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import type { Editor } from "@tiptap/core";
import { toast } from "sonner";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import { updateDocumentTitle } from "~/lib/api/documents";
import { createSnapshot, restoreSnapshot } from "~/lib/api/snapshots";
import { createEditor } from "~/lib/editor/editor";
import { renderMarkdown } from "~/lib/preview/render";
import { getOrCreateIdentity, storeIdentity } from "~/lib/user/identity";
import { useHighlightTheme } from "~/lib/preview/theme";
import { downloadAsMarkdown } from "~/lib/export/markdown-download";
import { Toolbar } from "~/components/editor/Toolbar";
import { FloatingCommentButton } from "~/components/editor/FloatingCommentButton";
import { CommentComposer } from "~/components/editor/CommentComposer";
import { DocHeader } from "~/components/header/DocHeader";
import { AvatarButton } from "~/components/header/AvatarButton";
import { AvatarDropdown } from "~/components/avatar-menu/AvatarDropdown";
import { RenameModal } from "~/components/avatar-menu/RenameModal";
import { RightPanel } from "~/components/panel/RightPanel";
import { DocsTab } from "~/components/panel/tabs/DocsTab";
import { CommentsTab } from "~/components/panel/tabs/CommentsTab";
import { AiTab } from "~/components/panel/tabs/AiTab";
import { HistoryTab } from "~/components/panel/tabs/HistoryTab";
import {
  registerSelectionAction,
  unregisterSelectionAction,
} from "~/lib/editor/selection-actions";
import {
  createThread,
  addReply,
  setResolved,
  deleteThreadRoot,
  deleteReply,
} from "~/lib/comments/threads";
import { useThreads } from "~/hooks/useThreads";
import { usePanelVisibility } from "~/hooks/usePanelVisibility";
import { useTheme } from "~/lib/theme/useTheme";
import type { Thread } from "~/lib/comments/types";
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

  const { theme, setTheme } = useTheme();
  const { open: panelOpen, togglePanel, activeTab, setActiveTab } = usePanelVisibility();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [markdown, setMarkdown] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [identity, setIdentity] = useState(() => getOrCreateIdentity());
  const [renameOpen, setRenameOpen] = useState(false);

  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);

  const threads = useThreads(editor, connectionRef.current?.ydoc ?? null);
  const unresolvedCount = useMemo(
    () => threads.filter((t) => !t.resolved).length,
    [threads],
  );
  const readOnly = permissionLevel === "view";

  // --- Load permission + initial metadata ---
  useEffect(() => {
    if (!docId || !key) {
      setLoadError("Missing doc id or key");
      return;
    }
    let cancelled = false;
    getDocument(docId, key)
      .then((res) => {
        if (cancelled) return;
        setPermissionLevel(res.permissionLevel);
        setTitle(res.document.title);
        setUpdatedAt(res.document.updatedAt);
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

  // --- Open editor once permission is known ---
  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const host = editorHostRef.current;
    if (!host) return;

    const conn = connect(docId, key);
    connectionRef.current = conn;

    const tipTapEditor = createEditor({
      element: host,
      ydoc: conn.ydoc,
      provider: conn.provider,
      identity,
      editable: permissionLevel === "edit",
    });
    setEditor(tipTapEditor);

    const syncMarkdown = () => {
      setMarkdown(tipTapEditor.getText({ blockSeparator: "\n\n" }));
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
    // NOTE: `identity` is intentionally excluded from deps. Re-creating the
    // editor on every rename would lose cursor position and any unsaved local
    // edits. The awareness broadcast below picks up identity changes instead.
  }, [permissionLevel, docId, key]);

  // Broadcast identity changes to awareness so remote carets update.
  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn) return;
    conn.provider.awareness.setLocalStateField("user", {
      name: identity.name,
      color: identity.color,
    });
  }, [identity]);

  // --- Connection toasts (suppress initial, warning on disconnect, success on reconnect) ---
  const hasConnectedOnceRef = useRef(false);
  const disconnectToastIdRef = useRef<string | number | null>(null);
  useEffect(() => {
    if (status === "connected") {
      if (disconnectToastIdRef.current !== null) {
        toast.dismiss(disconnectToastIdRef.current);
        toast.success("Reconnected", { duration: 2000 });
        disconnectToastIdRef.current = null;
      }
      hasConnectedOnceRef.current = true;
    } else if (status === "disconnected" && hasConnectedOnceRef.current) {
      disconnectToastIdRef.current = toast.warning("Lost connection — retrying…", {
        duration: Infinity,
      });
    }
  }, [status]);

  // --- Remote-comment toasts (skip initial hydration, skip your own actions) ---
  const remoteHydratedRef = useRef(false);
  const seenThreadIdsRef = useRef<Set<string>>(new Set());
  const seenReplyIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const myName = identity.name;
    const currentThreadIds = new Set(threads.map((t) => t.id));
    const currentReplyIds = new Set(
      threads.flatMap((t) => t.replies.map((r) => r.id)),
    );

    if (remoteHydratedRef.current) {
      for (const thread of threads) {
        if (
          !seenThreadIdsRef.current.has(thread.id) &&
          thread.authorName !== myName
        ) {
          toast.info(`${thread.authorName} commented`, {
            duration: 4000,
            action: {
              label: "View",
              onClick: () => {
                setActiveTab("comments");
                handleScrollToAnchorRef.current?.(thread.id);
              },
            },
          });
        }
        for (const reply of thread.replies) {
          if (
            !seenReplyIdsRef.current.has(reply.id) &&
            reply.authorName !== myName
          ) {
            toast.info(`${reply.authorName} replied`, {
              duration: 4000,
              action: {
                label: "View",
                onClick: () => {
                  setActiveTab("comments");
                  handleScrollToAnchorRef.current?.(thread.id);
                },
              },
            });
          }
        }
      }
    }

    seenThreadIdsRef.current = currentThreadIds;
    seenReplyIdsRef.current = currentReplyIds;
    remoteHydratedRef.current = true;
  }, [threads, identity.name, setActiveTab]);

  // --- Selection-action registry ---
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

  // --- Post a new comment ---
  const handlePostComment = useCallback(
    (body: string) => {
      if (!editor || !connectionRef.current || !composer) return;
      const ydoc = connectionRef.current.ydoc;
      const threadId = createThread(ydoc, {
        authorName: identity.name,
        authorColor: identity.color,
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
      // Open the panel on the Comments tab so the new thread is visible.
      if (!panelOpen) togglePanel();
      if (activeTab !== "comments") setActiveTab("comments");
    },
    [editor, composer, identity, panelOpen, togglePanel, activeTab, setActiveTab],
  );

  // --- Anchor helpers for the Comments tab ---
  const handleScrollToAnchor = useCallback(
    (threadId: string) => {
      if (!editor) return;
      let foundFrom: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === "commentAnchor" && mark.attrs.threadId === threadId) {
            if (foundFrom === null) foundFrom = pos;
          }
        });
      });
      if (foundFrom === null) return;
      editor.commands.setTextSelection({ from: foundFrom, to: foundFrom });
      const el = editor.view.domAtPos(foundFrom).node as HTMLElement | null;
      if (el && "scrollIntoView" in el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const spans = editor.view.dom.querySelectorAll<HTMLElement>(
        `[data-comment-thread-id="${threadId}"]`,
      );
      spans.forEach((s) => {
        s.classList.add("comment-anchor-flash");
        setTimeout(() => s.classList.remove("comment-anchor-flash"), 900);
      });
    },
    [editor],
  );

  // Refs let the toast callbacks reach the latest scroll handler without
  // adding the handler to their dependency array (which would re-fire the
  // toast effect every time editor state changes).
  const handleScrollToAnchorRef = useRef(handleScrollToAnchor);
  useEffect(() => {
    handleScrollToAnchorRef.current = handleScrollToAnchor;
  }, [handleScrollToAnchor]);

  const resolveAnchor = useCallback(
    (thread: Thread): string => {
      if (!editor) return "";
      let found = "";
      editor.state.doc.descendants((node) => {
        node.marks.forEach((mark) => {
          if (mark.type.name === "commentAnchor" && mark.attrs.threadId === thread.id) {
            if (!found) {
              const text = node.text ?? "";
              found = text.slice(0, 80);
            }
          }
        });
      });
      return found;
    },
    [editor],
  );

  // --- Title save (optimistic with rollback on error) ---
  const handleSaveTitle = useCallback(
    async (next: string | null) => {
      if (!docId || !key) return;
      const prev = title;
      setTitle(next);
      try {
        const res = await updateDocumentTitle(docId, key, next);
        setUpdatedAt(res.updatedAt);
      } catch {
        setTitle(prev);
        toast.error("Couldn't save title");
      }
    },
    [docId, key, title],
  );

  // --- Snapshot handlers ---
  const handleSaveSnapshot = useCallback(
    async (name: string) => {
      if (!docId || !key) return;
      try {
        const snap = await createSnapshot(docId, key, name || undefined);
        toast.success(
          snap.name ? `Snapshot saved: ${snap.name}` : "Snapshot saved",
        );
      } catch {
        toast.error("Couldn't save snapshot");
      }
    },
    [docId, key],
  );

  const handleRestore = useCallback(
    async (snapId: string): Promise<{ preRestoreSnapshotId: string }> => {
      if (!docId || !key) throw new Error("missing doc or key");
      const res = await restoreSnapshot(docId, snapId, key);
      return res;
    },
    [docId, key],
  );

  // --- Avatar actions ---
  const handleDownload = useCallback(() => {
    if (!editor || !docId) return;
    downloadAsMarkdown(editor, title, docId);
  }, [editor, title, docId]);

  const handleRenameSave = useCallback((nextName: string) => {
    const next = { name: nextName, color: identity.color };
    storeIdentity(next);
    setIdentity(next);
    setRenameOpen(false);
  }, [identity.color]);

  // --- Render branches ---
  if (loadError) {
    return (
      <main className="p-4">
        <h1 className="text-lg font-semibold">Can&apos;t open this document</h1>
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

  const avatarSlot = (
    <AvatarDropdown
      identity={identity}
      theme={theme}
      onThemeChange={setTheme}
      onRenameClick={() => setRenameOpen(true)}
      onDownloadClick={handleDownload}
      trigger={
        <AvatarButton name={identity.name} color={identity.color} active={false} />
      }
    />
  );

  return (
    <main className="flex h-screen flex-col">
      <DocHeader
        title={title}
        onSaveTitle={handleSaveTitle}
        readOnly={readOnly}
        updatedAt={updatedAt}
        connection={status}
        permission={readOnly ? "view" : "edit"}
        mode={mode}
        onModeChange={setMode}
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
        onSaveSnapshot={handleSaveSnapshot}
        avatarSlot={avatarSlot}
      />

      {mode === "edit" && !readOnly && (
        <div className="border-b border-border px-4 py-1">
          <Toolbar editor={editor} disabled={readOnly} />
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div
            ref={editorHostRef}
            className={`prose max-w-none border border-border bg-muted/30 p-4 font-mono text-sm ${
              mode === "edit" ? "" : "hidden"
            }`}
          />
          {mode === "preview" && (
            <div
              className="prose max-w-none border border-border bg-background p-6 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          )}
        </div>

        <RightPanel
          open={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          commentCount={unresolvedCount}
          hasNewCommentActivity={false}
        >
          {activeTab === "documents" && <DocsTab />}
          {activeTab === "comments" && (
            <CommentsTab
              threads={threads}
              currentAuthorName={identity.name}
              readOnly={readOnly}
              resolveAnchor={resolveAnchor}
              onReply={(threadId, body) => {
                const ydoc = connectionRef.current?.ydoc;
                if (!ydoc) return;
                addReply(ydoc, threadId, {
                  authorName: identity.name,
                  authorColor: identity.color,
                  body,
                  createdAt: Date.now(),
                });
              }}
              onResolveToggle={(threadId, next) => {
                const ydoc = connectionRef.current?.ydoc;
                if (!ydoc) return;
                setResolved(ydoc, threadId, next);
              }}
              onDeleteThreadRoot={(threadId) => {
                const ydoc = connectionRef.current?.ydoc;
                if (!ydoc) return;
                deleteThreadRoot(ydoc, threadId);
              }}
              onDeleteReply={(threadId, replyId) => {
                const ydoc = connectionRef.current?.ydoc;
                if (!ydoc) return;
                deleteReply(ydoc, threadId, replyId);
              }}
              onClickAnchor={handleScrollToAnchor}
            />
          )}
          {activeTab === "ai" && <AiTab />}
          {activeTab === "history" && docId && key && (
            <HistoryTab
              docId={docId}
              keyToken={key}
              readOnly={readOnly}
              enabled={panelOpen && activeTab === "history"}
              onRestore={handleRestore}
            />
          )}
        </RightPanel>
      </div>

      <FloatingCommentButton editor={editor} disabled={readOnly} />

      {composer && (
        <div
          className="fixed z-50 w-80 rounded border border-border bg-background p-3 shadow-lg"
          style={{ top: 120, right: 40 }}
          data-testid="inline-comment-composer"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Commenting on:{" "}
            <span className="italic">&ldquo;{composer.selectedText.slice(0, 60)}&rdquo;</span>
          </p>
          <CommentComposer
            onSubmit={handlePostComment}
            onCancel={() => setComposer(null)}
          />
        </div>
      )}

      <RenameModal
        open={renameOpen}
        initialName={identity.name}
        onSave={handleRenameSave}
        onCancel={() => setRenameOpen(false)}
      />
    </main>
  );
}
