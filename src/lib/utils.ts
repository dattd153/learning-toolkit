export const DAY = 86_400_000;
/** Days until the next review, indexed by Leitner box (index 0 unused). */
export const INTERVALS = [0, 1, 3, 7, 14, 30];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const todayKey = () => new Date().toISOString().slice(0, 10);

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
