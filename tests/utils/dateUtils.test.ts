import { describe, expect, it } from "vitest";
import {
  isParsableDate,
  parseMonthRangeUtc,
  toMysqlDateTime,
  toIsoString,
  addDays,
  startOfMonth,
  isSameDay,
  startOfWeek,
} from "../../src/utils/date.js";

describe("isParsableDate", () => {
  it("returns true for a valid ISO date string", () => {
    expect(isParsableDate("2026-03-06")).toBe(true);
  });

  it("returns false for a non-date string", () => {
    expect(isParsableDate("not-a-date")).toBe(false);
  });
});

describe("parseMonthRangeUtc", () => {
  it("returns start and end for a valid YYYY-MM string", () => {
    const result = parseMonthRangeUtc("2026-03");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(new Date(Date.UTC(2026, 2, 1)));
    expect(result!.end).toEqual(new Date(Date.UTC(2026, 3, 1)));
  });

  it("start is UTC midnight day 1; end is UTC midnight day 1 of next month", () => {
    const result = parseMonthRangeUtc("2026-01");
    expect(result!.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(result!.end.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("works for December and wraps end to January of next year", () => {
    const result = parseMonthRangeUtc("2026-12");
    expect(result!.start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(result!.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("returns null for single-digit month format", () => {
    expect(parseMonthRangeUtc("2026-1")).toBeNull();
  });

  it("returns null for month > 12", () => {
    expect(parseMonthRangeUtc("2026-13")).toBeNull();
  });

  it("returns null for arbitrary string", () => {
    expect(parseMonthRangeUtc("foo")).toBeNull();
  });
});

describe("toMysqlDateTime", () => {
  it("returns correctly formatted UTC datetime string", () => {
    const date = new Date(Date.UTC(2026, 2, 6, 14, 30, 5));
    expect(toMysqlDateTime(date)).toBe("2026-03-06 14:30:05");
  });

  it("pads single-digit values with leading zeros", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    expect(toMysqlDateTime(date)).toBe("2026-01-01 00:00:00");
  });
});

describe("toIsoString", () => {
  it("returns null for null input", () => {
    expect(toIsoString(null)).toBeNull();
  });

  it("returns ISO string for a Date input", () => {
    const date = new Date(Date.UTC(2026, 2, 6, 12, 0, 0));
    expect(toIsoString(date)).toBe("2026-03-06T12:00:00.000Z");
  });

  it("returns ISO string for a valid date string input", () => {
    const result = toIsoString("2026-03-06T00:00:00.000Z");
    expect(result).toBe("2026-03-06T00:00:00.000Z");
  });
});

describe("addDays", () => {
  it("adds positive days correctly", () => {
    const base = new Date(2026, 0, 1);
    const result = addDays(base, 5);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(6);
  });

  it("returns the same date for 0 days", () => {
    const base = new Date(2026, 2, 15);
    const result = addDays(base, 0);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(2);
  });
});

describe("startOfMonth", () => {
  it("returns the 1st of the month", () => {
    const date = new Date(2026, 2, 15);
    const result = startOfMonth(date);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(2);
    expect(result.getFullYear()).toBe(2026);
  });
});

describe("isSameDay", () => {
  it("returns true for same calendar day with different times", () => {
    const a = new Date(2026, 0, 1, 10, 0, 0);
    const b = new Date(2026, 0, 1, 22, 0, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    const a = new Date(2026, 0, 1);
    const b = new Date(2026, 0, 2);
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe("startOfWeek", () => {
  // March 1, 2026 is a Sunday (day 0)
  it("weekStartsOn 0 — returns same day when already on Sunday", () => {
    const sunday = new Date(2026, 2, 1); // Mar 1
    const result = startOfWeek(sunday, 0);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(2);
  });

  it("weekStartsOn 1 — returns preceding Monday when date is Sunday", () => {
    const sunday = new Date(2026, 2, 1); // Mar 1 (Sunday)
    const result = startOfWeek(sunday, 1);
    expect(result.getDate()).toBe(23); // Feb 23
    expect(result.getMonth()).toBe(1);
  });

  it("weekStartsOn 0 — returns preceding Sunday for a Tuesday", () => {
    const tuesday = new Date(2026, 2, 3); // Mar 3
    const result = startOfWeek(tuesday, 0);
    expect(result.getDate()).toBe(1); // Mar 1 (Sunday)
    expect(result.getMonth()).toBe(2);
  });

  it("weekStartsOn 1 — returns same day when already on Monday", () => {
    const monday = new Date(2026, 1, 23); // Feb 23
    const result = startOfWeek(monday, 1);
    expect(result.getDate()).toBe(23);
    expect(result.getMonth()).toBe(1);
  });
});
