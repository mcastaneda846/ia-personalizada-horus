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
import { databaseService } from "./services/database.service";

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // Permitir requests sin origin (mobile apps, curl, Postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || env.NODE_ENV === "development") {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} no permitido`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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
    keyGenerator: (req) =>
      (req.headers.authorization?.split(" ")[1] ?? req.ip ?? "unknown"),
    skip: (req) => req.path === "/health/public",
  })
);

// Límite separado: rutas de media admiten hasta 15mb (imágenes/PDFs en base64)
// El resto de rutas sigue siendo ligero
app.use('/chat/message', express.json({ limit: '15mb' }));
app.use('/chat/stt', express.json({ limit: '25mb' }));
app.use('/chat/tts', express.json({ limit: '10mb' }));
app.use('/chat/init', express.json({ limit: '10kb' }));
app.use('/chat/end', express.json({ limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
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
