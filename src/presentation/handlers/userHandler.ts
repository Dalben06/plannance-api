import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../../application/services/userService.js";

export const createUser =
  (service: UserService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await service.create(req.body);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  };
