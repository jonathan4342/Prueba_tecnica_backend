/**
 * View model para un activo financiero.
 * Ésta es la forma EXACTA que verá el cliente HTTP; desacopla la
 * entidad de dominio CryptoAsset de su representación externa.
 */
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
