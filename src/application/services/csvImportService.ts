import { randomUUID } from "node:crypto";
import type { CsvMappingService } from "./csvMappingService.js";
import type { CsvImportRepository } from "../ports/csvImportRepository.js";
import type { CsvImportResult, CsvImportRow, CsvImportErrorRow } from "../../domain/csvImport.js";
import { csvImportRowSchema } from "../../domain/validators/csvImportSchemas.js";
import { parseRawRows } from "../../utils/csvParser.js";
import { HttpError } from "../../presentation/middleware/errorHandler.js";

export type CsvImportService = {
  listPendingImports(userId: string): Promise<CsvImportResult[]>;
  importCsv(userId: string, fileBuffer: Buffer, templateId: string): Promise<CsvImportResult>;
};

export const createCsvImportService = (
  mappingService: CsvMappingService,
  importRepo: CsvImportRepository
): CsvImportService => ({
  async listPendingImports(userId) {
    const imports = await importRepo.findAllByUser(userId);
    if (imports.length === 0) {
      throw new HttpError("No pending imports found", 404);
    }
    return imports;
  },

  async importCsv(userId, fileBuffer, templateId) {
    const template = await mappingService.findById(templateId);
    if (!template || template.userId !== userId) {
      throw new HttpError("Invalid templateId", 400);
    }

    let rawRows: string[][];
    try {
      rawRows = await parseRawRows(fileBuffer);
    } catch {
      throw new HttpError("Invalid or corrupted CSV file", 400);
    }

    if (rawRows.length < 2) {
      throw new HttpError("File needs at least one register", 400);
    }

    const [headerRow, ...dataRows] = rawRows;
    const headers = headerRow!;

    const columnIndexMap = new Map<string, number>();
    headers.forEach((name, idx) => columnIndexMap.set(name, idx));

    const fieldExtractors = template.mappings.map((m) => ({
      csvIndex: columnIndexMap.get(m.from),
      targetField: m.to,
    }));

    const validRows: CsvImportRow[] = [];
    const errorRows: CsvImportErrorRow[] = [];

    for (const [rowIdx, row] of dataRows.entries()) {
      const rawObj: Record<string, unknown> = {};
      for (const ext of fieldExtractors) {
        if (ext.csvIndex !== undefined) {
          rawObj[ext.targetField] = row[ext.csvIndex] ?? "";
        }
      }

      const result = csvImportRowSchema.safeParse(rawObj);
      if (result.success) {
        const amount = result.data.amount;
        validRows.push({
          id: randomUUID(),
          title: result.data.title,
          start: result.data.startAt,
          amount,
          type: amount >= 0 ? "debit" : "credit",
        });
      } else {
        const rawAmount = String(rawObj.amount ?? "");
        const parsedAmount = rawAmount.trim() === "" ? Number.NaN : Number(rawAmount);
        errorRows.push({
          id: randomUUID(),
          line: rowIdx + 1,
          title: String(rawObj.title ?? ""),
          start: String(rawObj.startAt ?? ""),
          amount: Number.isFinite(parsedAmount) ? parsedAmount : rawAmount,
          type: Number.isFinite(parsedAmount) ? (parsedAmount >= 0 ? "debit" : "credit") : null,
          errors: result.error.issues.map((i) => i.message),
        });
      }
    }

    const importResult: CsvImportResult = {
      id: randomUUID(),
      userId,
      errorsLines: errorRows,
      data: validRows,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    };

    return importRepo.save(importResult);
  },
});
