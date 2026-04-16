import { NextFunction, Request, Response } from "express";
import { AppError } from "../../commons/errors/AppError";


export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message }
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Error interno del servidor";
  // eslint-disable-next-line no-console
  console.error("[errorHandler] unexpected:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message }
  });
};
