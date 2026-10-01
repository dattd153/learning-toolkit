import type { AppData, Card } from "../types";
import { todayKey } from "../lib/utils";

export const dueCards = (cards: Card[], now = Date.now()) => cards.filter((c) => (c.due || 0) <= now);

export const pomoToday = (data: AppData) => (data.pomo.date === todayKey() ? data.pomo.count : 0);
