import { randomUUID } from "node:crypto";
import type { CsvMappingService } from "./csvMappingService.js";
import type { CsvImportRepository } from "../ports/csvImportRepository.js";
import type {
  CsvImportResult,
  CsvImportRow,
  CsvImportErrorRow,
  CsvImportUpdate,
} from "../../domain/csvImport.js";
import type { CalendarEventRepository } from "../ports/calendarEventRepository.js";
import type { CsvConfirmResult } from "../../domain/calendarEvent.js";
import {
  csvImportRowSchema,
  csvImportUpdateSchema,
} from "../../domain/validators/csvImportSchemas.js";
import { parseRawRows } from "../../utils/csvParser.js";
import { HttpError } from "../../presentation/middleware/errorHandler.js";

export type CsvImportService = {
  listPendingImports(userId: string): Promise<CsvImportResult[]>;
  importCsv(userId: string, fileBuffer: Buffer, templateId: string): Promise<CsvImportResult>;
  updateImport(userId: string, input: CsvImportUpdate): Promise<CsvImportResult>;
  confirmImport(userId: string, importId: string): Promise<CsvConfirmResult>;
};

const normalizeDate = (dateStr: string): string => new Date(dateStr).toISOString().slice(0, 10);

export const createCsvImportService = (
  mappingService: CsvMappingService,
  importRepo: CsvImportRepository,
  calendarEventRepo: CalendarEventRepository
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
          amount: amount < 0 ? amount * -1 : amount,
          type: amount >= 0 ? "credit" : "debit",
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
          type: Number.isFinite(parsedAmount) ? (parsedAmount >= 0 ? "credit" : "debit") : null,
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

  async updateImport(userId, input) {
    const parsedInput = csvImportUpdateSchema.safeParse(input);
    if (!parsedInput.success) {
      throw new HttpError("Validation error", 400);
    }

    const existing = await importRepo.findById(parsedInput.data.id);
    if (!existing || existing.userId !== userId) {
      throw new HttpError("Import not found", 404);
    }

    const normalizedData = parsedInput.data.data.map((row) => {
      const parsedRow = csvImportRowSchema.safeParse({
        title: row.title,
        startAt: row.start,
        amount: String(row.amount),
        type: row.type,
      });
      if (!parsedRow.success) {
        throw new HttpError("Validation error", 400);
      }

      const amount = parsedRow.data.amount;
      return {
        id: row.id,
        title: parsedRow.data.title,
        start: parsedRow.data.startAt,
        amount: amount < 0 ? amount * -1 : amount,
        type: row.type,
      };
    });

    const updated: CsvImportResult = {
      ...existing,
      data: normalizedData,
      errorsLines: parsedInput.data.errorsLines,
    };

    return importRepo.update(updated);
  },

  async confirmImport(userId, importId) {
    const existing = await importRepo.findById(importId);
    if (!existing || existing.userId !== userId) {
      throw new HttpError("Import not found", 400);
    }

    if (existing.errorsLines && existing.errorsLines.length > 0) {
      throw new HttpError("Import still has validation errors", 400);
    }

    const total = existing.data.length;

    if (total === 0) {
      await importRepo.delete(importId);
      return { inserted: 0, duplicates: 0, total: 0 };
    }

    const dates = existing.data.map((row) => row.start);
    const sorted = [...dates].sort();
    const earliest = sorted[0]!;
    const latest = sorted[sorted.length - 1]!;

    const existingEvents = await calendarEventRepo.list({
      userId,
      dateRange: { start: earliest, end: latest },
    });

    const existingKeys = new Set(
      existingEvents.map((e) => `${e.title}|${normalizeDate(e.start)}|${e.amount}`)
    );

    const newRows = existing.data.filter(
      (row) => !existingKeys.has(`${row.title}|${normalizeDate(row.start)}|${row.amount}`)
    );

    if (newRows.length > 0) {
      await calendarEventRepo.createMany(
        newRows.map((row) => ({
          userId,
          title: row.title,
          start: row.start,
          amount: row.amount,
          type: row.type,
        }))
      );
    }

    await importRepo.delete(importId);

    return {
      inserted: newRows.length,
      duplicates: total - newRows.length,
      total,
    };
  },
});
