export type CalendarEventType = "debit" | "credit";
export type CalendarWeekStartsOn = 0 | 1;

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  start: string; // ISO datetime
  end: string | null;
  amount: number;
  type: CalendarEventType;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventCreate = {
  userId: string;
  title: string;
  start: string;
  end?: string | null;
  amount: number;
  type: CalendarEventType;
  color?: string | null;
};

export type CalendarEventCreateInput = Omit<CalendarEventCreate, "userId">;

export type CalendarEventUpdate = Partial<Omit<CalendarEventCreate, "userId">>;

export type CalendarEventFilters = {
  userId?: string;
  month?: string; // YYYY-MM
  weekStartsOn: CalendarWeekStartsOn;
};
