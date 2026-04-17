import { injectable } from "inversify";
import { RegisterUserOutput } from "../../domain/ports/in/IRegisterUserUseCase";
import { LoginUserOutput } from "../../domain/ports/in/ILoginUserUseCase";
import { IPresenter } from "../shared/IPresenter";
import { LoginView, RegisterView } from "../views/AuthView";


@injectable()
export class AuthPresenter {
  public readonly register: IPresenter<RegisterUserOutput, RegisterView> = {
    present(output) {
      return {
        id: output.id,
        email: output.email,
        message: "Usuario registrado correctamente"
      };
    },
    presentMany(items) {
      return items.map((o) => this.present(o));
    }
  };

  public readonly login: IPresenter<LoginUserOutput, LoginView> = {
    present(output) {
      return {
        accessToken: output.token,
        tokenType: "Bearer",
        expiresIn: output.expiresIn
      };
    },
    presentMany(items) {
      return items.map((o) => this.present(o));
    }
  };
}
