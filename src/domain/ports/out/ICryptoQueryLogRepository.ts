import { IRepository } from "../shared/IRepository";

/**
 * Modelo de dominio para un log de consulta al endpoint externo.
 */
export interface CryptoQueryLog {
  id?: string;
  userId: string | null;
  limit: number;
  vsCurrency: string;
  itemsReturned: number;
  createdAt?: Date;
}

/**
 * Repositorio genérico para los logs. No necesita consultas específicas
 * más allá del contrato genérico IRepository.
 */
export type ICryptoQueryLogRepository = IRepository<CryptoQueryLog, string>;
