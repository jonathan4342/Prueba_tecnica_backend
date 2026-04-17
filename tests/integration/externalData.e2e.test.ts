import "reflect-metadata";
import request from "supertest";
import { Container } from "inversify";
import { Application } from "express";

import { buildApp } from "../../src/presentation/server";
import { TYPES } from "../../src/commons/container/types";
import { AuthMiddleware } from "../../src/presentation/middlewares/authMiddleware";

import { GetTopCryptoAssetsUseCase } from "../../src/application/use-cases/GetTopCryptoAssetsUseCase";
import { RegisterUserUseCase } from "../../src/application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../../src/application/use-cases/LoginUserUseCase";

import { CryptoAssetPresenter } from "../../src/presentation/presenters/CryptoAssetPresenter";
import { AuthPresenter } from "../../src/presentation/presenters/AuthPresenter";
import { CryptoController } from "../../src/presentation/controllers/CryptoController";
import { AuthController } from "../../src/presentation/controllers/AuthController";
import { HealthController } from "../../src/presentation/controllers/HealthController";

import { CryptoAsset } from "../../src/domain/entities/CryptoAsset";
import { User } from "../../src/domain/entities/User";
import { ICryptoProvider } from "../../src/domain/ports/out/ICryptoProvider";
import {
  CryptoQueryLog,
  ICryptoQueryLogRepository
} from "../../src/domain/ports/out/ICryptoQueryLogRepository";
import { IUserRepository } from "../../src/domain/ports/out/IUserRepository";
import { IPasswordHasher } from "../../src/domain/ports/out/IPasswordHasher";
import {
  IssuedToken,
  ITokenService,
  TokenPayload
} from "../../src/domain/ports/out/ITokenService";

/**
 * Test de integración end-to-end.
 *
 * Construimos un Container de Inversify con implementaciones
 * in-memory de TODOS los puertos: sin red, sin DB, sin jsonwebtoken real.
 * Esto sólo es posible porque nuestras clases dependen de interfaces
 * y las resolvemos a través del contenedor.
 */

class InMemoryUserRepo implements IUserRepository {
  private store = new Map<string, User>();
  async findByEmail(email: string) {
    for (const u of this.store.values()) if (u.email === email) return u;
    return null;
  }
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findAll() {
    return Array.from(this.store.values());
  }
  async delete(id: string) {
    this.store.delete(id);
  }
  async save(user: User) {
    this.store.set(user.id, user);
    return user;
  }
}

class InMemoryLogRepo implements ICryptoQueryLogRepository {
  public saved: CryptoQueryLog[] = [];
  async findById() {
    return null;
  }
  async findAll() {
    return this.saved;
  }
  async delete() {
    /* noop */
  }
  async save(log: CryptoQueryLog) {
    const stored = { ...log, id: `log-${this.saved.length + 1}`, createdAt: new Date() };
    this.saved.push(stored);
    return stored;
  }
}

const providerStub: ICryptoProvider = {
  fetch: jest.fn(async ({ limit, vsCurrency }) => {
    const now = new Date("2026-04-16T10:00:00Z");
    return Array.from(
      { length: limit },
      (_, i) =>
        new CryptoAsset(
          `coin-${i}`,
          `c${i}`,
          `Coin ${i}`,
          1000 - i,
          vsCurrency,
          i + 1,
          i % 2 === 0 ? 1.5 : -0.5,
          now
        )
    );
  })
};

const fakeHasher: IPasswordHasher = {
  async hash(plain) {
    return `hashed:${plain}`;
  },
  async compare(plain, hashed) {
    return hashed === `hashed:${plain}`;
  }
};

// "Token" trivial: payload JSON en base64, sin crypto real.
const fakeTokens: ITokenService = {
  sign(payload: TokenPayload): IssuedToken {
    const token = Buffer.from(JSON.stringify(payload)).toString("base64");
    return { token, expiresIn: "1h" };
  },
  verify(token: string): TokenPayload {
    try {
      const json = Buffer.from(token, "base64").toString("utf8");
      const parsed = JSON.parse(json);
      if (!parsed?.sub || !parsed?.email) throw new Error();
      return { sub: String(parsed.sub), email: String(parsed.email) };
    } catch {
      throw new Error("bad token");
    }
  }
};

const buildTestApp = (): { app: Application; userRepo: InMemoryUserRepo } => {
  const container = new Container({ defaultScope: "Singleton" });
  const userRepo = new InMemoryUserRepo();

  container.bind(TYPES.AppConfig).toConstantValue({
    coingecko: { defaultVsCurrency: "usd" },
    jwt: { secret: "test", expiresIn: "1h" }
  });
  container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(userRepo);
  container
    .bind<ICryptoQueryLogRepository>(TYPES.CryptoQueryLogRepository)
    .toConstantValue(new InMemoryLogRepo());
  container.bind<ICryptoProvider>(TYPES.CryptoProvider).toConstantValue(providerStub);
  container.bind<IPasswordHasher>(TYPES.PasswordHasher).toConstantValue(fakeHasher);
  container.bind<ITokenService>(TYPES.TokenService).toConstantValue(fakeTokens);

  container.bind(TYPES.GetTopCryptoAssetsUseCase).to(GetTopCryptoAssetsUseCase);
  container.bind(TYPES.RegisterUserUseCase).to(RegisterUserUseCase);
  container.bind(TYPES.LoginUserUseCase).to(LoginUserUseCase);

  container.bind(TYPES.CryptoAssetPresenter).to(CryptoAssetPresenter);
  container.bind(TYPES.AuthPresenter).to(AuthPresenter);
  container.bind(TYPES.CryptoController).to(CryptoController);
  container.bind(TYPES.AuthController).to(AuthController);
  container.bind(TYPES.HealthController).to(HealthController);
  container.bind(TYPES.AuthMiddleware).to(AuthMiddleware);

  const app = buildApp(container);
  return { app, userRepo };
};

describe("GET /external-data", () => {
  it("rechaza la petición sin token JWT", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/external-data");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("devuelve los datos transformados cuando hay token válido", async () => {
    const { app } = buildTestApp();
    const token = fakeTokens.sign({ sub: "user-1", email: "t@t.com" }).token;
    const res = await request(app)
      .get("/external-data?limit=3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    const first = res.body[0];
    expect(first).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        symbol: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        currency: "USD",
        trend: expect.stringMatching(/up|down|flat/),
        lastUpdated: expect.any(String)
      })
    );
    // La capa de presentación puso el símbolo en mayúsculas.
    expect(first.symbol).toBe(first.symbol.toUpperCase());
  });
});

describe("POST /auth/register y /auth/login", () => {
  it("registra un usuario y permite login", async () => {
    const { app } = buildTestApp();

    const reg = await request(app)
      .post("/auth/register")
      .send({ email: "a@b.com", password: "secret123" });
    expect(reg.status).toBe(201);
    expect(reg.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email: "a@b.com",
        message: expect.any(String)
      })
    );

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "a@b.com", password: "secret123" });
    expect(login.status).toBe(200);
    expect(login.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        tokenType: "Bearer",
        expiresIn: expect.any(String)
      })
    );
  });

  it("rechaza credenciales inválidas", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "missing@example.com", password: "secret123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /health", () => {
  it("responde ok", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
