import { inject, injectable } from "inversify";
import { DataSource, Repository } from "typeorm";
import {
  CryptoQueryLog,
  ICryptoQueryLogRepository
} from "../../../domain/ports/out/ICryptoQueryLogRepository";
import { TYPES } from "../../../commons/container/types";
import { CryptoQueryLogEntity } from "../entities/CryptoQueryLogEntity";

@injectable()
export class TypeOrmCryptoQueryLogRepository implements ICryptoQueryLogRepository {
  private readonly repo: Repository<CryptoQueryLogEntity>;

  constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
    this.repo = dataSource.getRepository(CryptoQueryLogEntity);
  }

  public async findById(id: string): Promise<CryptoQueryLog | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  public async findAll(): Promise<CryptoQueryLog[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  public async save(log: CryptoQueryLog): Promise<CryptoQueryLog> {
    const entity = this.repo.create({
      userId: log.userId,
      limitRequested: log.limit,
      vsCurrency: log.vsCurrency,
      itemsReturned: log.itemsReturned
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  public async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(row: CryptoQueryLogEntity): CryptoQueryLog {
    return {
      id: row.id,
      userId: row.userId,
      limit: row.limitRequested,
      vsCurrency: row.vsCurrency,
      itemsReturned: row.itemsReturned,
      createdAt: row.createdAt
    };
  }
}
