import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Validation error", details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: "Validation error", details: result.error.flatten() });
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
};
