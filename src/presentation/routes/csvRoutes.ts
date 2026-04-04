import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import type { CsvService } from "../../application/services/csvService.js";
import type { CsvMappingService } from "../../application/services/csvMappingService.js";
import {
  listCsvMappingsHandler,
  mapCsvColumnsHandler,
  saveCsvMappingHandler,
} from "../handlers/csvHandlers.js";
import { handleMulterError, uploadSingleCsv } from "../middleware/upload.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import { saveCsvMappingSchema } from "../../domain/validators/csvSchemas.js";

export const createCsvRouter = (
  service: CsvService,
  mappingService: CsvMappingService,
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

  return router;
};
