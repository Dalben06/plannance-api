import type { CsvColumn, CsvColumnType, CsvMappingResult } from "../../domain/csv.js";
import { HttpError } from "../../presentation/middleware/errorHandler.js";
import { isParsableDate } from "../../utils/date.js";
import { parseRawRows } from "../../utils/csvParser.js";

const inferType = (values: string[]): CsvColumnType => {
  if (values.length === 0) return "string";
  if (values.every((v) => isFinite(Number(v)))) return "number";
  if (values.every((v) => v.toLowerCase() === "true" || v.toLowerCase() === "false"))
    return "boolean";
  if (values.every((v) => isParsableDate(v))) return "date";
  return "string";
};

export type CsvService = {
  mapColumns(fileBuffer: Buffer): Promise<CsvMappingResult>;
};

export const createCsvService = (): CsvService => ({
  async mapColumns(fileBuffer: Buffer): Promise<CsvMappingResult> {
    let rawRows: string[][];
    try {
      rawRows = await parseRawRows(fileBuffer);
    } catch {
      throw new HttpError("Invalid or corrupted CSV file", 400);
    }

    if (rawRows.length === 0) {
      return { columns: [] };
    }

    const [headerRow, ...dataRows] = rawRows;
    const headers = headerRow!;
    const columns: CsvColumn[] = headers.map((name, idx) => {
      const values = dataRows.map((row) => row[idx] ?? "").filter((v) => v.trim() !== "");
      return { name, type: inferType(values) };
    });

    return { columns };
  },
});
