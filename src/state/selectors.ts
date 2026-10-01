import type { AppData, Card, DayStats, Deck } from "../types";
import { dayKey, todayKey } from "../lib/utils";

/** Cards due now, optionally limited to one deck ("all" = every deck). Ignores the new-card limit. */
export const dueCards = (cards: Card[], now = Date.now(), deckId = "all") =>
  cards.filter((c) => c.due <= now && (deckId === "all" || c.deckId === deckId));

/** New cards from this deck already shown for the first time today. */
export const introducedToday = (cards: Card[], deckId: string, now = Date.now()) => {
  const today = dayKey(now);
  return cards.filter((c) => c.deckId === deckId && c.introduced !== undefined && dayKey(c.introduced) === today).length;
};

/** How many more new cards this deck may introduce today (limit + today's bonus − already introduced). */
export function newAllowance(deck: Deck, cards: Card[], now = Date.now()) {
  const bonus = deck.bonusNew?.date === dayKey(now) ? deck.bonusNew.count : 0;
  return Math.max(0, deck.newPerDay + bonus - introducedToday(cards, deck.id, now));
}

export interface StudyQueue {
  /** Already-studied cards that are due (never limited). */
  review: Card[];
  /** New cards allowed today, oldest first. */
  fresh: Card[];
  total: number;
  /** New cards waiting beyond today's limit. */
  moreNew: number;
}

/** Today's study queue for one deck or all decks, honouring each deck's new-cards-per-day limit. */
export function studyQueue(data: Pick<AppData, "cards" | "decks">, deckId = "all", now = Date.now()): StudyQueue {
  const decks = deckId === "all" ? data.decks : data.decks.filter((d) => d.id === deckId);
  const review: Card[] = [], fresh: Card[] = [];
  let moreNew = 0;
  for (const deck of decks) {
    const inDeck = data.cards.filter((c) => c.deckId === deck.id);
    for (const c of inDeck) if (c.srs.state !== 0 && c.due <= now) review.push(c);
    const waiting = inDeck.filter((c) => c.srs.state === 0).sort((a, b) => a.created - b.created || a.id.localeCompare(b.id));
    const allow = newAllowance(deck, data.cards, now);
    fresh.push(...waiting.slice(0, allow));
    moreNew += Math.max(0, waiting.length - allow);
  }
  return { review, fresh, total: review.length + fresh.length, moreNew };
}

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
