import { useCallback, useEffect, useRef, useState } from "react";
import { listSnapshots } from "~/lib/api/snapshots";
import type { SnapshotRecord } from "../../shared/types";

const POLL_MS = 30_000;

export function useSnapshots(docId: string | undefined, key: string | null, enabled: boolean) {
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!docId || !key) return;
    setLoading(true);
    try {
      const res = await listSnapshots(docId, key);
      if (!cancelledRef.current) {
        setSnapshots(res.snapshots);
        setError(null);
      }
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [docId, key]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) return;
    void refresh();
    const id = setInterval(() => { void refresh(); }, POLL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [enabled, refresh]);

  return { snapshots, loading, error, refresh };
}
