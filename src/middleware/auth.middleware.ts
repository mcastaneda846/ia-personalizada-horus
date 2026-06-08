import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/**
 * Middleware de autenticación servicio a servicio
 * Horus debe enviar el API_SECRET_KEY en el header Authorization
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "No autorizado",
      code: "MISSING_AUTH_HEADER",
    });
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      error: "Formato de autorización inválido. Use: Bearer <token>",
      code: "INVALID_AUTH_FORMAT",
    });
    return;
  }

  if (token !== env.API_SECRET_KEY) {
    res.status(403).json({
      error: "Token inválido",
      code: "INVALID_TOKEN",
    });
    return;
  }

  next();
}
