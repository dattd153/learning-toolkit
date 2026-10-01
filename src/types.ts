export type TabId = "methods" | "feynman" | "cards" | "pomo" | "palace";

export interface Card {
  id: string;
  front: string;
  back: string;
  topic: string;
  /** Leitner box, 1–5. */
  box: number;
  /** Epoch ms when the card is next due. */
  due: number;
  created: number;
}

/** Shape returned by Claude when it plays the 12-year-old student. */
export interface Feedback {
  diem: number | string;
  nhan_xet: string;
  cho_chua_ro?: string[];
  cau_hoi?: string[];
  vi_du_goi_y?: string;
}

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
}

export interface AppData {
  cards: Card[];
  notes: Note[];
  palace: PalaceStop[];
  pomo: { date: string; count: number };
  settings: Settings;
  prefs: Prefs;
  updatedAt: number;
}

/** File format written by "Sao lưu". */
export interface BackupFile {
  app: "hop-cong-cu-ghi-nho";
  version: 1;
  exportedAt: string;
  data: AppData;
}
