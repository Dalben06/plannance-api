import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import type { ForecastEventService } from "../../application/services/forecastEventService.js";
import {
  createForecastEventHandler,
  deleteForecastEventHandler,
  getForecastEventByIdHandler,
  listForecastEventsHandler,
  updateForecastEventHandler,
} from "../handlers/forecastEventHandlers.js";
import {
  forecastEventCreateSchema,
  forecastEventUpdateSchema,
} from "../../domain/validators/forecastEventSchemas.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validate.js";

export const createForecastEventRouter = (
  service: ForecastEventService,
  authService: AuthService
): Router => {
  const router = Router();

  router.use(requireAuth(authService));

  router.get("/forecast", listForecastEventsHandler(service));
  router.get("/forecast/:id", getForecastEventByIdHandler(service));
  router.post(
    "/forecast",
    validateBody(forecastEventCreateSchema),
    createForecastEventHandler(service)
  );
  router.put(
    "/forecast/:id",
    validateBody(forecastEventUpdateSchema),
    updateForecastEventHandler(service)
  );
  router.delete("/forecast/:id", deleteForecastEventHandler(service));

  return router;
};
