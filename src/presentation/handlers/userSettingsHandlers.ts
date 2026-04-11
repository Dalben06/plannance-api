import type { NextFunction, Request, Response } from "express";
import type { UserSettingsService } from "../../application/services/userSettingsService.js";
import type { UserSettingsUpdate, UserSettingsView } from "../../domain/userSettings.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) throw new HttpError("Authentication required", 401);
  return req.authUser.id;
};

const toView = (settings: {
  phoneNumber: string;
  isDarkMode: boolean;
  notifyByEmail: boolean;
  notifyByMessage: boolean;
}): UserSettingsView => ({
  phoneNumber: settings.phoneNumber,
  isDarkMode: settings.isDarkMode,
  notifyByEmail: settings.notifyByEmail,
  notifyByMessage: settings.notifyByMessage,
});

export const getUserSettingsHandler =
  (service: UserSettingsService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const settings = await service.getByUserId(userId);
      if (!settings) throw new HttpError("User settings not found", 404);
      res.json({ data: toView(settings) });
    } catch (error) {
      next(error);
    }
  };

export const createUserSettingsHandler =
  (service: UserSettingsService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const existing = await service.getByUserId(userId);
      if (existing) throw new HttpError("User settings already exist", 409);

      const payload = req.body as UserSettingsUpdate;
      const created = await service.create({
        ...payload,
        userId,
      });
      res.status(201).json({ data: toView(created) });
    } catch (error) {
      next(error);
    }
  };

export const updateUserSettingsHandler =
  (service: UserSettingsService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const payload = req.body as UserSettingsUpdate;
      const updated = await service.update(userId, payload);
      if (!updated) throw new HttpError("User settings not found", 404);
      res.json({ data: toView(updated) });
    } catch (error) {
      next(error);
    }
  };
