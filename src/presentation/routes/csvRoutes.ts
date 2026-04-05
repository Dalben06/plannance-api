import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import type { CsvService } from "../../application/services/csvService.js";
import type { CsvMappingService } from "../../application/services/csvMappingService.js";
import type { CsvImportService } from "../../application/services/csvImportService.js";
import {
  confirmImportHandler,
  getImportById,
  importCsvHandler,
  listCsvMappingsHandler,
  listPendingImportsHandler,
  mapCsvColumnsHandler,
  saveCsvMappingHandler,
  updateImportHandler,
} from "../handlers/csvHandlers.js";
import { handleMulterError, uploadSingleCsv } from "../middleware/upload.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import { saveCsvMappingSchema } from "../../domain/validators/csvSchemas.js";
import { csvImportUpdateSchema } from "../../domain/validators/csvImportSchemas.js";

export const createCsvRouter = (
  service: CsvService,
  mappingService: CsvMappingService,
  importService: CsvImportService,
  authService: AuthService
): Router => {
  const router = Router();

  router.post(
    "/csv/mapped",
    requireAuth(authService),
    uploadSingleCsv,
    handleMulterError,
    mapCsvColumnsHandler(service)
  );

  router.get("/csv/mapping", requireAuth(authService), listCsvMappingsHandler(mappingService));
  router.post(
    "/csv/mapping",
    requireAuth(authService),
    validateBody(saveCsvMappingSchema),
    saveCsvMappingHandler(mappingService)
  );

  router.get("/csv/import", requireAuth(authService), listPendingImportsHandler(importService));

  router.get("/csv/import/:id", requireAuth(authService), getImportById(importService));

  router.put(
    "/csv/import",
    requireAuth(authService),
    validateBody(csvImportUpdateSchema),
    updateImportHandler(importService)
  );

  router.post(
    "/csv/import",
    requireAuth(authService),
    uploadSingleCsv,
    handleMulterError,
    importCsvHandler(importService)
  );

  router.post("/csv/confirm/:id", requireAuth(authService), confirmImportHandler(importService));

  return router;
};
