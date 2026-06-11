import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import logger from "./config/logger";
import { chatRouter } from "./routes/chat.routes";
import { syncRouter } from "./routes/sync.routes";
import { healthRouter } from "./routes/health.routes";
import { errorHandler } from "./middleware/error.middleware";
import { redisClient } from "./services/redis.service";
import { vectorService } from "./services/vector.service";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? false : "*",
    methods: ["GET", "POST"],
  })
);

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: "Demasiadas solicitudes. Por favor espera un momento.",
      code: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use("/health", healthRouter);
app.use("/chat", chatRouter);
app.use("/sync", syncRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
});

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await redisClient.connect();
    await vectorService.ensureSchema();

    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, "Horus AI Service started");
    });
  } catch (err) {
    logger.error({ err }, "Failed to start service");
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down");
  await redisClient.disconnect();
  await vectorService.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down");
  await redisClient.disconnect();
  await vectorService.disconnect();
  process.exit(0);
});

bootstrap();
