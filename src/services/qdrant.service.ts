import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env";
import { MedicalProfile, QdrantPoint } from "../models/types";

class QdrantService {
  private client: QdrantClient;
  private collectionName: string;
  // text-embedding-004 de Google produce vectores de 768 dimensiones
  private readonly VECTOR_SIZE = 768;

  constructor() {
    this.client = new QdrantClient({
      url: env.QDRANT_URL,
      ...(env.QDRANT_API_KEY && { apiKey: env.QDRANT_API_KEY }),
    });
    this.collectionName = env.QDRANT_COLLECTION;
  }

  /**
   * Crea la colección si no existe
   */
  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName
    );

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`✅ Colección Qdrant creada: ${this.collectionName}`);
    } else {
      console.log(`✅ Colección Qdrant lista: ${this.collectionName}`);
    }
  }

  /**
   * Inserta o actualiza el perfil médico vectorizado de un usuario
   */
  async upsertUserProfile(
    userId: string,
    vector: number[],
    profileText: string,
    medicalProfile: MedicalProfile
  ): Promise<void> {
    // Usamos un hash del userId como punto ID numérico (Qdrant requiere number o UUID string)
    const pointId = this.userIdToPointId(userId);

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: {
            userId,
            profileText,
            medicalProfile,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    });
  }

  /**
   * Recupera el perfil médico de un usuario por su userId
   * (búsqueda directa por payload, sin necesidad de vector de consulta)
   */
  async getUserProfile(userId: string): Promise<QdrantPoint | null> {
    const results = await this.client.scroll(this.collectionName, {
      filter: {
        must: [
          {
            key: "userId",
            match: { value: userId },
          },
        ],
      },
      limit: 1,
      with_payload: true,
      with_vector: false,
    });

    if (!results.points || results.points.length === 0) return null;

    const point = results.points[0];
    return {
      id: point.id.toString(),
      vector: [],
      payload: point.payload as QdrantPoint["payload"],
    };
  }

  /**
   * Busca perfiles similares por vector (útil para búsqueda semántica)
   */
  async searchSimilar(
    queryVector: number[],
    userId: string,
    limit = 3
  ): Promise<QdrantPoint[]> {
    const results = await this.client.search(this.collectionName, {
      vector: queryVector,
      filter: {
        must: [
          {
            key: "userId",
            match: { value: userId },
          },
        ],
      },
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id.toString(),
      vector: [],
      payload: r.payload as QdrantPoint["payload"],
    }));
  }

  /**
   * Verifica si un usuario tiene perfil en Qdrant
   */
  async userProfileExists(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile !== null;
  }

  /**
   * Elimina el perfil de un usuario (útil si se elimina de Horus)
   */
  async deleteUserProfile(userId: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: "userId",
            match: { value: userId },
          },
        ],
      },
    });
  }

  /**
   * Convierte un UUID a un número válido para Qdrant
   * Tomamos los primeros 8 caracteres del UUID (sin guiones) como hex → number
   */
  private userIdToPointId(userId: string): string {
    // Qdrant acepta UUID strings directamente como IDs
    return userId;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}

export const qdrantService = new QdrantService();
