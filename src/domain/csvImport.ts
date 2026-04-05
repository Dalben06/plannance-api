import type { CalendarEventType } from "./calendarEvent.js";

export type CsvImportRow = {
  id: string;
  title: string;
  start: string;
  amount: number;
  type: CalendarEventType;
};

export type CsvImportErrorRow = {
  id: string;
  line: number;
  title: string;
  start: string;
  amount: number | string;
  type: CalendarEventType | null;
  errors: string[];
};

export type CsvImportResult = {
  id: string;
  userId: string;
  errorsLines: CsvImportErrorRow[];
  data: CsvImportRow[];
  createdAt: string;
  expiresAt: string;
};
