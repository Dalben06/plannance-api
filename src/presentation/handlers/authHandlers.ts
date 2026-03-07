import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../../application/services/authService.js";
import { AuthenticationError } from "../../domain/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

export const authenticate =
  (authService: AuthService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await authService.authenticate(req.body);
      res.json({ data: session });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        next(new HttpError(error.message, 401));
        return;
      }
      next(error);
    }
  };

export const getCurrentUserHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.authUser) {
    next(new HttpError("Authentication required", 401));
    return;
  }
  res.json({ data: req.authUser });
};
