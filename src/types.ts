export type TabId = "methods" | "feynman" | "cards" | "pomo" | "palace" | "stats";

/** FSRS memory state (mirrors ts-fsrs Card, with dates as epoch ms). */
export interface Srs {
  /** 0 New, 1 Learning, 2 Review, 3 Relearning. */
  state: 0 | 1 | 2 | 3;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  lastReview?: number;
}

/** 1 Quên (Again), 2 Khó (Hard), 3 Nhớ (Good), 4 Dễ (Easy). */
export type Grade = 1 | 2 | 3 | 4;

export interface Card {
  id: string;
  deckId: string;
  /** For cloze cards: the full text containing {{...}} markers. */
  front: string;
  /** Answer; optional extra notes for cloze cards. */
  back: string;
  /** Free-form label (e.g. the Feynman concept a card came from). */
  topic: string;
  kind: "basic" | "cloze";
  /** Which {{...}} (0-based) this cloze card hides. */
  clozeIndex?: number;
  /** Epoch ms when the card is next due. */
  due: number;
  created: number;
  srs: Srs;
}

export interface Deck {
  id: string;
  name: string;
  created: number;
}

export interface DayStats {
  reviews: number;
  /** Reviews graded Khó/Nhớ/Dễ (recalled). */
  correct: number;
  /** Completed Pomodoro focus sessions. */
  focus: number;
}

/** Shape returned by Claude when it plays the 12-year-old student. */
export type { FeedbackJson as Feedback } from "../shared/prompts";
import type { FeedbackJson as Feedback } from "../shared/prompts";

export interface Note {
  id: string;
  concept: string;
  text: string;
  gaps: string;
  updated: number;
  feedback?: Feedback;
}

export interface PalaceStop {
  id: string;
  place: string;
  item: string;
  image: string;
}

export interface Settings {
  focus: number;
  short: number;
  long: number;
}

export interface Prefs {
  /** Require typing an answer before a flashcard can be flipped. */
  typeAnswer: boolean;
  /** Daily reminder time "HH:MM", or "" when off. */
  reminder: string;
}

export interface AppData {
  /** Data model version (2 = FSRS + decks). */
  version: 2;
  cards: Card[];
  decks: Deck[];
  notes: Note[];
  palace: PalaceStop[];
  /** Activity per local day, keyed "YYYY-MM-DD". */
  days: Record<string, DayStats>;
  settings: Settings;
  prefs: Prefs;
  updatedAt: number;
}

/** File format written by "Sao lưu". */
export interface BackupFile {
  app: "hop-cong-cu-ghi-nho";
  version: 2;
  exportedAt: string;
  data: AppData;
}
