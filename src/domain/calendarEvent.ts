export type CalendarEventType = "debit" | "credit";
export type CalendarWeekStartsOn = 0 | 1;

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  start: string; // ISO datetime
  amount: number;
  type: CalendarEventType;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventCreate = {
  userId: string;
  title: string;
  start: string;
  amount: number;
  type: CalendarEventType;
};

export type CalendarEventCreateInput = Omit<CalendarEventCreate, "userId">;

export type CalendarEventUpdate = Partial<Omit<CalendarEventCreate, "userId">>;

export type CalendarEventFilters = {
  userId?: string;
  month?: string; // YYYY-MM
  weekStartsOn: CalendarWeekStartsOn;
};
