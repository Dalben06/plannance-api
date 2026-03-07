import type { NextFunction, Request, Response } from "express";
import { UserService } from "../../application/services/userService.js";

export const createUser =
  (service: UserService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await service.create(req.body);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  };
