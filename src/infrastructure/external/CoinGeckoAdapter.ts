import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "inversify";
import { CryptoAsset } from "../../domain/entities/CryptoAsset";
import {
  CryptoProviderQuery,
  ICryptoProvider
} from "../../domain/ports/out/ICryptoProvider";
import { ExternalServiceError } from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

interface CoinGeckoMarketResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap_rank: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string;
}

@injectable()
export class CoinGeckoAdapter implements ICryptoProvider {
  private readonly http: AxiosInstance;

  constructor(
    @inject(TYPES.AppConfig)
    config: { coingecko: { baseUrl: string } }
  ) {
    this.http = axios.create({
      baseURL: config.coingecko.baseUrl,
      timeout: 10_000,
      headers: { Accept: "application/json" }
    });
  }

  public async fetch(query: CryptoProviderQuery): Promise<CryptoAsset[]> {
    try {
      const { data } = await this.http.get<CoinGeckoMarketResponse[]>(
        "/coins/markets",
        {
          params: {
            vs_currency: query.vsCurrency,
            order: "market_cap_desc",
            per_page: query.limit,
            page: 1,
            sparkline: false,
            price_change_percentage: "24h"
          }
        }
      );

      return data.map(
        (raw) =>
          new CryptoAsset(
            raw.id,
            raw.symbol,
            raw.name,
            raw.current_price,
            query.vsCurrency,
            raw.market_cap_rank,
            raw.price_change_percentage_24h,
            raw.last_updated ? new Date(raw.last_updated) : new Date()
          )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido consultando CoinGecko";
      throw new ExternalServiceError(`CoinGecko: ${message}`);
    }
  }
}
