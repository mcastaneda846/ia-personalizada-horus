import { Router, Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  initChatSchema,
  sendMessageSchema,
  endChatSchema,
} from "../middleware/validation.middleware";

const router = Router();

// Todas las rutas de chat requieren autenticación
router.use(authMiddleware);

/**
 * POST /chat/init
 *
 * Inicia una sesión de chat para un usuario.
 * Busca su perfil en Qdrant y arma el contexto UNA SOLA VEZ.
 *
 * Body: { userId: string }
 * Response: { sessionId, message, disclaimer }
 */
router.post(
  "/init",
  validateBody(initChatSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      const result = await chatService.initChat(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /chat/message
 *
 * Envía un mensaje dentro de una sesión activa.
 * No consulta Qdrant — usa el contexto ya cargado en la sesión.
 *
 * Body: { sessionId: string, message: string }
 * Response: { sessionId, response, timestamp }
 */
router.post(
  "/message",
  validateBody(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, message } = req.body;
      const result = await chatService.sendMessage(sessionId, message);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /chat/end
 *
 * Finaliza la sesión de chat.
 * Genera el resumen con Gemini, guarda el log en PostgreSQL
 * y elimina la sesión de Redis.
 *
 * Body: { sessionId: string }
 * Response: { message, logSaved }
 */
router.post(
  "/end",
  validateBody(endChatSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;
      const result = await chatService.endChat(sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { router as chatRouter };
