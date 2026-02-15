import { Router } from "express";
import type { CalendarEventService } from "../../application/services/calendarEventService.js";
import {
  createCalendarEventHandler,
  deleteCalendarEventHandler,
  getCalendarEventByIdHandler,
  listCalendarEventsHandler,
  updateCalendarEventHandler
} from "../handlers/calendarEventsHandlers.js";
import {
  calendarEventCreateSchema,
  calendarEventQuerySchema,
  calendarEventUpdateSchema
} from "../../domain/validators/calendarEventSchemas.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

export const createCalendarEventsRouter = (service: CalendarEventService): Router => {
  const router = Router();

  router.get(
    "/calendar-events",
    validateQuery(calendarEventQuerySchema),
    listCalendarEventsHandler(service)
  );
  router.get("/calendar-events/:id", getCalendarEventByIdHandler(service));
  router.post(
    "/calendar-events",
    validateBody(calendarEventCreateSchema),
    createCalendarEventHandler(service)
  );
  router.put(
    "/calendar-events/:id",
    validateBody(calendarEventUpdateSchema),
    updateCalendarEventHandler(service)
  );
  router.delete("/calendar-events/:id", deleteCalendarEventHandler(service));

  return router;
};
