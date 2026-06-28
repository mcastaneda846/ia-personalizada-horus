import { Router, Request, Response } from "express";
import { redisClient } from "../services/redis.service";
import { vectorService } from "../services/vector.service";
import { databaseService } from "../services/database.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Público — solo confirma que el proceso está vivo, sin exponer dependencias
router.get("/public", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "horus-ai" });
});

// Privado — estado detallado de todas las dependencias (requiere API key)
router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  const [redis, vectorDb, database] = await Promise.allSettled([
    redisClient.ping(),
    vectorService.ping(),
    databaseService.ping(),
  ]);

  const dependencies = {
    redis:     redis.status     === "fulfilled" && redis.value     ? "ok" : "error",
    vector_db: vectorDb.status  === "fulfilled" && vectorDb.value  ? "ok" : "error",
    database:  database.status  === "fulfilled" && database.value  ? "ok" : "error",
  };

  const allHealthy = Object.values(dependencies).every((s) => s === "ok");

  res.status(allHealthy ? 200 : 503).json({
    service: "horus-ai",
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies,
  });
});

export { router as healthRouter };
