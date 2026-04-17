import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ITokenService } from "../../domain/ports/out/ITokenService";
import { UnauthorizedError } from "../../commons/errors/AppError";
import { TYPES } from "../../commons/container/types";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}


@injectable()
export class AuthMiddleware {
  constructor(@inject(TYPES.TokenService) private readonly tokens: ITokenService) {}

  public handle = (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Falta el token Bearer"));
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = this.tokens.verify(token);
      req.user = { id: payload.sub, email: payload.email };
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
