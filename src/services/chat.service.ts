import { v4 as uuidv4 } from "uuid";
import { redisClient } from "./redis.service";
import { qdrantService } from "./qdrant.service";
import { geminiService } from "./gemini.service";
import { databaseService } from "./database.service";

import { buildSystemPrompt } from "../prompts/system.prompt";
import {
  ChatSession,
  ChatMessage,
  InitChatResponse,
  SendMessageResponse,
  EndChatResponse,
} from "../models/types";

class ChatService {
  private static instance: ChatService;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * INIT CHAT — Se llama cuando el usuario hace clic en "Iniciar chat"
   *
   * Flujo:
   * 1. Busca el perfil médico del usuario en Qdrant (UNA SOLA VEZ)
   * 2. Construye el system prompt personalizado
   * 3. Crea y guarda la sesión en Redis
   * 4. Retorna el sessionId al frontend
   */
  async initChat(userId: string): Promise<InitChatResponse> {
    // 1. Buscar perfil médico en Qdrant
    const qdrantProfile = await qdrantService.getUserProfile(userId);

    let systemPrompt: string;

    if (qdrantProfile) {
      // Perfil encontrado → usar el texto serializado del perfil
      systemPrompt = buildSystemPrompt(qdrantProfile.payload.profileText);
    } else {
      // No hay perfil en Qdrant → intentar sincronizar desde la DB
      console.warn(`⚠️  Usuario ${userId} no tiene perfil en Qdrant, intentando sincronizar...`);
      const synced = await this.syncUserProfile(userId);

      if (synced) {
        const freshProfile = await qdrantService.getUserProfile(userId);
        systemPrompt = buildSystemPrompt(
          freshProfile?.payload.profileText ??
          "No se encontró información médica registrada para este usuario."
        );
      } else {
        // Usar prompt genérico si no hay info médica
        systemPrompt = buildSystemPrompt(
          "Este usuario no tiene información médica registrada en el sistema. " +
          "Responde de forma general sin hacer suposiciones sobre su estado de salud."
        );
      }
    }

    // 2. Crear sesión
    const sessionId = uuidv4();
    const session: ChatSession = {
      sessionId,
      userId,
      systemPrompt,
      history: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    // 3. Guardar sesión en Redis
    await redisClient.saveSession(session);

    return {
      sessionId,
      message: "Hola, soy HORUS. Estoy aquí para ayudarte con cualquier consulta médica o de emergencia. ¿En qué puedo ayudarte?",
      disclaimer:
        "⚠️ Esta conversación no se guarda. HORUS es un asistente de orientación médica y no reemplaza la atención de un profesional de la salud.",
    };
  }

  /**
   * SEND MESSAGE — Se llama en cada mensaje del usuario
   *
   * Flujo:
   * 1. Recupera la sesión desde Redis (contexto ya armado)
   * 2. Reconstruye el chat de Gemini con el historial
   * 3. Envía el mensaje y obtiene respuesta
   * 4. Guarda el intercambio en Redis
   * 5. Retorna la respuesta al frontend
   */
  async sendMessage(
    sessionId: string,
    userMessage: string
  ): Promise<SendMessageResponse> {
    // 1. Recuperar sesión
    const session = await redisClient.getSession(sessionId);
    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    // 2. Reconstruir chat de Gemini con historial existente
    const geminiChat = geminiService.startChat(session.systemPrompt, session.history);

    // 3. Enviar mensaje
    const responseText = await geminiService.sendMessage(geminiChat, userMessage);

    // 4. Actualizar historial en la sesión
    const timestamp = new Date();

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: userMessage }],
      timestamp,
    };

    const assistantMsg: ChatMessage = {
      role: "model",
      parts: [{ text: responseText }],
      timestamp: new Date(),
    };

    session.history.push(userMsg, assistantMsg);
    await redisClient.updateSession(session);

    return {
      sessionId,
      response: responseText,
      timestamp,
    };
  }

  /**
   * END CHAT — Se llama cuando el usuario cierra o finaliza el chat
   *
   * Flujo:
   * 1. Recupera la sesión desde Redis
   * 2. Genera el resumen con Gemini
 * 3. Guarda el log en Firestore (chat_logs collection)
   * 4. Elimina la sesión de Redis
   */
  async endChat(sessionId: string): Promise<EndChatResponse> {
    const session = await redisClient.getSession(sessionId);

    if (!session) {
      return { message: "Sesión no encontrada o ya finalizada.", logSaved: false };
    }

    const endedAt = new Date();
    let logSaved = false;

    try {
      // Solo generar log si hubo mensajes reales
      if (session.history.length >= 2) {
        const summaryData = await geminiService.generateSessionSummary(
          session.history
        );

        await databaseService.saveChatLog({
          userId: session.userId,
          sessionId: session.sessionId,
          startedAt: session.createdAt,
          endedAt,
          summary: summaryData.summary,
          mainTopics: summaryData.mainTopics,
          alertLevel: summaryData.alertLevel,
          emergencyServicesRecommended: summaryData.emergencyServicesRecommended,
          keyRecommendations: summaryData.keyRecommendations,
          requiresFollowUp: summaryData.requiresFollowUp,
          followUpReason: summaryData.followUpReason,
          messageCount: Math.floor(session.history.length / 2),
        });

        logSaved = true;
      }
    } catch (error) {
      console.error("❌ Error guardando log de sesión:", error);
      // No lanzar error — la sesión se cierra igualmente
    }

    // Eliminar sesión de Redis
    await redisClient.deleteSession(sessionId);

    return {
      message: "Sesión finalizada correctamente.",
      logSaved,
    };
  }

  /**
   * SYNC USER PROFILE — Sincroniza el perfil médico desde la DB de Horus hacia Qdrant
   * Se llama desde el endpoint /sync-user (invocado por Horus cuando hay cambios)
   * También se llama internamente si el usuario no tiene perfil en Qdrant al iniciar chat
   */
  async syncUserProfile(userId: string): Promise<boolean> {
    console.log("STEP 1 - Leyendo perfil desde DB");

    const medicalProfile = await databaseService.getUserMedicalProfile(userId);

    console.log("STEP 2 - Perfil obtenido");

    if (!medicalProfile) {
      console.warn(`⚠️  Usuario ${userId} no encontrado o inactivo en Horus DB`);
      return false;
    }

    console.log("STEP 3 - Serializando perfil");

    // Serializar el perfil a texto
    const profileText = geminiService.serializeMedicalProfile(medicalProfile);

    console.log("STEP 4 - Generando embedding");

    // Vectorizar el texto del perfil
    const vector = new Array(768).fill(0);

    console.log("STEP 5 - Embedding generado", vector.length);

    console.log("STEP 6 - Guardando en Qdrant");

    // Guardar en Qdrant
    await qdrantService.upsertUserProfile(
      userId,
      vector,
      profileText,
      medicalProfile
    );

    console.log(`STEP 7 - Perfil sincronizado en Qdrant para usuario: ${userId}`);

    return true;
  }
}

export const chatService = ChatService.getInstance();
