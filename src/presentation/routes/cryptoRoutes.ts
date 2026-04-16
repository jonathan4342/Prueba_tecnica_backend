import { RequestHandler, Router } from "express";
import { CryptoController } from "../controllers/CryptoController";

export const buildCryptoRouter = (
  controller: CryptoController,
  authMiddleware?: RequestHandler
): Router => {
  const router = Router();
  const handlers: RequestHandler[] = authMiddleware
    ? [authMiddleware, controller.getExternalData]
    : [controller.getExternalData];
  router.get("/external-data", ...handlers);
  return router;
};
