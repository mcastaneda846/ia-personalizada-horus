import { Pool } from "pg";
import { env } from "../config/env";
import logger from "../config/logger";
import { KnowledgeChunk } from "../models/types";

const VECTOR_SIZE = 1536;

class VectorService {
  private pool: Pool;
  private static instance: VectorService;

  private constructor() {
    this.pool = new Pool({
      connectionString: env.VECTOR_DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: true },
    });

    this.pool.on("error", (err) => {
      logger.error({ err: err.message }, "Vector DB pool error");
    });
  }

  static getInstance(): VectorService {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService();
    }
    return VectorService.instance;
  }

  async ensureSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS medical_knowledge_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          source VARCHAR(200),
          embedding vector(${VECTOR_SIZE}),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
        ON medical_knowledge_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 50)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_category
        ON medical_knowledge_chunks (category)
      `);

      logger.info("Vector DB schema ready");
    } finally {
      client.release();
    }
  }

  async upsertChunk(chunk: KnowledgeChunk, embedding: number[]): Promise<void> {
    await this.pool.query(
      `INSERT INTO medical_knowledge_chunks (content, category, source, embedding)
       SELECT $1, $2, $3, $4
       WHERE NOT EXISTS (
         SELECT 1 FROM medical_knowledge_chunks WHERE content = $1
       )`,
      [chunk.content, chunk.category, chunk.source ?? null, JSON.stringify(embedding)]
    );
  }

  async searchSimilar(queryEmbedding: number[], limit = 4): Promise<KnowledgeChunk[]> {
    const result = await this.pool.query(
      `SELECT id, content, category, source
       FROM medical_knowledge_chunks
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [JSON.stringify(queryEmbedding), limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      category: row.category,
      source: row.source,
    }));
  }

  async countChunks(): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM medical_knowledge_chunks`
    );
    return parseInt(result.rows[0].count, 10);
  }

  async clearChunks(): Promise<void> {
    await this.pool.query(`TRUNCATE TABLE medical_knowledge_chunks`);
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch (err) {
      logger.error({ err }, "Vector DB ping failed");
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}

export const vectorService = VectorService.getInstance();
