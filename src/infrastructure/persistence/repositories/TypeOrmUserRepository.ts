import { inject, injectable } from "inversify";
import { DataSource, Repository } from "typeorm";
import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/ports/out/IUserRepository";
import { TYPES } from "../../../commons/container/types";
import { UserEntity } from "../entities/UserEntity";

@injectable()
export class TypeOrmUserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return row ? this.toDomain(row) : null;
  }

  public async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  public async findAll(): Promise<User[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  public async save(user: User): Promise<User> {
    const entity = this.repo.create({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  public async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(row: UserEntity): User {
    return new User(row.id, row.email, row.passwordHash, row.createdAt);
  }
}
