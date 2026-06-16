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

export const sendMessageSchema = z
  .object({
    sessionId: z.string().uuid("sessionId debe ser un UUID válido"),
    message: z.string().max(2000, "El mensaje no puede superar 2000 caracteres").default(""),
    mediaBase64: z.string().optional(),
    mediaType: z.string().optional(),
  })
  .refine(
    (d) => d.message.length > 0 || (d.mediaBase64 != null && d.mediaBase64.length > 0),
    { message: "Se requiere mensaje o archivo adjunto" }
  );

export const endChatSchema = z.object({
  sessionId: z.string().uuid("sessionId debe ser un UUID válido"),
});

export const syncUserSchema = z.object({
  userId: z.string().uuid("userId debe ser un UUID válido"),
});

export const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1),
});

export const sttSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default("audio/m4a"),
});
