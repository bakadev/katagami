import type { ReactElement } from "react";
import { SnapshotCard } from "./SnapshotCard";
import type { SnapshotRecord } from "../../../shared/types";

interface SnapshotListProps {
  snapshots: SnapshotRecord[];
  readOnly: boolean;
  onRestore: (snapId: string) => void | Promise<void>;
  onRename: (snapId: string, nextName: string) => void | Promise<void>;
  onDelete: (snapId: string) => void | Promise<void>;
  onSaveAsNamed: (snapId: string, nextName: string) => void | Promise<void>;
}

/**
 * SnapshotList — flat, separator-divided list of SnapshotCards.
 *
 * Ordering is left to the caller (the GET endpoint returns newest-first,
 * which is the natural sort for a version history). We don't bucket
 * "Named" vs "Auto" into sections because the per-card iconography
 * (amber Star vs muted History) already carries that distinction, and
 * the chronological order is the most important information — a named
 * v2 created after an auto-snapshot should appear above it, not
 * teleported into a "Named" ghetto.
 *
 * Separators between cards via `divide-y divide-border` so the card
 * wrapper itself doesn't need a border — avoids doubled lines between
 * adjacent cards that both want their own frame. `<ul>` is used
 * semantically: each snapshot is a list-item within the history region
 * defined by the parent HistoryTab.
 */
export function SnapshotList({
  snapshots,
  readOnly,
  onRestore,
  onRename,
  onDelete,
  onSaveAsNamed,
}: SnapshotListProps): ReactElement {
  return (
    <ul
      className="flex flex-col divide-y divide-border"
      data-testid="snapshot-list"
    >
      {snapshots.map((snap) => (
        <li key={snap.id} className="list-none">
          <SnapshotCard
            snapshot={snap}
            readOnly={readOnly}
            onRestore={() => onRestore(snap.id)}
            onRename={(next) => onRename(snap.id, next)}
            onDelete={() => onDelete(snap.id)}
            onSaveAsNamed={(next) => onSaveAsNamed(snap.id, next)}
          />
        </li>
      ))}
    </ul>
  );
}
