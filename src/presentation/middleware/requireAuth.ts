import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../../application/services/authService.js";
import { AuthenticationError } from "../../domain/auth.js";
import { HttpError } from "./errorHandler.js";

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const requireAuth = (authService: AuthService) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const accessToken = getBearerToken(req.header("authorization"));

    if (!accessToken) {
      next(new HttpError("Authentication required", 401));
      return;
    }

    try {
      req.authUser = authService.verifyAccessToken(accessToken);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        next(new HttpError(error.message, 401));
        return;
      }

      next(error);
    }
  };
