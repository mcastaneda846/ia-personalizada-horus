# Horus AI Service

Servicio de IA personalizada para emergencias médicas. Agnóstico del proyecto Horus principal, se conecta a través de endpoints HTTP.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **LLM + Embeddings**: Google Gemini (AI Studio) — `gemini-1.5-flash` + `text-embedding-004`
- **Vector Store**: Qdrant
- **Caché de sesiones**: Redis
- **BD persistente**: PostgreSQL (la misma de Horus, acceso controlado)

## Arquitectura de flujo

```
[Usuario hace clic en "Iniciar chat"]
    → POST /chat/init { userId }
    → Busca perfil en Qdrant (UNA SOLA VEZ)
    → Construye system prompt personalizado
    → Crea sesión en Redis
    → Retorna { sessionId, message, disclaimer }

[Usuario envía mensaje]
    → POST /chat/message { sessionId, message }
    → Recupera sesión de Redis (sin tocar Qdrant)
    → Envía a Gemini con contexto ya armado
    → Guarda intercambio en Redis
    → Retorna { response }

[Usuario cierra el chat]
    → POST /chat/end { sessionId }
    → Gemini genera resumen de la sesión
    → Guarda log en PostgreSQL (Horus DB)
    → Elimina sesión de Redis

[Horus detecta cambio en datos del usuario]
    → POST /sync/user { userId }
    → Lee perfil completo de Horus DB
    → Vectoriza con Gemini Embeddings
    → Upsert en Qdrant
```

## Endpoints

| Método | Ruta           | Descripción                                      |
|--------|----------------|--------------------------------------------------|
| POST   | /chat/init     | Inicia sesión, carga contexto médico desde Qdrant |
| POST   | /chat/message  | Envía mensaje al agente                          |
| POST   | /chat/end      | Finaliza sesión, genera log, limpia Redis         |
| POST   | /sync/user     | Sincroniza perfil médico de Horus → Qdrant        |
| GET    | /health        | Estado de todos los servicios                    |

Todos los endpoints (excepto `/health`) requieren:
```
Authorization: Bearer <API_SECRET_KEY>
```

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

### 2. Infraestructura local (Qdrant + Redis)

```bash
docker-compose up qdrant redis -d
```

### 3. Migración en DB de Horus

```bash
psql -d horus_db -f migrations/001_create_chat_logs.sql
```

### 4. Instalar dependencias y correr

```bash
npm install
npm run dev
```

## Integración con Horus (lo que debe hacer el equipo)

### Al iniciar chat (frontend → backend Horus → este servicio)

```typescript
// En el backend de Horus, cuando el usuario hace clic en "Iniciar chat"
const response = await fetch("http://horus-ai:3001/chat/init", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.HORUS_AI_SECRET_KEY}`,
  },
  body: JSON.stringify({ userId: currentUser.id }),
});
const { sessionId, message, disclaimer } = await response.json();
// Devolver sessionId al frontend para usarlo en mensajes posteriores
```

### Al enviar mensajes

```typescript
const response = await fetch("http://horus-ai:3001/chat/message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.HORUS_AI_SECRET_KEY}`,
  },
  body: JSON.stringify({ sessionId, message: userMessage }),
});
const { response: aiResponse } = await response.json();
```

### Cuando hay cambios en datos médicos del usuario

```typescript
// Llamar desde el Prisma middleware de Horus cuando cambien datos del usuario
await fetch("http://horus-ai:3001/sync/user", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.HORUS_AI_SECRET_KEY}`,
  },
  body: JSON.stringify({ userId }),
});
```

### Prisma middleware sugerido para Horus

```typescript
// En el proyecto Horus — prisma.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  const medicalModels = [
    "PersonalInformation", "MedicalProfile", "Allergy",
    "ChronicCondition", "UserMedication", "EmergencyContact"
  ];

  const mutationActions = ["create", "update", "delete", "upsert"];

  if (
    medicalModels.includes(params.model ?? "") &&
    mutationActions.includes(params.action)
  ) {
    const userId = params.args?.data?.userId ?? params.args?.where?.userId;
    if (userId) {
      // Fire and forget — no bloquear la operación principal
      fetch(`${process.env.HORUS_AI_URL}/sync/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HORUS_AI_SECRET_KEY}`,
        },
        body: JSON.stringify({ userId }),
      }).catch(console.error);
    }
  }

  return result;
});
```

## Estructura del proyecto

```
src/
├── config/
│   └── env.ts                  # Variables de entorno con validación Zod
├── middleware/
│   ├── auth.middleware.ts       # Validación API key
│   ├── error.middleware.ts      # Manejo centralizado de errores
│   └── validation.middleware.ts # Validación de body con Zod
├── models/
│   └── types.ts                 # Interfaces TypeScript
├── prompts/
│   └── system.prompt.ts         # System prompt base + primeros auxilios
├── routes/
│   ├── chat.routes.ts           # /chat/*
│   ├── sync.routes.ts           # /sync/*
│   └── health.routes.ts         # /health
├── services/
│   ├── chat.service.ts          # Orquestación del flujo completo
│   ├── gemini.service.ts        # LLM + embeddings
│   ├── qdrant.service.ts        # Vector store
│   ├── redis.service.ts         # Caché de sesiones
│   └── database.service.ts      # PostgreSQL (Horus DB)
└── index.ts                     # Entry point, Express setup
```
