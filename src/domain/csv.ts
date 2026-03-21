export type CsvColumnType = "string" | "number" | "boolean" | "date";
export type CsvColumn = { name: string; type: CsvColumnType };
export type CsvMappingResult = { columns: CsvColumn[] };
