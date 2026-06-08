import { Router, Request, Response } from "express";
import { redisClient } from "../services/redis.service";
import { qdrantService } from "../services/qdrant.service";
import { databaseService } from "../services/database.service";

const router = Router();

/**
 * GET /health
 *
 * Verifica el estado de todos los servicios.
 * No requiere autenticación — útil para monitoring.
 */
router.get("/", async (_req: Request, res: Response) => {
  const [redis, qdrant, database] = await Promise.allSettled([
    redisClient.ping(),
    qdrantService.ping(),
    databaseService.ping(),
  ]);

  const status = {
    service: "horus-ai",
    status: "ok",
    timestamp: new Date().toISOString(),
    dependencies: {
      redis: redis.status === "fulfilled" && redis.value ? "ok" : "error",
      qdrant: qdrant.status === "fulfilled" && qdrant.value ? "ok" : "error",
      database:
        database.status === "fulfilled" && database.value ? "ok" : "error",
    },
  };

  const allHealthy = Object.values(status.dependencies).every(
    (s) => s === "ok"
  );

  if (!allHealthy) {
    status.status = "degraded";
  }

  res.status(allHealthy ? 200 : 503).json(status);
});

export { router as healthRouter };
