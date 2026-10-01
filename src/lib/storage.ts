import type { AppData, Card, Note, PalaceStop } from "../types";
import { uid } from "./utils";

/** Same key as the original single-file app, so existing data carries over. */
const STORAGE_KEY = "mtk-state";

export const blankData = (): AppData => ({
  cards: [],
  notes: [],
  palace: [],
  pomo: { date: "", count: 0 },
  settings: { focus: 25, short: 5, long: 15 },
  prefs: { typeAnswer: false },
  updatedAt: 0,
});

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, Math.round(num(v, fallback))));

function cleanCard(v: unknown): Card | null {
  if (!isObj(v) || !str(v.front).trim() || !str(v.back).trim()) return null;
  const now = Date.now();
  return {
    id: str(v.id) || uid(),
    front: str(v.front),
    back: str(v.back),
    topic: str(v.topic),
    box: clampInt(v.box, 1, 5, 1),
    due: num(v.due, now),
    created: num(v.created, now),
  };
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

/** Coerce anything (localStorage, backup file, account sync) into valid AppData, dropping broken items. */
export function normalize(raw: unknown): AppData {
  const b = blankData();
  const d = isObj(raw) ? raw : {};
  const pomo = isObj(d.pomo) ? d.pomo : {};
  const settings = isObj(d.settings) ? d.settings : {};
  const prefs = isObj(d.prefs) ? d.prefs : {};
  return {
    cards: cleanList(d.cards, cleanCard),
    notes: cleanList(d.notes, cleanNote),
    palace: cleanList(d.palace, cleanStop),
    pomo: { date: str(pomo.date), count: clampInt(pomo.count, 0, 1e6, 0) },
    settings: {
      focus: clampInt(settings.focus, 1, 120, b.settings.focus),
      short: clampInt(settings.short, 1, 60, b.settings.short),
      long: clampInt(settings.long, 1, 60, b.settings.long),
    },
    prefs: { typeAnswer: prefs.typeAnswer === true },
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
