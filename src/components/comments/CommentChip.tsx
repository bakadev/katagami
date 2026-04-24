import { MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";

interface CommentChipProps {
  count: number;
  onClick: () => void;
  active?: boolean;
}

export function CommentChip({ count, onClick, active }: CommentChipProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      aria-label={`${count} unresolved comments`}
      className="gap-1"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-xs tabular-nums">{count}</span>
    </Button>
  );
}
