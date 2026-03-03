import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import { googleAuthSchema } from "../../domain/validators/authSchemas.js";
import { authenticateWithGoogleHandler, getCurrentUserHandler } from "../handlers/authHandlers.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";

export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();

  router.post(
    "/auth/google",
    validateBody(googleAuthSchema),
    authenticateWithGoogleHandler(authService)
  );
  router.get("/auth/me", requireAuth(authService), getCurrentUserHandler);

  return router;
};
