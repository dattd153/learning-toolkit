import type { AppData, Card, DayStats, Deck, Note, PalaceStop, Srs } from "../types";
import { uid } from "./utils";
import { newSrs, srsFromLeitner } from "./srs";
import { clozeCount, hasCloze } from "./cloze";

/** Same key as the original single-file app, so existing data carries over. */
const STORAGE_KEY = "mtk-state";

export const DEFAULT_DECK_ID = "chung";
export const defaultDeck = (): Deck => ({ id: DEFAULT_DECK_ID, name: "Chung", created: 0 });

export const blankData = (): AppData => ({
  version: 2,
  cards: [],
  decks: [defaultDeck()],
  notes: [],
  palace: [],
  days: {},
  settings: { focus: 25, short: 5, long: 15 },
  prefs: { typeAnswer: false, reminder: "" },
  updatedAt: 0,
});

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, Math.round(num(v, fallback))));

function cleanSrs(v: unknown): Srs | null {
  if (!isObj(v)) return null;
  const state = clampInt(v.state, 0, 3, 0) as Srs["state"];
  const srs: Srs = {
    state,
    stability: Math.max(0, num(v.stability, 0)),
    difficulty: Math.min(10, Math.max(0, num(v.difficulty, 0))),
    scheduledDays: Math.max(0, num(v.scheduledDays, 0)),
    learningSteps: clampInt(v.learningSteps, 0, 100, 0),
    reps: clampInt(v.reps, 0, 1e6, 0),
    lapses: clampInt(v.lapses, 0, 1e6, 0),
  };
  if (typeof v.lastReview === "number" && Number.isFinite(v.lastReview)) srs.lastReview = v.lastReview;
  // A non-new card needs a positive stability/difficulty or FSRS produces NaN.
  if (state !== 0 && (srs.stability <= 0 || srs.difficulty <= 0)) return newSrs();
  return srs;
}

function cleanCard(v: unknown, deckIds: Set<string>, deckByName: Map<string, string>): Card | null {
  if (!isObj(v)) return null;
  const front = str(v.front), back = str(v.back), topic = str(v.topic);
  const kind = v.kind === "cloze" && hasCloze(front) ? "cloze" : "basic";
  if (!front.trim() || (kind === "basic" && !back.trim())) return null;
  const now = Date.now();
  const due = num(v.due, now);

  // v1 (Leitner) cards have `box` and no `srs`; v1 has no decks, so map topic → deck.
  const srs = cleanSrs(v.srs) ?? srsFromLeitner(clampInt(v.box, 1, 5, 1), due);
  let deckId = str(v.deckId);
  if (!deckIds.has(deckId)) deckId = deckByName.get(topic.trim().toLowerCase()) ?? DEFAULT_DECK_ID;

  const card: Card = { id: str(v.id) || uid(), deckId, front, back, topic, kind, due, created: num(v.created, now), srs };
  if (kind === "cloze") card.clozeIndex = clampInt(v.clozeIndex, 0, Math.max(0, clozeCount(front) - 1), 0);
  return card;
}

function cleanNote(v: unknown): Note | null {
  if (!isObj(v) || !str(v.concept).trim()) return null;
  const note: Note = { id: str(v.id) || uid(), concept: str(v.concept), text: str(v.text), gaps: str(v.gaps), updated: num(v.updated, Date.now()) };
  if (isObj(v.feedback)) note.feedback = v.feedback as unknown as Note["feedback"];
  return note;
}

function cleanStop(v: unknown): PalaceStop | null {
  if (!isObj(v) || !str(v.place).trim() || !str(v.item).trim()) return null;
  return { id: str(v.id) || uid(), place: str(v.place), item: str(v.item), image: str(v.image) };
}

const cleanList = <T,>(v: unknown, fn: (x: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.map(fn).filter((x): x is T => x !== null) : [];

function cleanDecks(raw: Loose): Deck[] {
  const decks: Deck[] = [defaultDeck()];
  const seen = new Set([DEFAULT_DECK_ID]);
  if (Array.isArray(raw.decks)) {
    for (const v of raw.decks) {
      if (!isObj(v) || !str(v.name).trim()) continue;
      const id = str(v.id) || uid();
      if (seen.has(id)) {
        if (id === DEFAULT_DECK_ID) decks[0].name = str(v.name).trim();
        continue;
      }
      seen.add(id);
      decks.push({ id, name: str(v.name).trim(), created: num(v.created, 0) });
    }
  } else if (Array.isArray(raw.cards)) {
    // v1 → v2: every distinct topic becomes a deck.
    const names = new Map<string, string>();
    for (const c of raw.cards) {
      const t = isObj(c) ? str(c.topic).trim() : "";
      if (t && !names.has(t.toLowerCase())) names.set(t.toLowerCase(), t);
    }
    for (const name of names.values()) decks.push({ id: uid(), name, created: Date.now() });
  }
  return decks;
}

function cleanDays(raw: Loose): Record<string, DayStats> {
  const days: Record<string, DayStats> = {};
  if (isObj(raw.days)) {
    for (const [k, v] of Object.entries(raw.days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !isObj(v)) continue;
      const reviews = clampInt(v.reviews, 0, 1e6, 0);
      days[k] = { reviews, correct: Math.min(reviews, clampInt(v.correct, 0, 1e6, 0)), focus: clampInt(v.focus, 0, 1e4, 0) };
    }
  }
  // v1 kept only today's Pomodoro count in `pomo`.
  if (isObj(raw.pomo) && /^\d{4}-\d{2}-\d{2}$/.test(str(raw.pomo.date))) {
    const k = str(raw.pomo.date);
    const prev = days[k] ?? { reviews: 0, correct: 0, focus: 0 };
    days[k] = { ...prev, focus: Math.max(prev.focus, clampInt(raw.pomo.count, 0, 1e4, 0)) };
  }
  return days;
}

/** Coerce anything (localStorage, backup file, sync) into valid v2 AppData, migrating v1 and dropping broken items. */
export function normalize(raw: unknown): AppData {
  const b = blankData();
  const d = isObj(raw) ? raw : {};
  const settings = isObj(d.settings) ? d.settings : {};
  const prefs = isObj(d.prefs) ? d.prefs : {};
  const decks = cleanDecks(d);
  const deckIds = new Set(decks.map((x) => x.id));
  const deckByName = new Map(decks.map((x) => [x.name.toLowerCase(), x.id]));
  const reminder = str(prefs.reminder);
  return {
    version: 2,
    cards: cleanList(d.cards, (c) => cleanCard(c, deckIds, deckByName)),
    decks,
    notes: cleanList(d.notes, cleanNote),
    palace: cleanList(d.palace, cleanStop),
    days: cleanDays(d),
    settings: {
      focus: clampInt(settings.focus, 1, 120, b.settings.focus),
      short: clampInt(settings.short, 1, 60, b.settings.short),
      long: clampInt(settings.long, 1, 60, b.settings.long),
    },
    prefs: { typeAnswer: prefs.typeAnswer === true, reminder: /^([01]\d|2[0-3]):[0-5]\d$/.test(reminder) ? reminder : "" },
    updatedAt: num(d.updatedAt, 0),
  };
}

export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : blankData();
  } catch {
    return blankData();
  }
}

export function saveLocal(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}
