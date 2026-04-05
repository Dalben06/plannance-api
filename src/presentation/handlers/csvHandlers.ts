import type { NextFunction, Request, Response } from "express";
import type { CsvService } from "../../application/services/csvService.js";
import type { CsvMappingService } from "../../application/services/csvMappingService.js";
import type { CsvImportService } from "../../application/services/csvImportService.js";
import type { CsvMappingTemplateCreate } from "../../domain/csv.js";
import type { CsvImportUpdate } from "../../domain/csvImport.js";
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

export const listPendingImportsHandler =
  (service: CsvImportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const imports = await service.listPendingImports(userId);
      res.json({ data: imports });
    } catch (error) {
      next(error);
    }
  };

export const updateImportHandler =
  (service: CsvImportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const input = req.body as CsvImportUpdate;
      const result = await service.updateImport(userId, input);
      res.json({
        id: result.id,
        errorsLines: result.errorsLines,
        data: result.data,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  };

export const importCsvHandler =
  (service: CsvImportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!req.file) {
        throw new HttpError("No file provided", 400);
      }
      const templateId = req.body?.templateId;
      if (!templateId || typeof templateId !== "string") {
        throw new HttpError("templateId is required", 400);
      }
      const result = await service.importCsv(userId, req.file.buffer, templateId);
      res.status(201).json({
        id: result.id,
        errorsLines: result.errorsLines,
        data: result.data,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  };

export const confirmImportHandler =
  (service: CsvImportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      if (!id) {
        throw new HttpError("Import ID is required", 400);
      }
      const result = await service.confirmImport(userId, id);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

export const getImportById =
  (service: CsvImportService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      if (!id) {
        throw new HttpError("Import ID is required", 400);
      }
      const result = await service.getImportById(userId, id);
      res.json({
        id: result.id,
        errorsLines: result.errorsLines,
        data: result.data,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  };
