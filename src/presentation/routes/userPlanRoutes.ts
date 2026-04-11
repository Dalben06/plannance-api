import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import type { UserPlanService } from "../../application/services/userPlanService.js";
import {
  getUserPlanHandler,
  createUserPlanHandler,
  upsertUserPlanHandler,
} from "../handlers/userPlanHandlers.js";
import { userPlanBodySchema } from "../../domain/validators/userPlanSchemas.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";

export const createUserPlanRouter = (
  service: UserPlanService,
  authService: AuthService
): Router => {
  const router = Router();
  router.use(requireAuth(authService));
  router.get("/users/plan", getUserPlanHandler(service));
  router.post("/users/plan", validateBody(userPlanBodySchema), createUserPlanHandler(service));
  router.put("/users/plan", validateBody(userPlanBodySchema), upsertUserPlanHandler(service));
  return router;
};
