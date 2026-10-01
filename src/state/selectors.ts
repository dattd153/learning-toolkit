import type { AppData, Card, DayStats } from "../types";
import { todayKey } from "../lib/utils";

/** Cards due now, optionally limited to one deck ("all" = every deck). */
export const dueCards = (cards: Card[], now = Date.now(), deckId = "all") =>
  cards.filter((c) => c.due <= now && (deckId === "all" || c.deckId === deckId));

export const emptyDay = (): DayStats => ({ reviews: 0, correct: 0, focus: 0 });

export const pomoToday = (data: AppData) => data.days[todayKey()]?.focus ?? 0;

/** Return `days` with today's counters incremented. */
export function bumpDay(days: AppData["days"], patch: Partial<DayStats>, key = todayKey()): AppData["days"] {
  const d = days[key] ?? emptyDay();
  return {
    ...days,
    [key]: {
      reviews: d.reviews + (patch.reviews ?? 0),
      correct: d.correct + (patch.correct ?? 0),
      focus: d.focus + (patch.focus ?? 0),
    },
  };
}
