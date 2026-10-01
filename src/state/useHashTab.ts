import { useCallback, useEffect, useState } from "react";
import type { TabId } from "../types";

const IDS: TabId[] = ["methods", "feynman", "cards", "pomo", "palace", "stats"];
const isTab = (v: string | null): v is TabId => !!v && (IDS as string[]).includes(v);

function initialTab(): TabId {
  const hash = location.hash.slice(1);
  if (isTab(hash)) return hash;
  try {
    const saved = sessionStorage.getItem("mtk-tab");
    if (isTab(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "methods";
}

/** Active tab, deep-linked through #hash and remembered per session. */
export function useHashTab() {
  const [tab, setTabState] = useState<TabId>(initialTab);

  const setTab = useCallback((next: TabId) => {
    setTabState(next);
    try {
      sessionStorage.setItem("mtk-tab", next);
      history.replaceState(null, "", "#" + next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1);
      if (isTab(h)) setTabState(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return [tab, setTab] as const;
}
