import bcrypt from "bcryptjs";
import { injectable } from "inversify";
import { IPasswordHasher } from "../../domain/ports/out/IPasswordHasher";

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly rounds = 10;

  public hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  public compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
