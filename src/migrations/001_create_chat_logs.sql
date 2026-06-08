-- Migration: Agregar tabla chat_logs a la DB de Horus
-- Ejecutar en la base de datos de Horus
-- Este es el ÚNICO cambio que necesita hacer el equipo de Horus en su DB

CREATE TABLE IF NOT EXISTS chat_logs (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id                      UUID NOT NULL UNIQUE,
  started_at                      TIMESTAMPTZ NOT NULL,
  ended_at                        TIMESTAMPTZ NOT NULL,
  summary                         TEXT NOT NULL,
  main_topics                     JSONB NOT NULL DEFAULT '[]',
  alert_level                     VARCHAR(10) NOT NULL CHECK (alert_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  emergency_services_recommended  BOOLEAN NOT NULL DEFAULT FALSE,
  key_recommendations             JSONB NOT NULL DEFAULT '[]',
  requires_follow_up              BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_reason                TEXT,
  message_count                   INTEGER NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id       ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_alert_level   ON chat_logs(alert_level);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at    ON chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_follow_up     ON chat_logs(user_id, requires_follow_up) WHERE requires_follow_up = TRUE;

COMMENT ON TABLE chat_logs IS 'Logs generados automáticamente por HORUS AI al finalizar cada sesión de chat. Las conversaciones en sí NO se almacenan.';
COMMENT ON COLUMN chat_logs.alert_level IS 'LOW: informativo | MEDIUM: requiere médico | HIGH: urgencias | CRITICAL: emergencia activa';
