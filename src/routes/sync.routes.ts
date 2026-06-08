import { Router, Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateBody,
  syncUserSchema,
} from "../middleware/validation.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * POST /sync/user
 *
 * Sincroniza el perfil médico de un usuario desde la DB de Horus hacia Qdrant.
 * Horus debe llamar este endpoint cada vez que haya cambios en:
 *   - personal_information
 *   - medical_profile
 *   - allergies
 *   - chronic_conditions
 *   - user_medications
 *   - emergency_contacts
 *
 * Body: { userId: string }
 * Response: { success, message }
 */
router.post(
  "/user",
  validateBody(syncUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      const synced = await chatService.syncUserProfile(userId);

      if (synced) {
        res.status(200).json({
          success: true,
          message: `Perfil del usuario ${userId} sincronizado correctamente en Qdrant.`,
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Usuario ${userId} no encontrado o sin datos médicos en Horus.`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export { router as syncRouter };
