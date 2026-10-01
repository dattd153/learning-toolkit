import type { AppData, BackupFile } from "../types";
import { normalize } from "./storage";

export function toBackup(data: AppData): BackupFile {
  return { app: "hop-cong-cu-ghi-nho", version: 2, exportedAt: new Date().toISOString(), data };
}

/**
 * Parse a backup file's text. Accepts the BackupFile wrapper or bare AppData
 * (from the old single-file app). Throws a user-facing message on bad input.
 */
export function parseBackup(text: string): AppData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("File không phải JSON hợp lệ.");
  }
  const obj = json as Partial<BackupFile> & Record<string, unknown>;
  const raw = obj && obj.app === "hop-cong-cu-ghi-nho" && obj.data ? obj.data : obj;
  if (!raw || typeof raw !== "object" || !("cards" in raw || "notes" in raw || "palace" in raw))
    throw new Error("File này không phải bản sao lưu của Hộp công cụ ghi nhớ.");
  return normalize(raw);
}

/** Add imported items whose id isn't already present; keep current settings and counters. */
export function mergeData(current: AppData, incoming: AppData): AppData {
  const add = <T extends { id: string }>(a: T[], b: T[]) => {
    const ids = new Set(a.map((x) => x.id));
    return [...a, ...b.filter((x) => !ids.has(x.id))];
  };
  // Per-day counters: keep the larger value so re-importing never double-counts.
  const days = { ...current.days };
  for (const [k, v] of Object.entries(incoming.days)) {
    const c = days[k];
    days[k] = c ? { reviews: Math.max(c.reviews, v.reviews), correct: Math.max(c.correct, v.correct), focus: Math.max(c.focus, v.focus) } : v;
  }
  return {
    ...current,
    cards: add(current.cards, incoming.cards),
    decks: add(current.decks, incoming.decks),
    notes: add(current.notes, incoming.notes),
    palace: add(current.palace, incoming.palace),
    days,
  };
}

export function backupFileName(date = new Date()) {
  return `hop-cong-cu-ghi-nho-${date.toISOString().slice(0, 10)}.json`;
}

/** Trigger a browser download for in-memory content. */
export function downloadText(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
