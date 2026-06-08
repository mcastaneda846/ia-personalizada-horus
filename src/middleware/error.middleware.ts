import { Request, Response, NextFunction } from "express";

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
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("❌ Error:", err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Errores específicos conocidos
  if (err.message === "SESSION_NOT_FOUND") {
    res.status(404).json({
      error: "Sesión no encontrada o expirada. Por favor inicia un nuevo chat.",
      code: "SESSION_NOT_FOUND",
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    error:
      env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
    code: "INTERNAL_ERROR",
  });
}

// Importación circular resuelta
import { env } from "../config/env";
