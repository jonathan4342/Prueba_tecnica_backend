import { inject, injectable } from "inversify";
import { CryptoAsset } from "../../domain/entities/CryptoAsset";
import {
  GetTopCryptoAssetsInput,
  IGetTopCryptoAssetsUseCase
} from "../../domain/ports/in/IGetTopCryptoAssetsUseCase";
import { ICryptoProvider } from "../../domain/ports/out/ICryptoProvider";
import { ICryptoQueryLogRepository } from "../../domain/ports/out/ICryptoQueryLogRepository";
import { ValidationError } from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

/**
 * Caso de uso: obtener el top N de activos financieros.
 *
 * Implementa la interfaz genérica IUseCase<GetTopCryptoAssetsInput, CryptoAsset[]>
 * vía el alias IGetTopCryptoAssetsUseCase. Depende sólo de puertos, no
 * de clases concretas.
 */
@injectable()
export class GetTopCryptoAssetsUseCase implements IGetTopCryptoAssetsUseCase {
  constructor(
    @inject(TYPES.CryptoProvider) private readonly provider: ICryptoProvider,
    @inject(TYPES.CryptoQueryLogRepository)
    private readonly logRepository: ICryptoQueryLogRepository,
    @inject(TYPES.AppConfig)
    private readonly config: { coingecko: { defaultVsCurrency: string } }
  ) {}

  public async execute(input: GetTopCryptoAssetsInput): Promise<CryptoAsset[]> {
    const { limit } = input;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      throw new ValidationError("`limit` debe ser un entero entre 1 y 100");
    }
    const vsCurrency = (
      input.vsCurrency ?? this.config.coingecko.defaultVsCurrency
    ).toLowerCase();

    const assets = await this.provider.fetch({ limit, vsCurrency });

    // Fire-and-forget: no bloqueamos al usuario si falla la DB.
    this.logRepository
      .save({
        userId: input.userId ?? null,
        limit,
        vsCurrency,
        itemsReturned: assets.length
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[GetTopCryptoAssetsUseCase] log falló:", err);
      });

    return assets;
  }
}
