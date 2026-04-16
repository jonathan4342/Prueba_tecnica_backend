import { CryptoAsset } from "../../entities/CryptoAsset";
import { IUseCase } from "../shared/IUseCase";

export interface GetTopCryptoAssetsInput {
  limit: number;
  vsCurrency?: string;
  userId?: string | null;
}

export type IGetTopCryptoAssetsUseCase = IUseCase<GetTopCryptoAssetsInput, CryptoAsset[]>;
