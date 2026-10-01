import { fsrs, type Card as FsrsCard, type FSRS, type Grade as FsrsGrade, State } from "ts-fsrs";
import type { Card, Grade, Srs } from "../types";
import { DAY, MINUTE } from "./utils";

export const createScheduler = (fuzz = true) => fsrs({ enable_fuzz: fuzz });
const defaultScheduler = createScheduler();

export const STATE_LABEL: Record<Srs["state"], string> = { 0: "Mới", 1: "Đang học", 2: "Ôn tập", 3: "Học lại" };
export const GRADE_LABEL: Record<Grade, string> = { 1: "Quên", 2: "Khó", 3: "Nhớ", 4: "Dễ" };

export function newSrs(): Srs {
  return { state: 0, stability: 0, difficulty: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0 };
}

function toFsrs(card: Card): FsrsCard {
  const s = card.srs;
  const last = s.lastReview;
  return {
    due: new Date(card.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: last ? Math.max(0, Math.floor((card.due - last) / DAY)) : 0,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: last ? new Date(last) : undefined,
  };
}

function fromFsrs(c: FsrsCard): { srs: Srs; due: number } {
  return {
    due: c.due.getTime(),
    srs: {
      state: c.state as Srs["state"],
      stability: c.stability,
      difficulty: c.difficulty,
      scheduledDays: c.scheduled_days,
      learningSteps: c.learning_steps,
      reps: c.reps,
      lapses: c.lapses,
      lastReview: c.last_review ? c.last_review.getTime() : undefined,
    },
  };
}

/** Apply a grade and return the rescheduled card. */
export function review(card: Card, grade: Grade, now = Date.now(), scheduler: FSRS = defaultScheduler): Card {
  const { card: next } = scheduler.next(toFsrs(card), new Date(now), grade as FsrsGrade);
  return { ...card, ...fromFsrs(next) };
}

/** Next due time for each possible grade (for labelling the buttons). */
export function preview(card: Card, now = Date.now(), scheduler: FSRS = defaultScheduler): Record<Grade, number> {
  const r = scheduler.repeat(toFsrs(card), new Date(now));
  return { 1: r[1].card.due.getTime(), 2: r[2].card.due.getTime(), 3: r[3].card.due.getTime(), 4: r[4].card.due.getTime() };
}

/** "1 phút", "10 phút", "3 giờ", "4 ngày", "2,5 tháng", "1,2 năm". */
export function formatInterval(ms: number) {
  const m = Math.max(1, Math.round(ms / MINUTE));
  if (m < 60) return `${m} phút`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.round(ms / DAY);
  if (d < 30) return `${d} ngày`;
  const fmt = (v: number) => (Math.round(v * 10) / 10).toLocaleString("vi-VN");
  if (d < 365) return `${fmt(d / 30)} tháng`;
  return `${fmt(d / 365)} năm`;
}

/** Leitner intervals of the old app (days), indexed by box. */
const LEITNER_DAYS = [0, 1, 3, 7, 14, 30];

/** Convert a v1 Leitner card to an FSRS state that roughly preserves its schedule. */
export function srsFromLeitner(box: number, due: number): Srs {
  if (box <= 1) return newSrs();
  const days = LEITNER_DAYS[Math.min(5, box)];
  return {
    state: 2,
    stability: days,
    difficulty: 5,
    scheduledDays: days,
    learningSteps: 0,
    reps: box - 1,
    lapses: 0,
    lastReview: due - days * DAY,
  };
}

