/**
 * Interfaz genérica de repositorio.
 *
 * Cualquier adaptador de persistencia (TypeORM, Mongoose, in-memory, etc.)
 * puede implementar esta forma con independencia de la entidad concreta.
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  findAll(): Promise<T[]>;
  delete(id: ID): Promise<void>;
}
