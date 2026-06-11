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
      const { sessionId, message } = req.body;
      const result = await chatService.sendMessage(sessionId, message);
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

export { router as chatRouter };
