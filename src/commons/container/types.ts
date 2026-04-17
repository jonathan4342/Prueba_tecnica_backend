
export const TYPES = {
  // Config / infraestructura compartida
  AppConfig: Symbol.for("AppConfig"),
  DataSource: Symbol.for("DataSource"),

  // Puertos de salida (adapters )
  UserRepository: Symbol.for("IUserRepository"),
  CryptoQueryLogRepository: Symbol.for("ICryptoQueryLogRepository"),
  CryptoProvider: Symbol.for("ICryptoProvider"),
  TokenService: Symbol.for("ITokenService"),
  PasswordHasher: Symbol.for("IPasswordHasher"),

  // Puertos de entrada (casos de uso)
  GetTopCryptoAssetsUseCase: Symbol.for("IGetTopCryptoAssetsUseCase"),
  RegisterUserUseCase: Symbol.for("IRegisterUserUseCase"),
  LoginUserUseCase: Symbol.for("ILoginUserUseCase"),

  // Presentación: presenters
  CryptoAssetPresenter: Symbol.for("CryptoAssetPresenter"),
  AuthPresenter: Symbol.for("AuthPresenter"),

  // Presentación: controllers
  CryptoController: Symbol.for("CryptoController"),
  AuthController: Symbol.for("AuthController"),
  HealthController: Symbol.for("HealthController"),

  // Middlewares
  AuthMiddleware: Symbol.for("AuthMiddleware")
} as const;
