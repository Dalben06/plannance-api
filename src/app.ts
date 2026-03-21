import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { createContainer, type AppContainerOverrides } from "./container.js";
import { createCalendarEventsRouter } from "./presentation/routes/calendarEventsRoutes.js";
import { createHealthRouter } from "./presentation/routes/healthRoutes.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";
import { createCalendarDaysRouter } from "./presentation/routes/calendarDayRoutes.js";
import { createAuthRouter } from "./presentation/routes/authRoutes.js";
import { createUserRouter } from "./presentation/routes/userRoutes.js";
import { createCsvRouter } from "./presentation/routes/csvRoutes.js";

export type AppDependencies = AppContainerOverrides;

export const createApp = (deps: AppDependencies = {}) => {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  const container = createContainer(deps);

  app.use("/api/v1", createHealthRouter());
  app.use("/api/v1", createUserRouter(container.userService));
  app.use("/api/v1", createAuthRouter(container.authService));
  app.use("/api/v1", createCsvRouter(container.csvService));
  app.use(
    "/api/v1",
    createCalendarEventsRouter(container.calendarEventService, container.authService)
  );
  app.use(
    "/api/v1",
    createCalendarDaysRouter(container.calendarDaysService, container.authService)
  );

  app.get("/", (_req, res) => {
    res.json({ message: "Plannance API up. See /api/v1/health" });
  });

  app.use(errorHandler);

  return app;
};
