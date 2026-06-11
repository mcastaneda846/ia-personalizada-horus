import Redis from "ioredis";
import { env } from "../config/env";
import logger from "../config/logger";
import { ChatSession } from "../models/types";

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    const isTLS =
      env.REDIS_URL.startsWith("rediss://") ||
      env.REDIS_URL.includes("upstash.io");

    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      ...(isTLS && { tls: { rejectUnauthorized: false } }),
    });

    this.client.on("error", (err) => {
      logger.error({ err: err.message }, "Redis error");
    });

    this.client.on("connect", () => {
      logger.info("Redis connected");
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

  // Sesiones

  async saveSession(session: ChatSession): Promise<void> {
    await this.client.setex(
      this.sessionKey(session.sessionId),
      env.SESSION_TTL_SECONDS,
      JSON.stringify(session)
    );
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const data = await this.client.get(this.sessionKey(sessionId));
    if (!data) return null;

    const session = JSON.parse(data) as ChatSession;
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
    return (await this.client.exists(this.sessionKey(sessionId))) === 1;
  }

  private sessionKey(sessionId: string): string {
    return `horus:session:${sessionId}`;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redisClient = RedisClient.getInstance();
