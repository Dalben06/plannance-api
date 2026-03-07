import type { NextFunction, Request, Response } from "express";
import type { CalendarWeekStartsOn } from "../../domain/calendarEvent.js";
import { CalendarDayService } from "../../application/services/calendarDayService.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) {
    throw new HttpError("Authentication required", 401);
  }

  return req.authUser.id;
};

const getWeekStartsOn = (rawValue: unknown): CalendarWeekStartsOn =>
  (rawValue === 1 || rawValue === "1" ? 1 : 0) as CalendarWeekStartsOn;

export const listCalendarDayHandler =
  (service: CalendarDayService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const month = typeof req.query.month === "string" ? req.query.month : undefined;
      const weekStartsOn = getWeekStartsOn(req.query.weekStartsOn);
      const events = await service.listMonthSummary({ userId, month, weekStartsOn });
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  };
