
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  findAll(): Promise<T[]>;
  delete(id: ID): Promise<void>;
}
