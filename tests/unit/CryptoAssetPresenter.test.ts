import "reflect-metadata";
import { CryptoAssetPresenter } from "../../src/presentation/presenters/CryptoAssetPresenter";
import { CryptoAsset } from "../../src/domain/entities/CryptoAsset";

/**
 * Prueba aislada del presenter. Demuestra que la capa de presentación
 * se puede testear sin HTTP, sin casos de uso y sin el contenedor.
 */
describe("CryptoAssetPresenter (unit)", () => {
  const presenter = new CryptoAssetPresenter();

  it("convierte CryptoAsset en CryptoAssetView con símbolo y moneda en mayúsculas", () => {
    const asset = new CryptoAsset(
      "bitcoin",
      "btc",
      "Bitcoin",
      60000,
      "usd",
      1,
      2.5,
      new Date("2026-04-16T10:00:00Z")
    );
    const view = presenter.present(asset);
    expect(view).toEqual({
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      price: 60000,
      currency: "USD",
      rank: 1,
      change24hPercent: 2.5,
      trend: "up",
      lastUpdated: "2026-04-16T10:00:00.000Z"
    });
  });

  it("calcula la tendencia correctamente", () => {
    const build = (change: number | null) =>
      new CryptoAsset("x", "x", "X", 1, "usd", 1, change, new Date());
    expect(presenter.present(build(1)).trend).toBe("up");
    expect(presenter.present(build(-1)).trend).toBe("down");
    expect(presenter.present(build(0)).trend).toBe("flat");
    expect(presenter.present(build(null)).trend).toBe("flat");
  });

  it("presentMany mapea una lista", () => {
    const asset = new CryptoAsset("a", "a", "A", 1, "usd", 1, 1, new Date());
    expect(presenter.presentMany([asset, asset])).toHaveLength(2);
  });
});
