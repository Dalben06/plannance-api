import type { NextFunction, Request, Response } from "express";
import type { CalendarEventService } from "../../application/services/calendarEventService.js";
import type {
  CalendarEventCreateInput,
  CalendarEventUpdate,
  CalendarWeekStartsOn
} from "../../domain/calendarEvent.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) {
    throw new HttpError("Authentication required", 401);
  }

  return req.authUser.id;
};

const getWeekStartsOn = (rawValue: unknown): CalendarWeekStartsOn =>
  (rawValue === 1 || rawValue === "1" ? 1 : 0) as CalendarWeekStartsOn;

export const listCalendarEventsHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const month = typeof req.query.month === "string" ? req.query.month : undefined;
      const weekStartsOn = getWeekStartsOn(req.query.weekStartsOn);
      const events = await service.listEvents({ userId, month, weekStartsOn });
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  };

export const getCalendarEventByIdHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const event = await service.getEventById(req.params?.id ?? '');
      if (!event || event.userId !== userId) {
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
      const payload = req.body as CalendarEventCreateInput;
      const created = await service.createEvent({
        ...payload,
        userId: getAuthenticatedUserId(req)
      });
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  };

export const updateCalendarEventHandler = (service: CalendarEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const existing = await service.getEventById(req.params?.id ?? '');
      if (!existing || existing.userId !== userId) {
        throw new HttpError("Calendar event not found", 404);
      }

      const payload = req.body as CalendarEventUpdate;
      const updated = await service.updateEvent(existing.id, payload);
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
      const userId = getAuthenticatedUserId(req);
      const existing = await service.getEventById(req.params?.id ?? '');
      if (!existing || existing.userId !== userId) {
        throw new HttpError("Calendar event not found", 404);
      }

      const deleted = await service.deleteEvent(existing.id);
      if (!deleted) {
        throw new HttpError("Calendar event not found", 404);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
