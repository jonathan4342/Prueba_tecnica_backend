import { IUseCase } from "../../../commons/application/IUseCase";

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  email: string;
}

export type IRegisterUserUseCase = IUseCase<RegisterUserInput, RegisterUserOutput>;
