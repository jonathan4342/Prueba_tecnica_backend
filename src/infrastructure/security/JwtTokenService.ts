import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import {
  IssuedToken,
  ITokenService,
  TokenPayload
} from "../../domain/ports/out/ITokenService";
import { UnauthorizedError } from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}


@injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    @inject(TYPES.AppConfig) private readonly config: { jwt: JwtConfig }
  ) {}

  public sign(payload: TokenPayload): IssuedToken {
    const token = jwt.sign(
      { sub: payload.sub, email: payload.email },
      this.config.jwt.secret,
      { expiresIn: this.config.jwt.expiresIn as jwt.SignOptions["expiresIn"] }
    );
    return { token, expiresIn: this.config.jwt.expiresIn };
  }

  public verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret) as jwt.JwtPayload;
      return { sub: String(decoded.sub), email: String(decoded.email) };
    } catch {
      throw new UnauthorizedError("Token inválido o expirado");
    }
  }
}
