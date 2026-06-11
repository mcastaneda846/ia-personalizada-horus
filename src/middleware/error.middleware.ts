import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  if (err.message === "SESSION_NOT_FOUND") {
    res.status(404).json({
      error: "Sesión no encontrada o expirada. Por favor inicia un nuevo chat.",
      code: "SESSION_NOT_FOUND",
    });
    return;
  }

  const message =
    env.NODE_ENV === "development" ? err.message : "Error interno del servidor";

  res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
}
