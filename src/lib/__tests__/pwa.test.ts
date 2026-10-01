import { describe, expect, it } from "vitest";
import { reminderDue } from "../pwa";

const at = (h: number, m = 0) => new Date(2026, 9, 1, h, m);

describe("reminderDue", () => {
  it("fires after the set time when cards are due, once per day", () => {
    expect(reminderDue("19:30", 5, at(19, 29))).toBe(false);
    expect(reminderDue("19:30", 5, at(19, 30))).toBe(true);
    expect(reminderDue("19:30", 5, at(22), "2026-10-01")).toBe(false);
    expect(reminderDue("19:30", 5, at(22), "2026-09-30")).toBe(true);
  });
  it("stays quiet when off or nothing is due", () => {
    expect(reminderDue("", 5, at(22))).toBe(false);
    expect(reminderDue("07:00", 0, at(22))).toBe(false);
  });
});
