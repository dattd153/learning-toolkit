import { describe, expect, it } from "vitest";
import { DEFAULT_DECK_ID, blankData, normalize } from "../storage";
import { DAY } from "../utils";

const NOW = Date.UTC(2026, 9, 1, 3, 0, 0);

const v1 = {
  cards: [
    { id: "a", front: "Thủ đô Úc?", back: "Canberra", topic: "Địa lý", box: 1, due: NOW, created: NOW - 5 * DAY },
    { id: "b", front: "Ohm", back: "U = I·R", topic: "Vật lý", box: 3, due: NOW + 2 * DAY, created: NOW - 9 * DAY },
    { id: "c", front: "Không chủ đề", back: "x", topic: "", box: 5, due: NOW + DAY, created: NOW },
    { id: "d", front: "địa lý viết thường", back: "y", topic: "địa lý", box: 2, due: NOW, created: NOW },
    { id: "broken", front: "", back: "x" },
    "rác",
  ],
  notes: [{ id: "n", concept: "Quang hợp", text: "...", gaps: "", updated: NOW }, { concept: "" }],
  palace: [{ id: "p", place: "Cửa", item: "Kali", image: "" }, { place: "x" }],
  pomo: { date: "2026-10-01", count: 3 },
  settings: { focus: 500, short: 5, long: "15" },
  updatedAt: NOW,
};

describe("normalize: v1 (Leitner) → v2", () => {
  const d = normalize(v1);

  it("drops broken items", () => {
    expect(d.cards.map((c) => c.id)).toEqual(["a", "b", "c", "d"]);
    expect(d.notes).toHaveLength(1);
    expect(d.palace).toHaveLength(1);
  });

  it("turns each distinct topic (case-insensitive) into a deck, others go to Chung", () => {
    expect(d.decks.map((x) => x.name)).toEqual(["Chung", "Địa lý", "Vật lý"]);
    const deckOf = (id: string) => d.decks.find((x) => x.id === d.cards.find((c) => c.id === id)!.deckId)!.name;
    expect(deckOf("a")).toBe("Địa lý");
    expect(deckOf("d")).toBe("Địa lý");
    expect(deckOf("b")).toBe("Vật lý");
    expect(d.cards.find((c) => c.id === "c")!.deckId).toBe(DEFAULT_DECK_ID);
  });

  it("maps Leitner boxes to FSRS state and keeps the due date", () => {
    const a = d.cards.find((c) => c.id === "a")!;
    expect(a.srs.state).toBe(0);
    const b = d.cards.find((c) => c.id === "b")!;
    expect(b.srs).toMatchObject({ state: 2, stability: 7, difficulty: 5, scheduledDays: 7, reps: 2 });
    expect(b.srs.lastReview).toBe(NOW + 2 * DAY - 7 * DAY);
    expect(b.due).toBe(NOW + 2 * DAY);
    expect(d.cards.find((c) => c.id === "c")!.srs.stability).toBe(30);
  });

  it("folds the old pomo counter into days and clamps settings", () => {
    expect(d.days["2026-10-01"]).toEqual({ reviews: 0, correct: 0, focus: 3 });
    expect(d.settings).toEqual({ focus: 120, short: 5, long: 15 });
    expect(d.version).toBe(2);
  });

  it("is idempotent on v2 data", () => {
    expect(normalize(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
});

describe("normalize: v2 guards", () => {
  it("always keeps the Chung deck and resets cards pointing at missing decks", () => {
    const d = normalize({ decks: [{ id: "x", name: "X" }], cards: [{ id: "1", front: "q", back: "a", deckId: "gone", srs: { state: 0 } }] });
    expect(d.decks[0].id).toBe(DEFAULT_DECK_ID);
    expect(d.cards[0].deckId).toBe(DEFAULT_DECK_ID);
  });

  it("resets a non-new SRS state with zero stability (would make FSRS produce NaN)", () => {
    const d = normalize({ cards: [{ id: "1", front: "q", back: "a", srs: { state: 2, stability: 0, difficulty: 0 } }] });
    expect(d.cards[0].srs.state).toBe(0);
  });

  it("keeps cloze cards without a back but drops basic ones", () => {
    const d = normalize({ cards: [{ front: "A {{b}} {{c}}", back: "", kind: "cloze", clozeIndex: 9 }, { front: "q", back: "" }] });
    expect(d.cards).toHaveLength(1);
    expect(d.cards[0].clozeIndex).toBe(1);
  });

  it("validates the reminder time", () => {
    expect(normalize({ prefs: { reminder: "07:30" } }).prefs.reminder).toBe("07:30");
    expect(normalize({ prefs: { reminder: "25:00" } }).prefs.reminder).toBe("");
  });

  it("blank data is valid", () => {
    expect(normalize(blankData())).toEqual(blankData());
  });
});
