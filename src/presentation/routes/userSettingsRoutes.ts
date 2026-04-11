import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import type { UserSettingsService } from "../../application/services/userSettingsService.js";
import {
  createUserSettingsHandler,
  getUserSettingsHandler,
  updateUserSettingsHandler,
} from "../handlers/userSettingsHandlers.js";
import {
  createUserSettingsSchema,
  updateUserSettingsSchema,
} from "../../domain/validators/userSettingsSchemas.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";

export const createUserSettingsRouter = (
  service: UserSettingsService,
  authService: AuthService
): Router => {
  const router = Router();
  router.use(requireAuth(authService));
  router.get("/users/settings", getUserSettingsHandler(service));
  router.post(
    "/users/settings",
    validateBody(createUserSettingsSchema),
    createUserSettingsHandler(service)
  );
  router.put(
    "/users/settings",
    validateBody(updateUserSettingsSchema),
    updateUserSettingsHandler(service)
  );
  return router;
};
