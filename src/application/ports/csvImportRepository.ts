import type { CsvImportResult } from "../../domain/csvImport.js";

export interface CsvImportRepository {
  findAllByUser(userId: string): Promise<CsvImportResult[]>;
  save(importResult: CsvImportResult): Promise<CsvImportResult>;
}
