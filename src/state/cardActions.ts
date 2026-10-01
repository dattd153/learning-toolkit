import type { Card } from "../types";
import { uid } from "../lib/utils";

export interface NewCard {
  front: string;
  back: string;
  topic?: string;
}

const key = (front: string, back: string) => front.trim() + "\u0000" + back.trim();

/**
 * Append new cards (due immediately, box 1), skipping any whose front+back
 * already exist or repeat within the batch.
 */
export function appendCards(cards: Card[], items: NewCard[]): { cards: Card[]; added: number } {
  const seen = new Set(cards.map((c) => key(c.front, c.back)));
  const now = Date.now();
  const fresh: Card[] = [];
  for (const it of items) {
    const front = it.front.trim(), back = it.back.trim();
    if (!front || !back || seen.has(key(front, back))) continue;
    seen.add(key(front, back));
    fresh.push({ id: uid(), front, back, topic: (it.topic ?? "").trim(), box: 1, due: now, created: now });
  }
  return { cards: fresh.length ? [...cards, ...fresh] : cards, added: fresh.length };
}
