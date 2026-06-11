import { Router, Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody, syncUserSchema } from "../middleware/validation.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * POST /sync/user
 *
 * Verifica que el usuario existe en Horus y tiene perfil médico.
 * El perfil se lee en tiempo real desde PostgreSQL al iniciar cada sesión,
 * por lo que no requiere sincronización hacia una BD vectorial.
 *
 * Body: { userId: string }
 */
router.post(
  "/user",
  validateBody(syncUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      const exists = await chatService.syncUserProfile(userId);

      if (exists) {
        res.status(200).json({
          success: true,
          message: `Perfil del usuario ${userId} verificado correctamente.`,
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
