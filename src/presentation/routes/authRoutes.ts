import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import { authFormSchema } from "../../domain/validators/authSchemas.js";
import { authenticate, getCurrentUserHandler } from "../handlers/authHandlers.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";

export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();

  router.post("/auth/login", validateBody(authFormSchema), authenticate(authService));
  router.get("/auth/me", requireAuth(authService), getCurrentUserHandler);

  return router;
};
