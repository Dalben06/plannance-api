import type { CsvMappingTemplate, CsvMappingTemplateCreate } from "../../domain/csv.js";

export interface CsvMappingRepository {
  findAllByUser(userId: string): Promise<CsvMappingTemplate[]>;
  save(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate>;
}
