import type { NextFunction, Request, Response } from "express";
import type { ForecastEventService } from "../../application/services/forecastEventService.js";
import type { ForecastEventCreateInput, ForecastEventUpdate } from "../../domain/forecastEvent.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) {
    throw new HttpError("Authentication required", 401);
  }
  return req.authUser.id;
};

export const listForecastEventsHandler =
  (service: ForecastEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const data = await service.listForecasts(userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

export const getForecastEventByIdHandler =
  (service: ForecastEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const forecast = await service.getForecastById(req.params?.id ?? "", userId);
      if (!forecast) {
        throw new HttpError("Forecast event not found", 404);
      }
      res.json({ data: forecast });
    } catch (error) {
      next(error);
    }
  };

export const createForecastEventHandler =
  (service: ForecastEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const payload = req.body as ForecastEventCreateInput;
      const created = await service.createForecast(userId, payload);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  };

export const updateForecastEventHandler =
  (service: ForecastEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const payload = req.body as ForecastEventUpdate;
      const updated = await service.updateForecast(req.params?.id ?? "", userId, payload);
      if (!updated) {
        throw new HttpError("Forecast event not found", 404);
      }
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

export const deleteForecastEventHandler =
  (service: ForecastEventService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const deleted = await service.deleteForecast(req.params?.id ?? "", userId);
      if (!deleted) {
        throw new HttpError("Forecast event not found", 404);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
