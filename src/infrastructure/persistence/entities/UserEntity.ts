import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn
} from "typeorm";

/**
 * Entidad TypeORM para usuarios.
 *
 * Vive en la capa de INFRAESTRUCTURA. El dominio la desconoce por completo;
 * el adaptador repositorio se encarga de convertir esta fila en `domain.User`.
 */
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
