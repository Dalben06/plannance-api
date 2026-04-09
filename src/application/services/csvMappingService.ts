import type { CsvMappingRepository } from "../ports/csvMappingRepository.js";
import type { CsvMappingTemplate, CsvMappingTemplateCreate } from "../../domain/csv.js";
import { HttpError } from "../../presentation/middleware/errorHandler.js";

export type CsvMappingService = {
  findById(id: string): Promise<CsvMappingTemplate | null>;
  getMappingById(id: string, userId: string): Promise<CsvMappingTemplate>;
  listMappings(userId: string): Promise<CsvMappingTemplate[]>;
  saveMapping(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate>;
  updateMapping(
    id: string,
    userId: string,
    input: CsvMappingTemplateCreate
  ): Promise<CsvMappingTemplate>;
};

export const createCsvMappingService = (repo: CsvMappingRepository): CsvMappingService => ({
  findById: (id) => repo.findById(id),

  getMappingById: async (id, userId) => {
    const template = await repo.findById(id);
    if (!template || template.userId !== userId) {
      throw new HttpError("Mapping not found", 400);
    }
    return template;
  },

  listMappings: (userId) => repo.findAllByUser(userId),

  saveMapping: (userId, input) => repo.save(userId, input),

  updateMapping: async (id, userId, input) => {
    const updated = await repo.update(id, userId, input);
    if (!updated) {
      throw new HttpError("Mapping not found", 400);
    }
    return updated;
  },
});
