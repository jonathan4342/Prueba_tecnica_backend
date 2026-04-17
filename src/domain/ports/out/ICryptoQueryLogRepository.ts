import { IRepository } from "../../../commons/application/IRepository";


export interface CryptoQueryLog {
  id?: string;
  userId: string | null;
  limit: number;
  vsCurrency: string;
  itemsReturned: number;
  createdAt?: Date;
}

export type ICryptoQueryLogRepository = IRepository<CryptoQueryLog, string>;
