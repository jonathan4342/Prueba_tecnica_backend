/**
 * Entidad / value object de dominio que representa un activo financiero
 * (criptomoneda) ya transformado para nuestros consumidores.
 *
 * Nótese que NO expone todos los campos que devuelve CoinGecko:
 * la transformación se hace en el servicio, cumpliendo el requisito
 * de "no devolver los datos tal cual".
 */
export class CryptoAsset {
  constructor(
    public readonly id: string,
    public readonly symbol: string,
    public readonly name: string,
    public readonly currentPrice: number,
    public readonly currency: string,
    public readonly marketCapRank: number | null,
    public readonly priceChangePercentage24h: number | null,
    public readonly lastUpdated: Date
  ) {}

  /**
   * Regla de dominio: decide si el activo está "en tendencia alcista"
   * (cambio porcentual de 24 h > 0). Sirve para ilustrar que la lógica
   * de negocio vive en el dominio, no en los controladores.
   */
  public isBullish(): boolean {
    return (this.priceChangePercentage24h ?? 0) > 0;
  }
}
