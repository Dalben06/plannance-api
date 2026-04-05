import { describe, expect, it, vi } from "vitest";
import { createCalendarDayService } from "../../../src/application/services/calendarDayService.js";
import type { CalendarEventRepository } from "../../../src/application/ports/calendarEventRepository.js";
import type { CalendarEvent } from "../../../src/domain/calendarEvent.js";

const sampleEvent: CalendarEvent = {
  id: "1",
  userId: "user-123",
  title: "Salary",
  // Use noon UTC so local date is March 5 in any timezone (UTC-12 to UTC+12)
  start: "2026-03-05T12:00:00.000Z",
  amount: 1000,
  type: "credit",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const buildMockRepo = (): CalendarEventRepository => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("CalendarDayService", () => {
  it("throws when month is missing", async () => {
    const repo = buildMockRepo();
    const service = createCalendarDayService(repo);

    await expect(service.listMonthSummary({ weekStartsOn: 0 } as never)).rejects.toThrow(
      "Month is required!"
    );
  });

  it("throws when weekStartsOn is null", async () => {
    const repo = buildMockRepo();
    const service = createCalendarDayService(repo);

    await expect(
      service.listMonthSummary({ month: "2026-03", weekStartsOn: null as never })
    ).rejects.toThrow("weekStartsOn is required!");
  });

  it("returns a 42-element array when no events exist", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    expect(result).toHaveLength(42);
    result.forEach((day) => {
      expect(day.events).toHaveLength(0);
      expect(day.expense).toBe(0);
      expect(day.income).toBe(0);
    });
  });

  it("grid starts on Sunday for weekStartsOn 0", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    // Grid must start on a Sunday regardless of timezone
    expect(result[0]!.date.getDay()).toBe(0);
  });

  it("grid starts on Monday for weekStartsOn 1", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 1 });

    // Grid must start on a Monday regardless of timezone
    expect(result[0]!.date.getDay()).toBe(1);
  });

  it("aggregates income for credit events on the correct day", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([{ ...sampleEvent, type: "credit", amount: 500 }]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    // sampleEvent.start is noon UTC March 5 — local date is March 5 in all common timezones
    const eventDate = new Date(sampleEvent.start);
    const march5 = result.find(
      (d) =>
        d.date.getFullYear() === eventDate.getFullYear() &&
        d.date.getMonth() === eventDate.getMonth() &&
        d.date.getDate() === eventDate.getDate()
    );
    expect(march5).toBeDefined();
    expect(march5!.income).toBe(500);
    expect(march5!.expense).toBe(0);
    expect(march5!.events).toHaveLength(1);
  });

  it("aggregates expense for debit events on the correct day", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([{ ...sampleEvent, type: "debit", amount: 200 }]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    const eventDate = new Date(sampleEvent.start);
    const march5 = result.find(
      (d) =>
        d.date.getFullYear() === eventDate.getFullYear() &&
        d.date.getMonth() === eventDate.getMonth() &&
        d.date.getDate() === eventDate.getDate()
    );
    expect(march5!.expense).toBe(200);
    expect(march5!.income).toBe(0);
  });

  it("skips events with null start without crashing", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.list).mockResolvedValue([{ ...sampleEvent, start: null as unknown as string }]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    expect(result).toHaveLength(42);
    expect(result.every((d) => d.events.length === 0)).toBe(true);
  });

  it("skips events whose date falls outside the 42-day grid", async () => {
    const repo = buildMockRepo();
    // An event in a completely different month
    vi.mocked(repo.list).mockResolvedValue([{ ...sampleEvent, start: "2025-01-01T00:00:00.000Z" }]);
    const service = createCalendarDayService(repo);

    const result = await service.listMonthSummary({ month: "2026-03", weekStartsOn: 0 });

    expect(result.every((d) => d.events.length === 0)).toBe(true);
  });
});
