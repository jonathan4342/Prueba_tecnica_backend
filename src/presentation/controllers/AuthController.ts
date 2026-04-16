import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ILoginUserUseCase } from "../../domain/ports/in/ILoginUserUseCase";
import { IRegisterUserUseCase } from "../../domain/ports/in/IRegisterUserUseCase";
import { TYPES } from "../../commons/container/types";
import { AuthPresenter } from "../presenters/AuthPresenter";

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.RegisterUserUseCase)
    private readonly registerUseCase: IRegisterUserUseCase,
    @inject(TYPES.LoginUserUseCase)
    private readonly loginUseCase: ILoginUserUseCase,
    @inject(TYPES.AuthPresenter) private readonly presenter: AuthPresenter
  ) {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};
      const result = await this.registerUseCase.execute({ email, password });
      res.status(201).json(this.presenter.register.present(result));
    } catch (err) {
      next(err);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};
      const result = await this.loginUseCase.execute({ email, password });
      res.json(this.presenter.login.present(result));
    } catch (err) {
      next(err);
    }
  };
}
