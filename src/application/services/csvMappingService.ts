import type { CsvMappingRepository } from "../ports/csvMappingRepository.js";
import type { CsvMappingTemplate, CsvMappingTemplateCreate } from "../../domain/csv.js";

export type CsvMappingService = {
  listMappings(userId: string): Promise<CsvMappingTemplate[]>;
  saveMapping(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate>;
};

export const createCsvMappingService = (repo: CsvMappingRepository): CsvMappingService => ({
  listMappings: (userId) => repo.findAllByUser(userId),
  saveMapping: (userId, input) => repo.save(userId, input),
});
