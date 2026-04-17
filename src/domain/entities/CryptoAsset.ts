
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


  public isBullish(): boolean {
    return (this.priceChangePercentage24h ?? 0) > 0;
  }
}
