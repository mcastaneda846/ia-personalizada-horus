import { Router, Request, Response } from "express";
import { redisClient } from "../services/redis.service";
import { vectorService } from "../services/vector.service";
import { databaseService } from "../services/database.service";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const [redis, vectorDb, database] = await Promise.allSettled([
    redisClient.ping(),
    vectorService.ping(),
    databaseService.ping(),
  ]);

  const dependencies = {
    redis: redis.status === "fulfilled" && redis.value ? "ok" : "error",
    vector_db: vectorDb.status === "fulfilled" && vectorDb.value ? "ok" : "error",
    database: database.status === "fulfilled" && database.value ? "ok" : "error",
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
