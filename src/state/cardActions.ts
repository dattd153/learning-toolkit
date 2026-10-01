import type { AppData, Card, Deck } from "../types";
import { uid } from "../lib/utils";
import { newSrs } from "../lib/srs";
import { clozeCount, hasCloze } from "../lib/cloze";
import { DEFAULT_DECK_ID } from "../lib/storage";

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
  const deck = { id: uid(), name: n, created: Date.now() };
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
