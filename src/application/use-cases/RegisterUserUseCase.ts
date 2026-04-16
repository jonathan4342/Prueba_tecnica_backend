import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { User } from "../../domain/entities/User";
import {
  IRegisterUserUseCase,
  RegisterUserInput,
  RegisterUserOutput
} from "../../domain/ports/in/IRegisterUserUseCase";
import { IPasswordHasher } from "../../domain/ports/out/IPasswordHasher";
import { IUserRepository } from "../../domain/ports/out/IUserRepository";
import {
  ConflictError,
  ValidationError
} from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

@injectable()
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private readonly users: IUserRepository,
    @inject(TYPES.PasswordHasher) private readonly hasher: IPasswordHasher
  ) {}

  public async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    this.validate(input);

    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("El email ya está registrado");
    }

    const hashed = await this.hasher.hash(input.password);
    const user = new User(randomUUID(), input.email.toLowerCase(), hashed);
    const saved = await this.users.save(user);
    return { id: saved.id, email: saved.email };
  }

  private validate(input: RegisterUserInput): void {
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new ValidationError("Email inválido");
    }
    if (!input.password || input.password.length < 6) {
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres");
    }
  }
}
