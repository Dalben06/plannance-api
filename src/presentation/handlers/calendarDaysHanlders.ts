import type { NextFunction, Request, Response } from "express";
import type {
    CalendarWeekStartsOn
} from "../../domain/calendarEvent.js";
import { CalendarDayService } from "../../application/services/calendarDayService.js";

export const listCalendarDayHandler = (service: CalendarDayService) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
            const month = typeof req.query.month === "string" ? req.query.month : undefined;
            const weekStartsOn = (typeof req.query.weekStartsOn === "number" ? Number(req.query.weekStartsOn) : 0) as CalendarWeekStartsOn;
            const events = await service.listMonthSummary({ userId, month, weekStartsOn });
            res.json({ data: events });
        } catch (error) {
            next(error);
        }
    };




