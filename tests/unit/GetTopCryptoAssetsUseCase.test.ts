import "reflect-metadata";
import { GetTopCryptoAssetsUseCase } from "../../src/application/use-cases/GetTopCryptoAssetsUseCase";
import { CryptoAsset } from "../../src/domain/entities/CryptoAsset";
import { ICryptoProvider } from "../../src/domain/ports/out/ICryptoProvider";
import {
  CryptoQueryLog,
  ICryptoQueryLogRepository
} from "../../src/domain/ports/out/ICryptoQueryLogRepository";
import { ValidationError } from "../../src/shared/errors/AppError";

/**
 * Ventaja de la arquitectura + interfaces genéricas:
 * probamos el caso de uso con mocks triviales de los puertos.
 * No hay Express, ni axios, ni TypeORM, ni Inversify.
 */
describe("GetTopCryptoAssetsUseCase (unit)", () => {
  const buildProvider = (assets: CryptoAsset[]): ICryptoProvider => ({
    fetch: jest.fn().mockResolvedValue(assets)
  });

  const buildLogRepo = (): ICryptoQueryLogRepository => ({
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
    save: jest.fn().mockImplementation(async (l: CryptoQueryLog) => ({
      ...l,
      id: "log-1",
      createdAt: new Date()
    }))
  });

  const config = { coingecko: { defaultVsCurrency: "usd" } };

  it("retorna los activos del proveedor y registra la consulta", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const sample = [
      new CryptoAsset("bitcoin", "btc", "Bitcoin", 60000, "usd", 1, 2.5, now),
      new CryptoAsset("ethereum", "eth", "Ethereum", 3500, "usd", 2, -1.2, now)
    ];
    const provider = buildProvider(sample);
    const logs = buildLogRepo();
    const useCase = new GetTopCryptoAssetsUseCase(provider, logs, config);

    const result = await useCase.execute({ limit: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Bitcoin");
    expect(provider.fetch).toHaveBeenCalledWith({ limit: 2, vsCurrency: "usd" });
  });

  it("rechaza limit fuera de rango", async () => {
    const useCase = new GetTopCryptoAssetsUseCase(
      buildProvider([]),
      buildLogRepo(),
      config
    );
    await expect(useCase.execute({ limit: 0 })).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute({ limit: 101 })).rejects.toBeInstanceOf(ValidationError);
  });

  it("usa la divisa pasada por parámetro (normalizada a minúsculas)", async () => {
    const provider = buildProvider([]);
    const useCase = new GetTopCryptoAssetsUseCase(provider, buildLogRepo(), config);
    await useCase.execute({ limit: 5, vsCurrency: "EUR" });
    expect(provider.fetch).toHaveBeenCalledWith({ limit: 5, vsCurrency: "eur" });
  });
});

describe("CryptoAsset.isBullish", () => {
  it("true cuando el cambio 24h es positivo", () => {
    const asset = new CryptoAsset("a", "a", "A", 1, "usd", 1, 5, new Date());
    expect(asset.isBullish()).toBe(true);
  });
  it("false cuando el cambio 24h es negativo o nulo", () => {
    const flat = new CryptoAsset("b", "b", "B", 1, "usd", 1, null, new Date());
    const down = new CryptoAsset("c", "c", "C", 1, "usd", 1, -0.1, new Date());
    expect(flat.isBullish()).toBe(false);
    expect(down.isBullish()).toBe(false);
  });
});
