import { IUseCase } from "../shared/IUseCase";
import { IssuedToken } from "../out/ITokenService";

export interface LoginUserInput {
  email: string;
  password: string;
}

export type LoginUserOutput = IssuedToken;

export type ILoginUserUseCase = IUseCase<LoginUserInput, LoginUserOutput>;
