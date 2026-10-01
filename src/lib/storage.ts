import type { AppData } from "../types";

/** Same key as the original single-file app, so existing data carries over. */
const STORAGE_KEY = "mtk-state";

export const blankData = (): AppData => ({
  cards: [],
  notes: [],
  palace: [],
  pomo: { date: "", count: 0 },
  settings: { focus: 25, short: 5, long: 15 },
  updatedAt: 0,
});

export function normalize(raw: unknown): AppData {
  const b = blankData();
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<AppData>;
  return {
    cards: Array.isArray(d.cards) ? d.cards : b.cards,
    notes: Array.isArray(d.notes) ? d.notes : b.notes,
    palace: Array.isArray(d.palace) ? d.palace : b.palace,
    pomo: d.pomo && typeof d.pomo === "object" ? d.pomo : b.pomo,
    settings: { ...b.settings, ...(d.settings ?? {}) },
    updatedAt: d.updatedAt ?? 0,
  };
}

export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : blankData();
  } catch {
    return blankData();
  }
}

export function saveLocal(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}
