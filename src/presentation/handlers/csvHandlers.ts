import type { NextFunction, Request, Response } from "express";
import type { CsvService } from "../../application/services/csvService.js";
import type { CsvMappingService } from "../../application/services/csvMappingService.js";
import type { CsvMappingTemplateCreate } from "../../domain/csv.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) {
    throw new HttpError("Authentication required", 401);
  }
  return req.authUser.id;
};

export const mapCsvColumnsHandler =
  (service: CsvService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new HttpError("No file provided", 400);
      }
      const result = await service.mapColumns(req.file.buffer);
      res.json({ columns: result.columns });
    } catch (error) {
      next(error);
    }
  };

export const listCsvMappingsHandler =
  (service: CsvMappingService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const mappings = await service.listMappings(userId);
      res.json({ data: mappings });
    } catch (error) {
      next(error);
    }
  };

export const saveCsvMappingHandler =
  (service: CsvMappingService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const input = req.body as CsvMappingTemplateCreate;
      const created = await service.saveMapping(userId, input);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  };
