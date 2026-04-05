import type { CsvImportResult } from "../../domain/csvImport.js";

export interface CsvImportRepository {
  findAllByUser(userId: string): Promise<CsvImportResult[]>;
  findById(id: string): Promise<CsvImportResult | null>;
  save(importResult: CsvImportResult): Promise<CsvImportResult>;
  update(importResult: CsvImportResult): Promise<CsvImportResult>;
  delete(id: string): Promise<boolean>;
}
