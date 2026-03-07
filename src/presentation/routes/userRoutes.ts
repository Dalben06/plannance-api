import { Router } from "express";
import type { UserService } from "../../application/services/userService.js";
import { validateBody } from "../middleware/validate.js";
import { createUserSchema } from "../../domain/validators/userSchemas.js";
import { createUser } from "../handlers/userHandler.js";

export const createUserRouter = (service: UserService): Router => {
  const router = Router();
  router.post("/users", validateBody(createUserSchema), createUser(service));
  return router;
};
