import type { CsvMappingTemplate, CsvMappingTemplateCreate } from "../../domain/csv.js";

export interface CsvMappingRepository {
  findById(id: string): Promise<CsvMappingTemplate | null>;
  findAllByUser(userId: string): Promise<CsvMappingTemplate[]>;
  save(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate>;
}
