import { useCallback, useState } from "react";

export type PanelTab = "documents" | "comments" | "ai" | "history";

const OPEN_KEY = "katagami:panel-open";
const TAB_KEY = "katagami:panel-tab";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

function readTab(fallback: PanelTab): PanelTab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v === "documents" || v === "comments" || v === "ai" || v === "history") return v;
  } catch {
    // ignore
  }
  return fallback;
}

export function usePanelVisibility() {
  const [open, setOpenState] = useState<boolean>(() => readBool(OPEN_KEY, true));
  const [activeTab, setActiveTabState] = useState<PanelTab>(() => readTab("comments"));

  const setOpen = useCallback((next: boolean) => {
    try { localStorage.setItem(OPEN_KEY, String(next)); } catch { /* ignore */ }
    setOpenState(next);
  }, []);

  const togglePanel = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try { localStorage.setItem(OPEN_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setActiveTab = useCallback((next: PanelTab) => {
    try { localStorage.setItem(TAB_KEY, next); } catch { /* ignore */ }
    setActiveTabState(next);
  }, []);

  return { open, setOpen, togglePanel, activeTab, setActiveTab };
}
