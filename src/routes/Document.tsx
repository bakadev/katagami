import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Navigate } from "react-router";
import * as Y from "yjs";
import { connect } from "~/lib/yjs-client";
import { getDocument } from "~/lib/api";
import type { PermissionLevel } from "@shared/types";

export default function DocumentRoute() {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  const [text, setText] = useState("");

  const connectionRef = useRef<ReturnType<typeof connect> | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const applyingRemote = useRef(false);

  // Validate permission via REST before opening WebSocket
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

  // Open Yjs connection once we know permission is valid
  useEffect(() => {
    if (!permissionLevel || !docId || !key) return;
    const conn = connect(docId, key);
    connectionRef.current = conn;

    const yText = conn.ydoc.getText("content");
    yTextRef.current = yText;

    const updateText = () => {
      applyingRemote.current = true;
      setText(yText.toString());
      applyingRemote.current = false;
    };
    updateText();
    yText.observe(updateText);

    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      setStatus(status);
    };
    conn.provider.on("status", handleStatus);

    return () => {
      yText.unobserve(updateText);
      conn.provider.off("status", handleStatus);
      conn.destroy();
      connectionRef.current = null;
      yTextRef.current = null;
    };
  }, [permissionLevel, docId, key]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (applyingRemote.current) return;
    const yText = yTextRef.current;
    if (!yText) return;
    const next = e.target.value;
    const current = yText.toString();
    // Minimal diff via full replace — fine for MVP textarea, TipTap will do proper deltas.
    yText.doc!.transact(() => {
      yText.delete(0, current.length);
      yText.insert(0, next);
    });
  }

  if (loadError) {
    return (
      <main style={{ padding: 16 }}>
        <h1>Can't open this document</h1>
        <p>{loadError}</p>
        <Navigate to="/" replace />
      </main>
    );
  }

  if (!permissionLevel) {
    return (
      <main style={{ padding: 16 }}>
        <p>Loading document…</p>
      </main>
    );
  }

  const readOnly = permissionLevel === "view";

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Document</h1>
        <span style={{ fontSize: 12, color: "#666" }}>
          {status} · {readOnly ? "view only" : "editing"}
        </span>
      </header>
      <textarea
        value={text}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={readOnly ? "" : "Start typing…"}
      />
    </main>
  );
}
