import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation error", details: err.flatten() });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
