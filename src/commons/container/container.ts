import "reflect-metadata";
import { Container } from "inversify";
import { DataSource } from "typeorm";

import { env } from "../../infrastructure/config/env";
import { AppDataSource } from "../../infrastructure/persistence/data-source";
import { CoinGeckoAdapter } from "../../infrastructure/external/CoinGeckoAdapter";
import { TypeOrmUserRepository } from "../../infrastructure/persistence/repositories/TypeOrmUserRepository";
import { TypeOrmCryptoQueryLogRepository } from "../../infrastructure/persistence/repositories/TypeOrmCryptoQueryLogRepository";
import { JwtTokenService } from "../../infrastructure/security/JwtTokenService";
import { BcryptPasswordHasher } from "../../infrastructure/security/BcryptPasswordHasher";
import { AuthMiddleware } from "../../presentation/middlewares/authMiddleware";

import { GetTopCryptoAssetsUseCase } from "../../application/use-cases/GetTopCryptoAssetsUseCase";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUserUseCase";

import { CryptoAssetPresenter } from "../../presentation/presenters/CryptoAssetPresenter";
import { AuthPresenter } from "../../presentation/presenters/AuthPresenter";
import { CryptoController } from "../../presentation/controllers/CryptoController";
import { AuthController } from "../../presentation/controllers/AuthController";
import { HealthController } from "../../presentation/controllers/HealthController";

import { IUserRepository } from "../../domain/ports/out/IUserRepository";
import { ICryptoQueryLogRepository } from "../../domain/ports/out/ICryptoQueryLogRepository";
import { ICryptoProvider } from "../../domain/ports/out/ICryptoProvider";
import { ITokenService } from "../../domain/ports/out/ITokenService";
import { IPasswordHasher } from "../../domain/ports/out/IPasswordHasher";
import { IGetTopCryptoAssetsUseCase } from "../../domain/ports/in/IGetTopCryptoAssetsUseCase";
import { IRegisterUserUseCase } from "../../domain/ports/in/IRegisterUserUseCase";
import { ILoginUserUseCase } from "../../domain/ports/in/ILoginUserUseCase";

import { TYPES } from "./types";

export const buildContainer = async (): Promise<Container> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const container = new Container({ defaultScope: "Singleton" });

  // Config y DataSource como valores constantes
  container.bind(TYPES.AppConfig).toConstantValue(env);
  container.bind<DataSource>(TYPES.DataSource).toConstantValue(AppDataSource);

  // Adaptadores driven (salida)
  container.bind<IUserRepository>(TYPES.UserRepository).to(TypeOrmUserRepository);
  container
    .bind<ICryptoQueryLogRepository>(TYPES.CryptoQueryLogRepository)
    .to(TypeOrmCryptoQueryLogRepository);
  container.bind<ICryptoProvider>(TYPES.CryptoProvider).to(CoinGeckoAdapter);
  container.bind<ITokenService>(TYPES.TokenService).to(JwtTokenService);
  container.bind<IPasswordHasher>(TYPES.PasswordHasher).to(BcryptPasswordHasher);

  // Casos de uso (driving ports)
  container
    .bind<IGetTopCryptoAssetsUseCase>(TYPES.GetTopCryptoAssetsUseCase)
    .to(GetTopCryptoAssetsUseCase);
  container.bind<IRegisterUserUseCase>(TYPES.RegisterUserUseCase).to(RegisterUserUseCase);
  container.bind<ILoginUserUseCase>(TYPES.LoginUserUseCase).to(LoginUserUseCase);

  // Presentación
  container.bind<CryptoAssetPresenter>(TYPES.CryptoAssetPresenter).to(CryptoAssetPresenter);
  container.bind<AuthPresenter>(TYPES.AuthPresenter).to(AuthPresenter);
  container.bind<CryptoController>(TYPES.CryptoController).to(CryptoController);
  container.bind<AuthController>(TYPES.AuthController).to(AuthController);
  container.bind<HealthController>(TYPES.HealthController).to(HealthController);

  // Middlewares
  container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

  return container;
};
