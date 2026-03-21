import type { NextFunction, Request, Response } from "express";
import type { CsvService } from "../../application/services/csvService.js";
import { HttpError } from "../middleware/errorHandler.js";

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
