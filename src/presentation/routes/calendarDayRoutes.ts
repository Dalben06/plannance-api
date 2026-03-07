import { Router } from "express";
import type { AuthService } from "../../application/services/authService.js";
import {
  calendarDayQuerySchema
} from "../../domain/validators/calendarEventSchemas.js";
import { validateQuery } from "../middleware/validate.js";
import { CalendarDayService } from "../../application/services/calendarDayService.js";
import { listCalendarDayHandler } from "../handlers/calendarDaysHandlers.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const createCalendarDaysRouter = (
  service: CalendarDayService,
  authService: AuthService
): Router => {
  const router = Router();

  router.use(requireAuth(authService));

  router.get(
    "/calendar-day",
    validateQuery(calendarDayQuerySchema),
    listCalendarDayHandler(service)
  );

  return router;
};
