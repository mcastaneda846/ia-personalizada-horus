import Redis from "ioredis";
import { env } from "../config/env";
import { ChatSession } from "../models/types";

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });

    this.client.on("connect", () => {
      console.log("✅ Redis conectado");
    });
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  // ─── Sesiones ────────────────────────────────────────────────────────────────

  async saveSession(session: ChatSession): Promise<void> {
    const key = this.sessionKey(session.sessionId);
    await this.client.setex(
      key,
      env.SESSION_TTL_SECONDS,
      JSON.stringify(session)
    );
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const key = this.sessionKey(sessionId);
    const data = await this.client.get(key);
    if (!data) return null;

    const session = JSON.parse(data) as ChatSession;
    // Restaurar fechas desde JSON
    session.createdAt = new Date(session.createdAt);
    session.lastActivityAt = new Date(session.lastActivityAt);
    session.history = session.history.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    return session;
  }

  async updateSession(session: ChatSession): Promise<void> {
    session.lastActivityAt = new Date();
    await this.saveSession(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(this.sessionKey(sessionId));
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const result = await this.client.exists(this.sessionKey(sessionId));
    return result === 1;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private sessionKey(sessionId: string): string {
    return `horus:session:${sessionId}`;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redisClient = RedisClient.getInstance();
