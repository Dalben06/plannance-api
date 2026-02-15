import type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventFilters,
  CalendarEventUpdate
} from "../../domain/calendarEvent.js";

export interface CalendarEventRepository {
  list(filters: CalendarEventFilters): Promise<CalendarEvent[]>;
  getById(id: string): Promise<CalendarEvent | null>;
  create(input: CalendarEventCreate): Promise<CalendarEvent>;
  update(id: string, input: CalendarEventUpdate): Promise<CalendarEvent | null>;
  delete(id: string): Promise<boolean>;
}
