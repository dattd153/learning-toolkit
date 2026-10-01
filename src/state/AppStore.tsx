import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData } from "../types";
import { loadLocal, normalize, saveLocal } from "../lib/storage";
import { mergeData } from "../lib/backup";
import { connectArtifact, type Ai, type DocRef } from "../lib/platform";
import { ApiError, normalizeSyncCode, probeServer, serverAi, sync as syncApi } from "../lib/server";

export type SyncState =
  | { kind: "off" }
  | { kind: "idle" | "syncing" | "offline" | "error"; code: string }
  | { kind: "conflict"; code: string; remote: AppData; remoteRev: number };

interface AppStore {
  data: AppData;
  /** Apply an immutable update; bumps updatedAt and persists. */
  update: (fn: (d: AppData) => AppData) => void;
  /** AI features (Artifact runtime or backend), else null. */
  ai: Ai | null;
  syncStatus: string;
  /** Device sync via the backend; null when no backend is reachable. */
  sync: null | {
    state: SyncState;
    create(): Promise<void>;
    connect(code: string): Promise<void>;
    disconnect(): void;
    resolve(choice: "remote" | "local" | "merge"): void;
  };
}

const StoreContext = createContext<AppStore | null>(null);

const SYNC_CODE = "mtk-sync-code";
const SYNC_REV = "mtk-sync-rev";
const SYNC_DIRTY = "mtk-sync-dirty";
const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadLocal);
  const [ai, setAi] = useState<Ai | null>(null);
  const [syncStatus, setSyncStatus] = useState("Dữ liệu được lưu trên trình duyệt này.");
  const [hasServer, setHasServer] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(() => {
    const code = ls.get(SYNC_CODE);
    return code ? { kind: "idle", code } : { kind: "off" };
  });

  const dataRef = useRef(data);
  dataRef.current = data;
  const docRef = useRef<DocRef | null>(null);
  /** Set when the next data change came from a remote copy and must not be pushed back. */
  const fromRemote = useRef(false);
  const syncRef = useRef(syncState);
  syncRef.current = syncState;

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => ({ ...fn(prev), updatedAt: Date.now() }));
  }, []);

  const adoptRemote = useCallback((remote: AppData) => {
    fromRemote.current = true;
    setData(remote);
  }, []);

  // ---------- Device sync (backend) ----------
  const push = useCallback(async () => {
    const s = syncRef.current;
    if (s.kind === "off" || s.kind === "conflict") return;
    const base = Number(ls.get(SYNC_REV) ?? 0);
    setSyncState({ kind: "syncing", code: s.code });
    try {
      const { rev } = await syncApi.put(s.code, dataRef.current, base);
      ls.set(SYNC_REV, String(rev));
      ls.set(SYNC_DIRTY, null);
      setSyncState({ kind: "idle", code: s.code });
    } catch (e) {
      if (e instanceof ApiError && e.code === "conflict") return void pull();
      setSyncState({ kind: e instanceof ApiError && e.code === "offline" ? "offline" : "error", code: s.code });
    }
    // `pull` is declared below; it is only called after both exist.
  }, []);

  /** Fetch the server copy: adopt it if we have no unsynced changes, else ask the user. */
  const pull = useCallback(async () => {
    const s = syncRef.current;
    if (s.kind === "off" || s.kind === "conflict") return;
    setSyncState({ kind: "syncing", code: s.code });
    try {
      const remote = await syncApi.get(s.code);
      const base = Number(ls.get(SYNC_REV) ?? 0);
      const dirty = ls.get(SYNC_DIRTY) === "1";
      if (remote.rev === base) {
        setSyncState({ kind: "idle", code: s.code });
        if (dirty) void push();
        return;
      }
      const remoteData = normalize(remote.data);
      if (!dirty) {
        adoptRemote(remoteData);
        ls.set(SYNC_REV, String(remote.rev));
        setSyncState({ kind: "idle", code: s.code });
      } else {
        setSyncState({ kind: "conflict", code: s.code, remote: remoteData, remoteRev: remote.rev });
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "not_found") {
        ls.set(SYNC_CODE, null);
        setSyncState({ kind: "off" });
        setSyncStatus("Mã đồng bộ không còn tồn tại trên máy chủ.");
        return;
      }
      setSyncState({ kind: e instanceof ApiError && e.code === "offline" ? "offline" : "error", code: s.code });
    }
  }, [adoptRemote, push]);

  // Persist locally on every change; push to Artifact account / sync server (debounced).
  useEffect(() => {
    saveLocal(data);
    if (fromRemote.current) {
      fromRemote.current = false;
      return;
    }
    if (!data.updatedAt) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const doc = docRef.current;
    if (doc)
      timers.push(
        setTimeout(async () => {
          try {
            await doc.set(JSON.parse(JSON.stringify(data)));
            setSyncStatus("Đã lưu vào tài khoản của bạn.");
          } catch (e) {
            setSyncStatus(
              (e as { code?: string })?.code === "quota_exceeded"
                ? "Bộ nhớ đã đầy, hãy xoá bớt thẻ hoặc bài cũ."
                : "Chưa lưu được lên tài khoản, dữ liệu vẫn nằm trên trình duyệt này.",
            );
          }
        }, 800),
      );
    if (syncRef.current.kind !== "off") {
      ls.set(SYNC_DIRTY, "1");
      if (syncRef.current.kind !== "conflict") timers.push(setTimeout(() => void push(), 1500));
    }
    return () => timers.forEach(clearTimeout);
  }, [data, push]);

  // Connect once: Artifact runtime first, else probe the backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const artifact = await connectArtifact();
      if (cancelled) return;
      if (artifact) {
        setAi(artifact.ai);
        const doc = artifact.doc;
        if (!doc) return;
        docRef.current = doc;
        try {
          const snap = await doc.get();
          if (cancelled) return;
          if (snap.exists) {
            const remote = normalize(JSON.parse(JSON.stringify(snap.data())));
            if (remote.updatedAt > dataRef.current.updatedAt) adoptRemote(remote);
            else if (dataRef.current.updatedAt > remote.updatedAt) setData((d) => ({ ...d }));
          } else if (dataRef.current.updatedAt) setData((d) => ({ ...d }));
          setSyncStatus("Dữ liệu được lưu vào tài khoản của bạn, mở ở thiết bị khác vẫn còn.");
        } catch {
          /* stay local-only */
        }
        return;
      }
      const info = await probeServer();
      if (cancelled || !info) return;
      if (info.ai) setAi(serverAi);
      if (info.sync) {
        setHasServer(true);
        if (syncRef.current.kind !== "off") void pull();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adoptRemote, pull]);

  // Re-check the server copy when the tab comes back and every 2 minutes.
  useEffect(() => {
    if (!hasServer || syncState.kind === "off") return;
    const onVisible = () => document.visibilityState === "visible" && void pull();
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(() => document.visibilityState === "visible" && void pull(), 120_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(t);
    };
  }, [hasServer, syncState.kind, pull]);

  const syncApiForUi = useMemo<AppStore["sync"]>(() => {
    if (!hasServer) return null;
    return {
      state: syncState,
      async create() {
        const { code, rev } = await syncApi.create(dataRef.current);
        ls.set(SYNC_CODE, code);
        ls.set(SYNC_REV, String(rev));
        ls.set(SYNC_DIRTY, null);
        setSyncState({ kind: "idle", code });
      },
      async connect(raw) {
        const code = normalizeSyncCode(raw);
        const remote = await syncApi.get(code); // throws not_found for a wrong code
        ls.set(SYNC_CODE, code);
        ls.set(SYNC_REV, String(remote.rev));
        const local = dataRef.current;
        const hasLocal = local.cards.length + local.notes.length + local.palace.length > 0;
        if (hasLocal) {
          // Joining with existing local data: merge both, then push the union.
          ls.set(SYNC_DIRTY, "1");
          syncRef.current = { kind: "idle", code };
          setSyncState({ kind: "idle", code });
          update((d) => mergeData(d, normalize(remote.data)));
        } else {
          ls.set(SYNC_DIRTY, null);
          adoptRemote(normalize(remote.data));
          setSyncState({ kind: "idle", code });
        }
      },
      disconnect() {
        [SYNC_CODE, SYNC_REV, SYNC_DIRTY].forEach((k) => ls.set(k, null));
        setSyncState({ kind: "off" });
      },
      resolve(choice) {
        const s = syncRef.current;
        if (s.kind !== "conflict") return;
        ls.set(SYNC_REV, String(s.remoteRev));
        const next = { kind: "idle" as const, code: s.code };
        syncRef.current = next;
        setSyncState(next);
        if (choice === "remote") {
          ls.set(SYNC_DIRTY, null);
          adoptRemote(s.remote);
        } else if (choice === "merge") update((d) => mergeData(d, s.remote));
        else void push(); // keep local: overwrite the server
      },
    };
  }, [hasServer, syncState, adoptRemote, update, push]);

  const value = useMemo(
    () => ({ data, update, ai, syncStatus, sync: syncApiForUi }),
    [data, update, ai, syncStatus, syncApiForUi],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppStoreProvider>");
  return ctx;
}
