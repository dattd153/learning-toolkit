import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData } from "../types";
import { loadLocal, normalize, saveLocal } from "../lib/storage";
import { connectPlatform, type DocRef, type Sampler } from "../lib/platform";

interface AppStore {
  data: AppData;
  /** Apply an immutable update; bumps updatedAt and persists. */
  update: (fn: (d: AppData) => AppData) => void;
  /** Claude sampler when running inside the Artifact runtime, else null. */
  sampler: Sampler | null;
  syncStatus: string;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadLocal);
  const [sampler, setSampler] = useState<Sampler | null>(null);
  const [syncStatus, setSyncStatus] = useState("Dữ liệu được lưu trên trình duyệt này.");
  const docRef = useRef<DocRef | null>(null);
  const skipRemote = useRef(false);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => ({ ...fn(prev), updatedAt: Date.now() }));
  }, []);

  // Persist locally on every change; push to the account (debounced) when connected.
  useEffect(() => {
    saveLocal(data);
    const doc = docRef.current;
    if (!doc || !data.updatedAt) return;
    if (skipRemote.current) {
      skipRemote.current = false;
      return;
    }
    const t = setTimeout(async () => {
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
    }, 800);
    return () => clearTimeout(t);
  }, [data]);

  // Connect to the optional platform once; newest copy (local vs account) wins.
  useEffect(() => {
    let cancelled = false;
    connectPlatform().then(async ({ sampler, doc }) => {
      if (cancelled) return;
      setSampler(sampler);
      if (!doc) return;
      docRef.current = doc;
      try {
        const snap = await doc.get();
        if (cancelled) return;
        if (snap.exists) {
          const remote = normalize(JSON.parse(JSON.stringify(snap.data())));
          setData((local) => {
            if (remote.updatedAt > local.updatedAt) {
              skipRemote.current = true;
              return remote;
            }
            return local.updatedAt > remote.updatedAt ? { ...local } : local;
          });
        } else {
          setData((local) => (local.updatedAt ? { ...local } : local));
        }
        setSyncStatus("Dữ liệu được lưu vào tài khoản của bạn, mở ở thiết bị khác vẫn còn.");
      } catch {
        /* stay local-only */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ data, update, sampler, syncStatus }), [data, update, sampler, syncStatus]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppStoreProvider>");
  return ctx;
}
