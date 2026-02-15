import type { NextFunction, Request, Response } from "express";
import type { CalendarEventService } from "../../application/services/calendarEventService.js";
import type {
  CalendarEventCreate,
  CalendarEventUpdate,
  CalendarWeekStartsOn
} from "../../domain/calendarEvent.js";
import { HttpError } from "../middleware/errorHandler.js";

export const listCalendarEventsHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
      const month = typeof req.query.month === "string" ? req.query.month : undefined;
      const weekStartsOn = (typeof req.query.weekStartsOn === "number" ? Number(req.query.weekStartsOn) : 0) as CalendarWeekStartsOn ;
      const events = await service.listEvents({ userId, month, weekStartsOn });
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  };

export const getCalendarEventByIdHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await service.getEventById(req.params?.id ?? '');
      if (!event) {
        throw new HttpError("Calendar event not found", 404);
      }
      res.json({ data: event });
    } catch (error) {
      next(error);
    }
  };

export const createCalendarEventHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as CalendarEventCreate;
      const created = await service.createEvent(payload);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  };

export const updateCalendarEventHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as CalendarEventUpdate;
      const updated = await service.updateEvent(req.params?.id ?? '', payload);
      if (!updated) {
        throw new HttpError("Calendar event not found", 404);
      }
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

export const deleteCalendarEventHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteEvent(req.params?.id ?? '');
      if (!deleted) {
        throw new HttpError("Calendar event not found", 404);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
