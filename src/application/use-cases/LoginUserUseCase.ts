import { inject, injectable } from "inversify";
import {
  ILoginUserUseCase,
  LoginUserInput,
  LoginUserOutput
} from "../../domain/ports/in/ILoginUserUseCase";
import { IPasswordHasher } from "../../domain/ports/out/IPasswordHasher";
import { ITokenService } from "../../domain/ports/out/ITokenService";
import { IUserRepository } from "../../domain/ports/out/IUserRepository";
import {
  UnauthorizedError,
  ValidationError
} from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

@injectable()
export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private readonly users: IUserRepository,
    @inject(TYPES.PasswordHasher) private readonly hasher: IPasswordHasher,
    @inject(TYPES.TokenService) private readonly tokens: ITokenService
  ) {}

  public async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    this.validate(input);
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }
    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Credenciales inválidas");
    }
    return this.tokens.sign({ sub: user.id, email: user.email });
  }

  private validate(input: LoginUserInput): void {
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new ValidationError("Email inválido");
    }
    if (!input.password || input.password.length < 6) {
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres");
    }
  }
}
