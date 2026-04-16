import express, { Application, RequestHandler } from "express";
import { Container } from "inversify";
import { AuthController } from "./controllers/AuthController";
import { CryptoController } from "./controllers/CryptoController";
import { HealthController } from "./controllers/HealthController";
import { AuthMiddleware } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";
import { buildAuthRouter } from "./routes/authRoutes";
import { buildCryptoRouter } from "./routes/cryptoRoutes";
import { buildHealthRouter } from "./routes/healthRoutes";
import { TYPES } from "../commons/container/types";

export const buildApp = (container: Container): Application => {
  const app = express();
  app.use(express.json());

  const authController = container.get<AuthController>(TYPES.AuthController);
  const cryptoController = container.get<CryptoController>(TYPES.CryptoController);
  const healthController = container.get<HealthController>(TYPES.HealthController);
  const authMiddleware: RequestHandler = container
    .get<AuthMiddleware>(TYPES.AuthMiddleware)
    .handle;

  app.use("/", buildHealthRouter(healthController));
  app.use("/auth", buildAuthRouter(authController));
  // /external-data requiere autenticación JWT (middleware)
  app.use("/", buildCryptoRouter(cryptoController, authMiddleware));

  app.use(errorHandler);
  return app;
};
