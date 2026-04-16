import { injectable } from "inversify";
import { CryptoAsset } from "../../domain/entities/CryptoAsset";
import { IPresenter } from "../shared/IPresenter";
import { CryptoAssetView } from "../views/CryptoAssetView";

/**
 * Implementa la interfaz genérica IPresenter<CryptoAsset, CryptoAssetView>.
 * Es el único sitio donde se decide cómo se formatea el activo hacia el cliente.
 */
@injectable()
export class CryptoAssetPresenter implements IPresenter<CryptoAsset, CryptoAssetView> {
  public present(asset: CryptoAsset): CryptoAssetView {
    return {
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: asset.name,
      price: asset.currentPrice,
      currency: asset.currency.toUpperCase(),
      rank: asset.marketCapRank,
      change24hPercent: asset.priceChangePercentage24h,
      trend: this.trendOf(asset.priceChangePercentage24h),
      lastUpdated: asset.lastUpdated.toISOString()
    };
  }

  public presentMany(assets: CryptoAsset[]): CryptoAssetView[] {
    return assets.map((a) => this.present(a));
  }

  private trendOf(change: number | null): CryptoAssetView["trend"] {
    if (change == null) return "flat";
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "flat";
  }
}
