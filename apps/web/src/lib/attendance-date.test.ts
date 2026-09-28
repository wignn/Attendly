import { describe, expect, it } from "vitest";
import { getScheduleWeekday, getTodayJakartaDate } from "./attendance-date";

describe("getTodayJakartaDate", () => {
  it("returns the current date in Asia/Jakarta, including UTC date rollover", () => {
    expect(getTodayJakartaDate(new Date("2026-09-28T17:30:00.000Z"))).toBe("2026-09-29");
  });

  it("maps selected dates to the API weekday format and rejects invalid dates", () => {
    expect(getScheduleWeekday("2026-09-28")).toBe(1);
    expect(getScheduleWeekday("2026-10-04")).toBe(7);
    expect(getScheduleWeekday("2026-02-30")).toBeUndefined();
  });
});
