import { CryptoAsset } from "../../entities/CryptoAsset";
import { IExternalDataProvider } from "../shared/IExternalDataProvider";

/**
 * Consulta tipada para el proveedor de activos financieros.
 */
export interface CryptoProviderQuery {
  limit: number;
  vsCurrency: string;
}

/**
 * Puerto específico: es sólo una especialización del genérico
 * IExternalDataProvider<Query, Result>.
 */
export type ICryptoProvider = IExternalDataProvider<CryptoProviderQuery, CryptoAsset[]>;
