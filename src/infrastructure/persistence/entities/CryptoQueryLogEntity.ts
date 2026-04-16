import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity({ name: "crypto_query_logs" })
export class CryptoQueryLogEntity {
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @Column("varchar", { length: 36, nullable: true })
  public userId!: string | null;

  @Column("int")
  public limitRequested!: number;

  @Column("varchar", { length: 10 })
  public vsCurrency!: string;

  @Column("int")
  public itemsReturned!: number;

  @CreateDateColumn()
  public createdAt!: Date;
}
