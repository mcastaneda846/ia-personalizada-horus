import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import logger from "../config/logger";
import { chatService } from "../services/chat.service";
import { elevenLabsService } from "../services/elevenlabs.service";
import { openAIService } from "../services/openai.service";
import { databaseService } from "../services/database.service";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  initChatSchema,
  sendMessageSchema,
  endChatSchema,
  ttsSchema,
  sttSchema,
} from "../middleware/validation.middleware";

const router = Router();

router.use(authMiddleware);

router.post(
  "/init",
  validateBody(initChatSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await chatService.initChat(req.body.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/message",
  validateBody(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, message, mediaBase64, mediaType } = req.body;
      const result = await chatService.sendMessage(sessionId, message, mediaBase64, mediaType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/end",
  validateBody(endChatSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await chatService.endChat(req.body.sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// TTS — texto → audio mp3 base64 via ElevenLabs
router.post(
  "/tts",
  validateBody(ttsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, voiceId } = req.body;
      const audioBuffer = await elevenLabsService.textToSpeech(text, voiceId);
      res.status(200).json({ audioBase64: audioBuffer.toString("base64") });
    } catch (error) {
      logger.error({ err: (error as Error).message }, "TTS route error");
      next(error);
    }
  }
);

const historyQuerySchema = z.object({ userId: z.string().uuid("userId debe ser un UUID válido") });

// History — conversaciones pasadas del usuario (GET con userId en query)
router.get(
  "/history",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = historyQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message, code: "INVALID_PARAMS" });
        return;
      }
      const logs = await databaseService.getChatHistory(parsed.data.userId);
      res.status(200).json({ logs });
    } catch (error) {
      logger.error({ err: (error as Error).message }, "History route error");
      next(error);
    }
  }
);

// STT — audio base64 → transcript via OpenAI Whisper
router.post(
  "/stt",
  validateBody(sttSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const transcript = await openAIService.speechToText(audioBase64, mimeType);
      res.status(200).json({ transcript });
    } catch (error) {
      next(error);
    }
  }
);

export { router as chatRouter };
