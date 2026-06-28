import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key requerida"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_TTL_SECONDS: z.coerce.number().default(3600),

  DATABASE_URL: z.string().min(1, "DATABASE_URL requerida"),
  VECTOR_DATABASE_URL: z.string().min(1, "VECTOR_DATABASE_URL requerida"),

  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default("./firebase-service-account.json"),

  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  API_SECRET_KEY: z.string().min(16, "API_SECRET_KEY debe tener al menos 16 caracteres"),
  ELEVENLABS_API_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(30),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Usar process.stderr directamente — logger aún no inicializado
  process.stderr.write("Variables de entorno inválidas:\n");
  process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) + "\n");
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
