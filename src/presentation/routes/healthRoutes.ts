import { Router } from "express";
import { HealthController } from "../controllers/HealthController";

export const buildHealthRouter = (controller: HealthController): Router => {
  const router = Router();
  router.get("/health", controller.check);
  return router;
};
