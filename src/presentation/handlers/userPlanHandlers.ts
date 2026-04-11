import type { NextFunction, Request, Response } from "express";
import type { UserPlanService } from "../../application/services/userPlanService.js";
import type {
  UserPlan,
  UserPlanCreateInput,
  UserPlanUpdate,
  UserPlanView,
} from "../../domain/userPlan.js";
import { HttpError } from "../middleware/errorHandler.js";

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.authUser) throw new HttpError("Authentication required", 401);
  return req.authUser.id;
};

export const getUserPlanHandler =
  (service: UserPlanService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const plan = await service.getPlan(userId);
      if (!plan) throw new HttpError("User plan not found", 404);

      res.json({ data: mapToView(plan) });
    } catch (error) {
      next(error);
    }
  };

export const createUserPlanHandler =
  (service: UserPlanService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const payload = req.body as UserPlanCreateInput;

      const existing = await service.getPlan(userId);
      if (existing) throw new HttpError("User plan already exists", 409);

      const created = await service.createPlan({ ...payload, userId });
      res.status(201).json({ data: mapToView(created) });
    } catch (error) {
      next(error);
    }
  };

export const upsertUserPlanHandler =
  (service: UserPlanService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const payload = req.body as UserPlanUpdate;
      const result = await service.upsertPlan(userId, payload);
      res.json({ data: mapToView(result) });
    } catch (error) {
      next(error);
    }
  };

const mapToView = (plan: UserPlan): UserPlanView => ({
  budget: plan.budget,
  notifyFixedEventOnDay: plan.notifyFixedEventOnDay,
  reminderImportRegister: plan.reminderImportRegister,
});
