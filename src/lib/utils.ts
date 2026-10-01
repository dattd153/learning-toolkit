export const DAY = 86_400_000;
export const MINUTE = 60_000;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Local calendar day "YYYY-MM-DD" (not UTC: a 6am review in UTC+7 belongs to today). */
export function dayKey(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const todayKey = () => dayKey();

/** Local midnight of the day containing `ms`. */
export function startOfDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Add whole calendar days (DST-safe). */
export function addDays(ms: number, n: number) {
  const d = new Date(ms);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export const formatDate = (ms: number) => new Date(ms).toLocaleDateString("vi-VN");

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
