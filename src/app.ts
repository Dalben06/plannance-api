import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { createCalendarEventService, type CalendarEventService } from "./application/services/calendarEventService.js";
import { MysqlCalendarEventRepository } from "./infrastructure/repositories/mysqlCalendarEventRepository.js";
import { getPool } from "./db/mysql.js";
import { createCalendarEventsRouter } from "./presentation/routes/calendarEventsRoutes.js";
import { createHealthRouter } from "./presentation/routes/healthRoutes.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";
import { CalendarDayService, createCalendarDayService } from "./application/services/calendarDayService.js";
import { createCalendarDaysRouter } from "./presentation/routes/calendarDayRoutes.js";

export type AppDependencies = {
  calendarEventService?: CalendarEventService;
  calendarDaysService?: CalendarDayService
};

export const createApp = (deps: AppDependencies = {}) => {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  const calendarEventService =
    deps.calendarEventService ??
    createCalendarEventService(new MysqlCalendarEventRepository(getPool()));

  const calendarDaysService =
    deps.calendarDaysService ??
    createCalendarDayService(new MysqlCalendarEventRepository(getPool()));

  app.use("/api/v1", createHealthRouter());
  app.use("/api/v1", createCalendarEventsRouter(calendarEventService));
  app.use("/api/v1", createCalendarDaysRouter(calendarDaysService));

  app.get("/", (_req, res) => {
    res.json({ message: "Plannance API up. See /api/v1/health" });
  });

  app.use(errorHandler);

  return app;
};
