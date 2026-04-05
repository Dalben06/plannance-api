import type { CsvMappingRepository } from "../ports/csvMappingRepository.js";
import type { CsvMappingTemplate, CsvMappingTemplateCreate } from "../../domain/csv.js";

export type CsvMappingService = {
  findById(id: string): Promise<CsvMappingTemplate | null>;
  listMappings(userId: string): Promise<CsvMappingTemplate[]>;
  saveMapping(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate>;
};

export const createCsvMappingService = (repo: CsvMappingRepository): CsvMappingService => ({
  findById: (id) => repo.findById(id),
  listMappings: (userId) => repo.findAllByUser(userId),
  saveMapping: (userId, input) => repo.save(userId, input),
});
