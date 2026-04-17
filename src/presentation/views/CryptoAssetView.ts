
export interface CryptoAssetView {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  rank: number | null;
  change24hPercent: number | null;
  trend: "up" | "down" | "flat";
  lastUpdated: string;
}
