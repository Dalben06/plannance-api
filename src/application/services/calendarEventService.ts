import type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventFilters,
  CalendarEventUpdate
} from "../../domain/calendarEvent.js";
import type { CalendarEventRepository } from "../ports/calendarEventRepository.js";

export type CalendarEventService = {
  listEvents(filters: CalendarEventFilters): Promise<CalendarEvent[]>;
  getEventById(id: string): Promise<CalendarEvent | null>;
  createEvent(input: CalendarEventCreate): Promise<CalendarEvent>;
  updateEvent(id: string, input: CalendarEventUpdate): Promise<CalendarEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
};

export const createCalendarEventService = (
  repository: CalendarEventRepository
): CalendarEventService => ({
  listEvents: (filters) => repository.list(filters),
  getEventById: (id) => repository.getById(id),
  createEvent: (input) => repository.create(input),
  updateEvent: (id, input) => repository.update(id, input),
  deleteEvent: (id) => repository.delete(id)
});
