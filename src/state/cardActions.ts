import type { AppData, Card, Deck } from "../types";
import { uid } from "../lib/utils";
import { newSrs } from "../lib/srs";
import { clozeCount, hasCloze } from "../lib/cloze";
import { DEFAULT_DECK_ID, DEFAULT_NEW_PER_DAY } from "../lib/storage";

export interface NewCard {
  front: string;
  back: string;
  topic?: string;
  deckId?: string;
}

const key = (c: { front: string; back: string; clozeIndex?: number }) =>
  `${c.front.trim()}\u0000${c.back.trim()}\u0000${c.clozeIndex ?? ""}`;

/** One card per {{...}} for cloze text, else a single basic card. */
function expand(it: NewCard, now: number): Card[] {
  const front = it.front.trim(), back = it.back.trim();
  const base = { deckId: it.deckId || DEFAULT_DECK_ID, front, back, topic: (it.topic ?? "").trim(), due: now, created: now };
  if (hasCloze(front))
    return Array.from({ length: clozeCount(front) }, (_, i) => ({ ...base, id: uid(), kind: "cloze" as const, clozeIndex: i, srs: newSrs() }));
  if (!front || !back) return [];
  return [{ ...base, id: uid(), kind: "basic", srs: newSrs() }];
}

/**
 * Append new cards (due now, FSRS state New). Cloze text expands to one card
 * per {{...}}. Cards whose front+back(+cloze index) already exist are skipped.
 */
export function appendCards(cards: Card[], items: NewCard[], now = Date.now()): { cards: Card[]; added: number } {
  const seen = new Set(cards.map(key));
  const fresh: Card[] = [];
  for (const it of items)
    for (const c of expand(it, now)) {
      if (seen.has(key(c))) continue;
      seen.add(key(c));
      fresh.push(c);
    }
  return { cards: fresh.length ? [...cards, ...fresh] : cards, added: fresh.length };
}

/** Find a deck by name (case-insensitive) or create it. */
export function ensureDeck(decks: Deck[], name: string): { decks: Deck[]; id: string } {
  const n = name.trim();
  if (!n) return { decks, id: DEFAULT_DECK_ID };
  const found = decks.find((d) => d.name.toLowerCase() === n.toLowerCase());
  if (found) return { decks, id: found.id };
  const deck: Deck = { id: uid(), name: n, created: Date.now(), newPerDay: DEFAULT_NEW_PER_DAY };
  return { decks: [...decks, deck], id: deck.id };
}

/** Add cards whose deck is given by name (creating decks as needed). Returns new data and count added. */
export function addCardsToNamedDecks(d: AppData, items: (NewCard & { deckName?: string })[]): { data: AppData; added: number } {
  let decks = d.decks;
  const resolved = items.map((it) => {
    if (it.deckId || !it.deckName) return it;
    const r = ensureDeck(decks, it.deckName);
    decks = r.decks;
    return { ...it, deckId: r.id };
  });
  const { cards, added } = appendCards(d.cards, resolved);
  return { data: added ? { ...d, decks, cards } : d, added };
}

export interface CardEdit {
  front: string;
  back: string;
  deckId: string;
}

/**
 * Edit a card's text/deck while keeping its review history (srs, due).
 * Cloze cards made from the same sentence (same front + deck) are edited as a
 * group: gaps that disappear drop their card, new gaps get a new card.
 */
export function editCard(cards: Card[], id: string, patch: CardEdit, now = Date.now()): { cards: Card[] } | { error: string } {
  const card = cards.find((c) => c.id === id);
  if (!card) return { error: "Không tìm thấy thẻ." };
  const front = patch.front.trim(), back = patch.back.trim(), deckId = patch.deckId || DEFAULT_DECK_ID;

  if (card.kind === "basic") {
    if (!front || !back) return { error: "Cần điền cả hai mặt thẻ." };
    return { cards: cards.map((c) => (c.id === id ? { ...c, front, back, deckId } : c)) };
  }

  if (!hasCloze(front)) return { error: "Thẻ điền chỗ trống cần ít nhất một chỗ {{...}}." };
  const isSibling = (c: Card) => c.kind === "cloze" && c.front === card.front && c.deckId === card.deckId;
  const n = clozeCount(front);
  const have = new Set<number>();
  const kept: Card[] = [];
  for (const c of cards) {
    if (!isSibling(c)) kept.push(c);
    else if ((c.clozeIndex ?? 0) < n) {
      have.add(c.clozeIndex ?? 0);
      kept.push({ ...c, front, back, deckId });
    } // else: that gap no longer exists → drop the card
  }
  for (let i = 0; i < n; i++)
    if (!have.has(i))
      kept.push({ id: uid(), deckId, front, back, topic: card.topic, kind: "cloze", clozeIndex: i, due: now, created: now, srs: newSrs() });
  return { cards: kept };
}

/**
 * "Học thêm N thẻ mới": raise today's allowance by `n` in total, spread over
 * the chosen deck (or every deck that still has new cards waiting).
 */
export function grantBonusNew(d: AppData, deckId: string, n: number, waitingByDeck: Record<string, number>, today: string): AppData {
  let left = n;
  const decks = d.decks.map((deck) => {
    if (left <= 0 || (deckId !== "all" && deck.id !== deckId)) return deck;
    const give = Math.min(left, waitingByDeck[deck.id] ?? 0);
    if (!give) return deck;
    left -= give;
    const prev = deck.bonusNew?.date === today ? deck.bonusNew.count : 0;
    return { ...deck, bonusNew: { date: today, count: prev + give } };
  });
  return { ...d, decks };
}
