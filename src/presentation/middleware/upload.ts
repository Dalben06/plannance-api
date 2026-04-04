import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./errorHandler.js";

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSingleCsv = multerInstance.single("file");

export const handleMulterError = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new HttpError("File exceeds 5MB limit", 400));
    } else {
      next(new HttpError(`File upload error: ${err.message}`, 400));
    }
  } else {
    next(err);
  }
};
