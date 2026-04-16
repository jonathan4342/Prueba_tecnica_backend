import { User } from "../../entities/User";
import { IRepository } from "../shared/IRepository";

/**
 * Repositorio de usuarios. Extiende la interfaz genérica IRepository
 * añadiendo una consulta específica por email.
 */
export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: string): Promise<User | null>;
}
