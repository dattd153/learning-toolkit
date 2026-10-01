import type { AppData, Card, DayStats } from "../types";
import { addDays, dayKey, startOfDay } from "./utils";

const activity = (d?: DayStats) => (d ? d.reviews + d.focus : 0);

/**
 * Consecutive active days (reviews or focus sessions). If today has no
 * activity yet, the current streak still counts up to yesterday.
 */
export function streaks(days: AppData["days"], now = Date.now()): { current: number; best: number; activeToday: boolean } {
  const activeToday = activity(days[dayKey(now)]) > 0;
  let current = 0;
  for (let t = activeToday ? now : addDays(now, -1); activity(days[dayKey(t)]) > 0; t = addDays(t, -1)) current++;

  const keys = Object.keys(days).filter((k) => activity(days[k]) > 0).sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number);
    const expected = prev ? dayKey(addDays(new Date(y, m - 1, d).getTime(), -1)) : null;
    run = prev && expected === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best: Math.max(best, current), activeToday };
}

export interface HeatCell {
  key: string;
  date: number;
  reviews: number;
  focus: number;
  value: number;
  future: boolean;
}

/** `weeks` columns × 7 rows (Monday first), ending with the current week. */
export function heatmap(days: AppData["days"], weeks = 20, now = Date.now()): HeatCell[][] {
  const today = startOfDay(now);
  const mondayOffset = (new Date(today).getDay() + 6) % 7; // 0 = Monday
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, w * 7 + i);
      const key = dayKey(date);
      const d = days[key];
      return { key, date, reviews: d?.reviews ?? 0, focus: d?.focus ?? 0, value: activity(d), future: date > today };
    }),
  );
}

/** Quantize to 0–4 intensity levels relative to the busiest day shown. */
export const level = (value: number, max: number) => (value <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((value / max) * 4)));

/** Recall rate over the last `n` days (today included). */
export function accuracy(days: AppData["days"], n = 30, now = Date.now()) {
  let reviews = 0, correct = 0;
  for (let i = 0; i < n; i++) {
    const d = days[dayKey(addDays(now, -i))];
    if (d) {
      reviews += d.reviews;
      correct += d.correct;
    }
  }
  return { reviews, correct, rate: reviews ? correct / reviews : null };
}

/** Cards due on each of the next `n` days; overdue cards count toward today. */
export function forecast(cards: Card[], n = 7, now = Date.now()) {
  const today = startOfDay(now);
  const out = Array.from({ length: n }, (_, i) => ({ date: addDays(today, i), count: 0 }));
  const end = addDays(today, n);
  for (const c of cards) {
    if (c.due >= end) continue;
    const idx = c.due < addDays(today, 1) ? 0 : out.findIndex((d, i) => c.due >= d.date && (i === n - 1 || c.due < out[i + 1].date));
    if (idx >= 0) out[idx].count++;
  }
  return out;
}

export function stateCounts(cards: Card[]) {
  const counts: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const c of cards) counts[c.srs.state]++;
  return counts;
}
