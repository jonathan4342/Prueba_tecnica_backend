import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IGetTopCryptoAssetsUseCase } from "../../domain/ports/in/IGetTopCryptoAssetsUseCase";
import { TYPES } from "../../commons/container/types";
import { AuthedRequest } from "../middlewares/authMiddleware";
import { CryptoAssetPresenter } from "../presenters/CryptoAssetPresenter";

/**
 * Controller de presentación.
 *
 * - Traduce un HTTP request a un input de caso de uso.
 * - Ejecuta el caso de uso (IUseCase genérico).
 * - Delega al presenter la construcción de la vista.
 * - Responde con JSON.
 *
 * NINGUNA lógica de negocio vive aquí.
 */
@injectable()
export class CryptoController {
  constructor(
    @inject(TYPES.GetTopCryptoAssetsUseCase)
    private readonly useCase: IGetTopCryptoAssetsUseCase,
    @inject(TYPES.CryptoAssetPresenter)
    private readonly presenter: CryptoAssetPresenter
  ) {}

  public getExternalData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = Number(req.query.limit ?? 10);
      const vsCurrency = (req.query.vs ?? req.query.currency) as string | undefined;
      const userId = (req as AuthedRequest).user?.id ?? null;

      const assets = await this.useCase.execute({ limit, vsCurrency, userId });
      const view = this.presenter.presentMany(assets);
      res.json(view);
    } catch (err) {
      next(err);
    }
  };
}
