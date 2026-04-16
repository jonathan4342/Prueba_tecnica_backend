import { Request, Response } from "express";
import { injectable } from "inversify";

@injectable()
export class HealthController {
  public check = (_req: Request, res: Response): void => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  };
}
