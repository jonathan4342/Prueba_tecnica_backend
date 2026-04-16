/**
 * Entidad de dominio User.
 *
 * Objeto puro, sin dependencias de frameworks ni de la base de datos.
 * Las entidades de TypeORM viven en infrastructure/persistence/entities.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
