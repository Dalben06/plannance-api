import { Router } from "express";
import { healthHandler } from "../handlers/healthHandler.js";

export const createHealthRouter = (): Router => {
  const router = Router();
  router.get("/health", healthHandler);
  return router;
};
