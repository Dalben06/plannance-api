import { Router } from "express";
import type { CsvService } from "../../application/services/csvService.js";
import { mapCsvColumnsHandler } from "../handlers/csvHandlers.js";
import { handleMulterError, uploadSingleCsv } from "../middleware/upload.js";

export const createCsvRouter = (service: CsvService): Router => {
  const router = Router();

  router.post("/csv/mapped", uploadSingleCsv, handleMulterError, mapCsvColumnsHandler(service));

  return router;
};
