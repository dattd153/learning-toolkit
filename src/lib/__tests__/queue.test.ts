import { describe, expect, it } from "vitest";
import type { Card, Deck } from "../../types";
import { newAllowance, studyQueue } from "../../state/selectors";
import { appendCards, editCard } from "../../state/cardActions";
import { normalize } from "../storage";
import { newSrs, review } from "../srs";
import { DAY, dayKey } from "../utils";

const NOW = new Date(2026, 9, 1, 14, 0).getTime();
const deck = (id: string, newPerDay = 20, extra: Partial<Deck> = {}): Deck => ({ id, name: id, created: 0, newPerDay, ...extra });
const newCards = (deckId: string, n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${deckId}${i}`, deckId, front: `q${i}`, back: "a", topic: "", kind: "basic", due: NOW - 1000, created: NOW - (n - i) * 1000, srs: newSrs() }));
const studied = (id: string, deckId: string, due: number): Card => ({
  id, deckId, front: id, back: "a", topic: "", kind: "basic", due, created: 0, srs: { ...newSrs(), state: 2, stability: 3, difficulty: 5, reps: 2, lastReview: due - 3 * DAY },
});

describe("new cards per day", () => {
  it("limits new cards per deck but never limits reviews", () => {
    const data = { decks: [deck("a", 20)], cards: [...newCards("a", 50), studied("r1", "a", NOW - 1), studied("r2", "a", NOW + DAY)] };
    const q = studyQueue(data, "all", NOW);
    expect(q.fresh).toHaveLength(20);
    expect(q.review.map((c) => c.id)).toEqual(["r1"]);
    expect(q.moreNew).toBe(30);
    expect(q.fresh[0].id).toBe("a0"); // oldest first
  });

  it("counts cards introduced today and applies today's bonus", () => {
    const cards = newCards("a", 30).map((c, i) => (i < 5 ? { ...c, introduced: NOW - 3600_000, srs: { ...c.srs, state: 1 as const } } : c));
    expect(newAllowance(deck("a", 20), cards, NOW)).toBe(15);
    expect(newAllowance(deck("a", 20, { bonusNew: { date: dayKey(NOW), count: 10 } }), cards, NOW)).toBe(25);
    // yesterday's bonus no longer applies; yesterday's introductions don't count
    expect(newAllowance(deck("a", 20, { bonusNew: { date: dayKey(NOW - DAY), count: 10 } }), cards, NOW + DAY)).toBe(20);
  });

  it("each deck keeps its own limit when studying all decks", () => {
    const data = { decks: [deck("a", 3), deck("b", 0)], cards: [...newCards("a", 10), ...newCards("b", 10)] };
    const q = studyQueue(data, "all", NOW);
    expect(q.fresh.map((c) => c.deckId)).toEqual(["a", "a", "a"]);
    expect(studyQueue(data, "b", NOW).total).toBe(0);
  });

  it("a graded new card leaves the new pool", () => {
    const [c] = newCards("a", 1);
    const after = review(c, 3, NOW);
    expect(after.srs.state).not.toBe(0);
  });

  it("normalize gives old decks the default limit", () => {
    const d = normalize({ decks: [{ id: "x", name: "X" }, { id: "chung", name: "Chung", newPerDay: 5 }] });
    expect(d.decks.find((x) => x.id === "x")!.newPerDay).toBe(20);
    expect(d.decks.find((x) => x.id === "chung")!.newPerDay).toBe(5);
  });
});

describe("editCard", () => {
  it("edits a basic card and keeps its schedule", () => {
    const c = studied("c", "a", NOW + 5 * DAY);
    const r = editCard([c], "c", { front: "Mới", back: "Đáp án", deckId: "b" });
    if ("error" in r) throw new Error(r.error);
    expect(r.cards[0]).toMatchObject({ front: "Mới", back: "Đáp án", deckId: "b", due: NOW + 5 * DAY, srs: c.srs });
    expect(editCard([c], "c", { front: "x", back: " ", deckId: "a" })).toHaveProperty("error");
  });

  it("edits cloze siblings as a group, adding and dropping gaps", () => {
    const { cards } = appendCards([], [{ front: "A {{1}} B {{2}}", back: "", deckId: "a" }], NOW);
    const first = { ...cards[0], srs: { ...newSrs(), state: 2 as const, stability: 4, difficulty: 5 }, due: NOW + 4 * DAY };
    const all = [first, cards[1]];

    const grown = editCard(all, first.id, { front: "A {{1}} B {{2}} C {{3}}", back: "ghi chú", deckId: "a" }, NOW);
    if ("error" in grown) throw new Error(grown.error);
    expect(grown.cards.map((c) => c.clozeIndex).sort()).toEqual([0, 1, 2]);
    expect(grown.cards.find((c) => c.clozeIndex === 0)).toMatchObject({ due: NOW + 4 * DAY, back: "ghi chú" });

    const shrunk = editCard(grown.cards, first.id, { front: "Chỉ {{1}}", back: "", deckId: "a" }, NOW);
    if ("error" in shrunk) throw new Error(shrunk.error);
    expect(shrunk.cards).toHaveLength(1);
    expect(shrunk.cards[0]).toMatchObject({ id: first.id, clozeIndex: 0, srs: first.srs });

    expect(editCard(all, first.id, { front: "hết chỗ trống", back: "", deckId: "a" })).toHaveProperty("error");
  });

  it("does not touch an unrelated cloze card with different text", () => {
    const { cards } = appendCards([], [{ front: "X {{1}}", back: "", deckId: "a" }, { front: "Y {{1}}", back: "", deckId: "a" }], NOW);
    const r = editCard(cards, cards[0].id, { front: "X2 {{1}}", back: "", deckId: "a" }, NOW);
    if ("error" in r) throw new Error(r.error);
    expect(r.cards.map((c) => c.front).sort()).toEqual(["X2 {{1}}", "Y {{1}}"]);
  });
});
