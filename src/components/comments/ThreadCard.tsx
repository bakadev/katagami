import { useState } from "react";
import { Check, Trash2, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CommentComposer } from "~/components/editor/CommentComposer";
import type { Thread } from "~/lib/comments/types";

interface ThreadCardProps {
  thread: Thread;
  currentAuthorName: string;
  readOnly: boolean;
  anchorText: string;
  onReply: (body: string) => void;
  onResolveToggle: () => void;
  onDeleteThreadRoot: () => void;
  onDeleteReply: (replyId: string) => void;
  onClickAnchor: () => void;
}

function formatRelative(createdAt: number): string {
  const diffMs = Date.now() - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString();
}

export function ThreadCard({
  thread,
  currentAuthorName,
  readOnly,
  anchorText,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: ThreadCardProps) {
  const [replying, setReplying] = useState(false);

  return (
    <div
      className="rounded border border-border bg-background p-3 text-sm"
      data-testid={`thread-${thread.id}`}
      data-resolved={thread.resolved ? "true" : "false"}
    >
      <button
        type="button"
        onClick={onClickAnchor}
        className="mb-2 block w-full truncate border-l-2 border-primary/40 pl-2 text-left text-xs italic text-muted-foreground hover:text-foreground"
      >
        "{anchorText || "(deleted anchor)"}"
      </button>

      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: thread.authorColor }}
          >
            {thread.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(thread.createdAt)}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onResolveToggle}
              aria-label={thread.resolved ? "Unresolve" : "Resolve"}
              title={thread.resolved ? "Unresolve" : "Resolve"}
            >
              {thread.resolved ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            {thread.authorName === currentAuthorName && !thread.rootDeleted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteThreadRoot}
                aria-label="Delete comment"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="whitespace-pre-wrap">
        {thread.rootDeleted ? (
          <span className="italic text-muted-foreground">[deleted]</span>
        ) : (
          thread.body
        )}
      </p>

      {thread.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-border pl-3">
          {thread.replies.map((reply) => (
            <div key={reply.id} className="text-xs" data-testid={`reply-${reply.id}`}>
              <div className="mb-0.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: reply.authorColor }}
                  >
                    {reply.authorName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelative(reply.createdAt)}
                  </span>
                </div>
                {!readOnly && reply.authorName === currentAuthorName && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReply(reply.id)}
                    aria-label="Delete reply"
                    title="Delete reply"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-3">
          {replying ? (
            <CommentComposer
              placeholder="Write a reply…"
              submitLabel="Reply"
              onCancel={() => setReplying(false)}
              onSubmit={(body) => {
                onReply(body);
                setReplying(false);
              }}
            />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setReplying(true)}>
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
