export type CsvColumnType = "string" | "number" | "boolean" | "date";
export type CsvColumn = { name: string; type: CsvColumnType };
export type CsvMappingResult = { columns: CsvColumn[] };

export const calendarEventFields = ["title", "amount", "type", "startAt"] as const;
export type CalendarEventField = (typeof calendarEventFields)[number];

export type CsvColumnMapping = { from: string; to: CalendarEventField };

export type CsvMappingTemplate = {
  id: string;
  userId: string;
  name: string;
  mappings: CsvColumnMapping[];
  createdAt: string;
  updatedAt: string;
};

export type CsvMappingTemplateCreate = {
  name: string;
  mappings: CsvColumnMapping[];
};
