import { describe, expect, it } from "vitest";
import type { Card } from "../../types";
import { accuracy, forecast, heatmap, level, stateCounts, streaks } from "../stats";
import { newSrs } from "../srs";
import { addDays, dayKey } from "../utils";

const NOW = new Date(2026, 9, 1, 14, 0).getTime(); // Thu 1 Oct 2026, 14:00 local
const k = (offset: number) => dayKey(addDays(NOW, offset));
const day = (reviews: number, correct = reviews, focus = 0) => ({ reviews, correct, focus });

describe("streaks", () => {
  it("counts back from today when active today", () => {
    const days = { [k(0)]: day(3), [k(-1)]: day(0, 0, 1), [k(-2)]: day(5), [k(-4)]: day(1) };
    expect(streaks(days, NOW)).toEqual({ current: 3, best: 3, activeToday: true });
  });
  it("keeps yesterday's streak alive if today has no activity yet", () => {
    const days = { [k(-1)]: day(2), [k(-2)]: day(2) };
    expect(streaks(days, NOW)).toMatchObject({ current: 2, activeToday: false });
  });
  it("finds the best run in history and ignores empty days", () => {
    const days = { [k(-10)]: day(1), [k(-9)]: day(1), [k(-8)]: day(1), [k(-7)]: day(1), [k(-6)]: day(0), [k(0)]: day(1) };
    expect(streaks(days, NOW)).toMatchObject({ current: 1, best: 4 });
  });
  it("handles month boundaries", () => {
    const days = { "2026-09-30": day(1), "2026-10-01": day(1) };
    expect(streaks(days, NOW).current).toBe(2);
  });
});

describe("heatmap", () => {
  it("is weeks×7, Monday-first, ending in the current week", () => {
    const h = heatmap({ [k(0)]: day(4, 4, 1) }, 3, NOW);
    expect(h).toHaveLength(3);
    expect(h.every((w) => w.length === 7)).toBe(true);
    expect(new Date(h[0][0].date).getDay()).toBe(1);
    const today = h[2].find((c) => c.key === k(0))!;
    expect(today.value).toBe(5);
    expect(h[2].filter((c) => c.future)).toHaveLength(3); // Fri, Sat, Sun
  });
  it("quantizes to 0–4", () => {
    expect([0, 1, 5, 10].map((v) => level(v, 10))).toEqual([0, 1, 2, 4]);
  });
});

describe("accuracy & forecast", () => {
  it("rates recall over the window", () => {
    const days = { [k(0)]: day(10, 8), [k(-29)]: day(10, 6), [k(-30)]: day(100, 0) };
    expect(accuracy(days, 30, NOW)).toEqual({ reviews: 20, correct: 14, rate: 0.7 });
    expect(accuracy({}, 30, NOW).rate).toBeNull();
  });
  it("buckets due cards by day with overdue in today", () => {
    const c = (due: number, state: 0 | 2 = 2): Card => ({ id: String(due), deckId: "chung", front: "q", back: "a", topic: "", kind: "basic", due, created: 0, srs: { ...newSrs(), state, stability: 1, difficulty: 5 } });
    const cards = [c(addDays(NOW, -3)), c(NOW), c(addDays(NOW, 1)), c(addDays(NOW, 6)), c(addDays(NOW, 7)), c(NOW, 0)];
    expect(forecast(cards, 7, NOW).map((d) => d.count)).toEqual([3, 1, 0, 0, 0, 0, 1]);
    expect(stateCounts(cards)).toEqual({ 0: 1, 1: 0, 2: 5, 3: 0 });
  });
});
