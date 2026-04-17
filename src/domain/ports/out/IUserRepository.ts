import { User } from "../../entities/User";
import { IRepository } from "../../../commons/application/IRepository";


export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: string): Promise<User | null>;
}
