import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThreadCard } from "./ThreadCard";
import type { Thread } from "~/lib/comments/types";

interface CommentSidebarProps {
  threads: Thread[];
  currentAuthorName: string;
  readOnly: boolean;
  onClose: () => void;
  resolveAnchor: (thread: Thread) => string;
  onReply: (threadId: string, body: string) => void;
  onResolveToggle: (threadId: string, next: boolean) => void;
  onDeleteThreadRoot: (threadId: string) => void;
  onDeleteReply: (threadId: string, replyId: string) => void;
  onClickAnchor: (threadId: string) => void;
}

export function CommentSidebar({
  threads,
  currentAuthorName,
  readOnly,
  onClose,
  resolveAnchor,
  onReply,
  onResolveToggle,
  onDeleteThreadRoot,
  onDeleteReply,
  onClickAnchor,
}: CommentSidebarProps) {
  const [showResolved, setShowResolved] = useState(false);

  const visible = threads.filter((t) => (showResolved ? true : !t.resolved));
  const resolvedCount = threads.filter((t) => t.resolved).length;

  return (
    <aside
      data-testid="comment-sidebar"
      className="flex w-80 flex-col gap-3 border-l border-border bg-muted/20 p-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-sm font-semibold">Comments ({threads.length})</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {resolvedCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            data-testid="show-resolved"
          />
          Show resolved ({resolvedCount})
        </label>
      )}

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {threads.length === 0
            ? "No comments yet. Select text and click Comment."
            : "No unresolved comments. Toggle “Show resolved” to see them."}
        </p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto">
          {visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentAuthorName={currentAuthorName}
              readOnly={readOnly}
              anchorText={resolveAnchor(thread)}
              onReply={(body) => onReply(thread.id, body)}
              onResolveToggle={() => onResolveToggle(thread.id, !thread.resolved)}
              onDeleteThreadRoot={() => onDeleteThreadRoot(thread.id)}
              onDeleteReply={(replyId) => onDeleteReply(thread.id, replyId)}
              onClickAnchor={() => onClickAnchor(thread.id)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
