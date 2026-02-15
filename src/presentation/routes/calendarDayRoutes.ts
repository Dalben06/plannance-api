import { Router } from "express";
import {
  calendarEventQuerySchema,
} from "../../domain/validators/calendarEventSchemas.js";
import { validateQuery } from "../middleware/validate.js";
import { CalendarDayService } from "../../application/services/calendarDayService.js";
import { listCalendarDayHandler } from "../handlers/calendarDaysHanlders.js";

export const createCalendarDaysRouter = (service: CalendarDayService): Router => {
  const router = Router();

  router.get(
    "/calendar-day",
    validateQuery(calendarEventQuerySchema),
    listCalendarDayHandler(service)
  );

  return router;
};
