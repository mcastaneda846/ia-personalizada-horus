import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { chatRouter } from "./routes/chat.routes";
import { syncRouter } from "./routes/sync.routes";
import { healthRouter } from "./routes/health.routes";
import { errorHandler } from "./middleware/error.middleware";
import { redisClient } from "./services/redis.service";
import { qdrantService } from "./services/qdrant.service";

const app = express();

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    // Solo acepta peticiones del servidor de Horus, no del browser directamente
    origin: env.NODE_ENV === "production" ? false : "*",
    methods: ["GET", "POST"],
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Demasiadas solicitudes. Por favor espera un momento.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/chat", chatRouter);
app.use("/sync", syncRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    code: "NOT_FOUND",
  });
});

// ─── Error handler (debe ir al final) ────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    // Conectar Redis
    await redisClient.connect();

    // Asegurar colección en Qdrant
    await qdrantService.ensureCollection();

    app.listen(env.PORT, () => {
      console.log(`\n🚀 Horus AI Service corriendo en puerto ${env.PORT}`);
      console.log(`   Entorno: ${env.NODE_ENV}`);
      console.log(`   Health: http://localhost:${env.PORT}/health\n`);
    });
  } catch (error) {
    console.error("❌ Error iniciando el servicio:", error);
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM recibido, cerrando servicio...");
  await redisClient.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT recibido, cerrando servicio...");
  await redisClient.disconnect();
  process.exit(0);
});

bootstrap();
