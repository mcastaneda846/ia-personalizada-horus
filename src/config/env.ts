import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Google AI
  GOOGLE_AI_API_KEY: z.string().min(1, "Google AI API key requerida"),

  // Modelos compatibles con tu API
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),

  // Qdrant
  QDRANT_URL: z.string().url().default("http://localhost:6333"),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().default("horus_medical_profiles"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_TTL_SECONDS: z.coerce.number().default(3600),

  // PostgreSQL (DB de Horus)
  DATABASE_URL: z.string().min(1, "Database URL requerida"),

  // Servidor
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Seguridad
  API_SECRET_KEY: z
    .string()
    .min(16, "API secret key debe tener al menos 16 caracteres"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(30),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID requerido"),
  FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL inválido"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY requerido"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;