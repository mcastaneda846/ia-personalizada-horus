import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Datos de entrada inválidos",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export const initChatSchema = z.object({
  userId: z.string().uuid("userId debe ser un UUID válido"),
});

export const sendMessageSchema = z.object({
  sessionId: z.string().uuid("sessionId debe ser un UUID válido"),
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede superar 2000 caracteres"),
});

export const endChatSchema = z.object({
  sessionId: z.string().uuid("sessionId debe ser un UUID válido"),
});

export const syncUserSchema = z.object({
  userId: z.string().uuid("userId debe ser un UUID válido"),
});
