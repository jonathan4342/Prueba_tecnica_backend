import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn
} from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn("varchar", { length: 36 })
  public id!: string;

  @Index({ unique: true })
  @Column("varchar", { length: 255 })
  public email!: string;

  @Column("varchar", { length: 255 })
  public passwordHash!: string;

  @CreateDateColumn()
  public createdAt!: Date;
}
