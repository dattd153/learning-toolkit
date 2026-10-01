import { describe, expect, it } from "vitest";
import { clozeAnswer, clozeCount, clozeParts, clozePlain, hasCloze } from "../cloze";
import { parseDelimited, toCsv } from "../csv";
import { compareAnswer } from "../answer";
import { mergeData, parseBackup, toBackup } from "../backup";
import { blankData, normalize } from "../storage";
import { addCardsToNamedDecks, appendCards } from "../../state/cardActions";
import { dayKey } from "../utils";

describe("cloze", () => {
  const t = "Thủ đô của Úc là {{Canberra}}, dân số {{460 nghìn}}.";
  it("counts and extracts", () => {
    expect(hasCloze(t)).toBe(true);
    expect(clozeCount(t)).toBe(2);
    expect(clozeAnswer(t, 1)).toBe("460 nghìn");
  });
  it("hides only the active cloze", () => {
    expect(clozePlain(t, 0)).toBe("Thủ đô của Úc là […], dân số 460 nghìn.");
    expect(clozeParts(t, 0, true).find((p) => p.kind === "answer")?.text).toBe("Canberra");
  });
});

describe("appendCards / decks", () => {
  it("expands cloze into one card per gap and dedupes", () => {
    const a = appendCards([], [{ front: "A {{1}} B {{2}}", back: "" }, { front: "q", back: "a" }]);
    expect(a.added).toBe(3);
    expect(a.cards.filter((c) => c.kind === "cloze").map((c) => c.clozeIndex)).toEqual([0, 1]);
    const b = appendCards(a.cards, [{ front: "A {{1}} B {{2}}", back: "" }, { front: " q ", back: "a" }]);
    expect(b.added).toBe(0);
  });
  it("creates named decks once (case-insensitive)", () => {
    const d0 = normalize({});
    const { data, added } = addCardsToNamedDecks(d0, [
      { front: "1", back: "x", deckName: "Sinh học" },
      { front: "2", back: "x", deckName: "sinh HỌC" },
    ]);
    expect(added).toBe(2);
    expect(data.decks.map((d) => d.name)).toEqual(["Chung", "Sinh học"]);
    expect(new Set(data.cards.map((c) => c.deckId)).size).toBe(1);
  });
});

describe("csv", () => {
  it("parses quotes, embedded commas/newlines, BOM and Anki headers", () => {
    const rows = parseDelimited('﻿#separator:tab\n"a, b"\t"c\nd"\te\nx\ty\n');
    expect(rows).toEqual([["a, b", "c\nd", "e"], ["x", "y"]]);
  });
  it("round-trips through toCsv", () => {
    const rows = [["Mặt trước", "Mặt sau"], ['có "ngoặc"', "dòng 1\ndòng 2"]];
    expect(parseDelimited(toCsv(rows))).toEqual(rows);
  });
});

describe("compareAnswer", () => {
  it.each([
    ["canberra.", "Canberra", "match"],
    ["Canbera", "Canberra", "close"],
    ["Sydney", "Canberra", "diff"],
    ["", "Canberra", "empty"],
  ] as const)("%s vs %s → %s", (g, e, v) => expect(compareAnswer(g, e)).toBe(v));
  it("keeps Vietnamese diacritics significant", () => expect(compareAnswer("ma", "má")).not.toBe("match"));
});

describe("backup", () => {
  it("round-trips and rejects foreign JSON", () => {
    const d = normalize({ cards: [{ id: "1", front: "q", back: "a" }] });
    expect(parseBackup(JSON.stringify(toBackup(d))).cards[0].id).toBe("1");
    expect(() => parseBackup('{"x":1}')).toThrow();
    expect(() => parseBackup("not json")).toThrow();
  });
  it("merge adds missing items and takes the max of day counters", () => {
    const a = { ...blankData(), days: { "2026-10-01": { reviews: 5, correct: 4, focus: 1 } } };
    const b = normalize({ cards: [{ id: "x", front: "q", back: "a" }], days: { "2026-10-01": { reviews: 3, correct: 3, focus: 2 } } });
    const m = mergeData(a, b);
    expect(m.cards).toHaveLength(1);
    expect(m.days["2026-10-01"]).toEqual({ reviews: 5, correct: 4, focus: 2 });
    expect(mergeData(m, b).cards).toHaveLength(1);
  });
});

describe("dayKey", () => {
  it("uses the local calendar day", () => {
    const d = new Date(2026, 0, 2, 0, 30); // 00:30 local
    expect(dayKey(d.getTime())).toBe("2026-01-02");
  });
});
