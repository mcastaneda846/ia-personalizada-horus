import { v4 as uuidv4 } from "uuid";
import { redisClient } from "./redis.service";
import { openAIService } from "./openai.service";
import { vectorService } from "./vector.service";
import { databaseService } from "./database.service";
import { openFDAService } from "./openfda.service";
import { buildSystemPrompt } from "../prompts/system.prompt";
import { detectEmergencyLevel, detectMentalHealthCrisis, isThirdPerson } from "../utils/emergency.detector";
import logger from "../config/logger";
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

  async initChat(userId: string): Promise<InitChatResponse> {
    const [medicalProfile, healthReadings] = await Promise.all([
      databaseService.getUserMedicalProfile(userId),
      databaseService.getTodayHealthReadings(userId),
    ]);

    let userMedicalContext: string;

    if (medicalProfile) {
      const profileText = openAIService.serializeMedicalProfile(medicalProfile);

      const medicationNames = medicalProfile.currentMedications
        .filter((m) => m.isCurrent)
        .map((m) => m.name)
        .filter(Boolean);

      const fdaContext = await openFDAService.getMedicationsContext(medicationNames);

      userMedicalContext = fdaContext ? `${profileText}\n\n${fdaContext}` : profileText;
    } else {
      userMedicalContext =
        "Este usuario no tiene informacion medica registrada. " +
        "Responde de forma general sin hacer suposiciones sobre su estado de salud.";
    }

    // Inject today's watch readings so health reports use real data
    if (healthReadings) {
      const parts: string[] = [];
      if (healthReadings.heartRate != null)       parts.push(`FC: ${healthReadings.heartRate} bpm`);
      if (healthReadings.steps != null)           parts.push(`Pasos: ${healthReadings.steps}`);
      if (healthReadings.calories != null)        parts.push(`Calorías: ${healthReadings.calories} kcal`);
      if (healthReadings.activityMinutes != null) parts.push(`Minutos activos: ${healthReadings.activityMinutes}`);
      if (healthReadings.battery != null)         parts.push(`Batería reloj: ${healthReadings.battery}%`);
      if (parts.length > 0) {
        userMedicalContext += `\n\nDATOS DEL RELOJ HOY (datos reales del smartwatch — úsalos al evaluar el estado de salud del día):\n${parts.join(' | ')}`;
      }
    }

    const systemPrompt = buildSystemPrompt(userMedicalContext);
    const sessionId = uuidv4();

    const session: ChatSession = {
      sessionId,
      userId,
      systemPrompt,
      history: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    await redisClient.saveSession(session);
    logger.info({ userId, sessionId }, "Chat session started");

    return {
      sessionId,
      message:
        "Hola, soy HORUS. Estoy aqui para ayudarte con cualquier consulta medica o de emergencia. En que puedo ayudarte hoy?",
      disclaimer:
        "HORUS es un asistente de orientacion medica y no reemplaza la atencion de un profesional de la salud. En caso de emergencia llama al 123 (Colombia), 112 (Europa) o 911 (USA).",
    };
  }

  async sendMessage(sessionId: string, userMessage: string, mediaBase64?: string, mediaType?: string): Promise<SendMessageResponse> {
    const session = await redisClient.getSession(sessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");

    const urgencyLevel = detectEmergencyLevel(userMessage);
    const mentalHealthCrisis = detectMentalHealthCrisis(userMessage);
    const thirdPerson = isThirdPerson(userMessage);

    if (urgencyLevel === 1) logger.warn({ sessionId }, "Level 1 emergency detected");
    if (mentalHealthCrisis) logger.warn({ sessionId }, "Mental health crisis detected");

    // Skip RAG when there's no meaningful text to embed (media-only messages)
    const hasTextQuery = userMessage.trim().length > 5;
    let ragContext: string | undefined;
    if (hasTextQuery) {
      try {
        const queryEmbedding = await openAIService.generateEmbedding(userMessage);
        const ragLimit = urgencyLevel === 1 ? 5 : 4;
        const chunks = await vectorService.searchSimilar(queryEmbedding, ragLimit);

        if (chunks.length > 0) {
          ragContext = chunks
            .map((chunk) => {
              const truncated = chunk.content.length > 600 ? chunk.content.slice(0, 600) + "..." : chunk.content;
              return `[${chunk.category}]\n${truncated}`;
            })
            .join("\n\n---\n\n");
        }
      } catch (err) {
        logger.error({ err }, "RAG unavailable, responding without additional context");
      }
    }

    let contextNote: string | undefined;
    if (thirdPerson) {
      contextNote = "[CONTEXTO] El usuario habla de otra persona. Dirige las instrucciones al usuario para que las aplique a esa persona.";
    }
    if (mentalHealthCrisis) {
      contextNote = (contextNote ?? "") +
        " [CONTEXTO] Posible crisis de salud mental. Aplica primeros auxilios psicologicos: escuchar sin juzgar, preguntar si piensa hacerse daño, dar linea 106.";
    }

    const responseText = await openAIService.chat(
      session.systemPrompt,
      session.history,
      userMessage,
      ragContext,
      contextNote,
      mediaBase64,
      mediaType,
    );

    const timestamp = new Date();

    const userMsg: ChatMessage = { role: "user", content: userMessage, timestamp };
    const assistantMsg: ChatMessage = { role: "assistant", content: responseText, timestamp: new Date() };

    session.history.push(userMsg, assistantMsg);
    await redisClient.updateSession(session);

    return { sessionId, response: responseText, timestamp };
  }

  async endChat(sessionId: string): Promise<EndChatResponse> {
    const session = await redisClient.getSession(sessionId);

    if (!session) {
      return { message: "Sesion no encontrada o ya finalizada.", logSaved: false };
    }

    const endedAt = new Date();
    let logSaved = false;

    try {
      if (session.history.length >= 2) {
        const summaryData = await openAIService.generateSessionSummary(session.history);

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
        logger.info({ sessionId, alertLevel: summaryData.alertLevel }, "Chat session ended");
      }
    } catch (err) {
      logger.error({ err, sessionId }, "Failed to save session log");
    }

    await redisClient.deleteSession(sessionId);

    return { message: "Sesion finalizada correctamente.", logSaved };
  }

  async syncUserProfile(userId: string): Promise<boolean> {
    const medicalProfile = await databaseService.getUserMedicalProfile(userId);
    return medicalProfile !== null;
  }
}

export const chatService = ChatService.getInstance();
