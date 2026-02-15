import { vi } from "vitest";
import type { CalendarEventService } from "../src/application/services/calendarEventService.js";

export const buildMockCalendarEventService = (): CalendarEventService => ({
  listEvents: vi.fn(),
  getEventById: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn()
});
