import { describe, expect, it } from "vitest";
import type { Card } from "../../types";
import { createScheduler, formatInterval, newSrs, preview, review, srsFromLeitner } from "../srs";
import { DAY, MINUTE } from "../utils";

const sched = createScheduler(false); // no fuzz → deterministic
const NOW = Date.UTC(2026, 9, 1, 3, 0, 0);
const card = (over: Partial<Card> = {}): Card => ({
  id: "c", deckId: "chung", front: "q", back: "a", topic: "", kind: "basic", due: NOW, created: NOW, srs: newSrs(), ...over,
});

describe("FSRS scheduling", () => {
  it("new card: Again/Hard/Good stay in short learning steps, Easy graduates to days", () => {
    const p = preview(card(), NOW, sched);
    expect(p[1] - NOW).toBe(1 * MINUTE);
    expect(p[3] - NOW).toBe(10 * MINUTE);
    expect(p[4] - NOW).toBeGreaterThanOrEqual(DAY);
    expect(p[1] < p[2] && p[2] < p[3] && p[3] < p[4]).toBe(true);
  });

  it("Good twice graduates a new card to review with a multi-day interval", () => {
    let c = review(card(), 3, NOW, sched);
    expect(c.srs.state).toBe(1);
    c = review(c, 3, c.due, sched);
    expect(c.srs.state).toBe(2);
    expect(c.due - c.srs.lastReview!).toBeGreaterThanOrEqual(DAY);
    expect(c.srs.reps).toBe(2);
  });

  it("Again on a review card counts a lapse and goes to relearning", () => {
    const c0 = card({ srs: srsFromLeitner(4, NOW), due: NOW });
    const c = review(c0, 1, NOW, sched);
    expect(c.srs.state).toBe(3);
    expect(c.srs.lapses).toBe(1);
    expect(c.due - NOW).toBeLessThan(DAY);
  });

  it("migrated Leitner cards get longer intervals for higher boxes", () => {
    const g = (box: number) => {
      const c = card({ srs: srsFromLeitner(box, NOW), due: NOW });
      return preview(c, NOW, sched)[3] - NOW;
    };
    expect(g(3)).toBeLessThan(g(5));
    expect(Number.isFinite(g(5))).toBe(true);
  });

  it("never produces NaN dates or stability", () => {
    let c = card();
    for (const grade of [3, 3, 2, 1, 3, 4, 4, 1, 3] as const) {
      c = review(c, grade, c.due, sched);
      expect(Number.isFinite(c.due)).toBe(true);
      expect(Number.isFinite(c.srs.stability)).toBe(true);
    }
  });
});

describe("formatInterval", () => {
  it.each([
    [1 * MINUTE, "1 phút"],
    [10 * MINUTE, "10 phút"],
    [3 * 60 * MINUTE, "3 giờ"],
    [4 * DAY, "4 ngày"],
    [75 * DAY, "2,5 tháng"],
    [400 * DAY, "1,1 năm"],
  ])("%d ms → %s", (ms, label) => expect(formatInterval(ms)).toBe(label));
});
