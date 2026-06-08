import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession as GeminiChatSession,
  Content,
} from "@google/generative-ai";
import { env } from "../config/env";
import { ChatMessage } from "../models/types";
import { SESSION_SUMMARY_PROMPT } from "../prompts/system.prompt";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private chatModel: GenerativeModel;
  private embeddingModel: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

    // ✅ MODELO CHAT CORRECTO
    this.chatModel = this.genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // ✅ MODELO EMBEDDINGS CORRECTO
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: env.EMBEDDING_MODEL || "gemini-embedding-001",
    });
  }

  /**
   * Genera embedding vectorial
   */
  async generateEmbedding(text: string): Promise<number[]> {
    console.log("EMBEDDING START");
    console.log("EMBEDDING MODEL:", env.EMBEDDING_MODEL);
    console.log("TEXT LENGTH:", text.length);

    try {
      const result = await this.embeddingModel.embedContent({
        content: {
          role: "user",
          parts: [{ text }],
        },
      });

      console.log("EMBEDDING END");

      return result.embedding.values;
    } catch (err) {
      console.error("❌ Embedding error:", err);
      throw err;
    }
  }

  /**
   * Chat session
   */
  startChat(systemPrompt: string, history: ChatMessage[]): GeminiChatSession {
    const geminiHistory: Content[] = history.map((msg) => ({
      role: msg.role,
      parts: msg.parts,
    }));

    return this.chatModel.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }],
      },
      history: geminiHistory,
    });
  }

  async sendMessage(
    chatSession: GeminiChatSession,
    message: string
  ): Promise<string> {
    const result = await chatSession.sendMessage(message);
    return result.response.text();
  }

  /**
   * RESUMEN SESIÓN (robusto)
   */
  async generateSessionSummary(messages: ChatMessage[]) {
    const conversationText = messages
      .map((msg) => {
        const role = msg.role === "user" ? "USUARIO" : "HORUS";
        return `${role}: ${msg.parts[0].text}`;
      })
      .join("\n\n");

    const summaryModel = this.genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const result = await summaryModel.generateContent([
      SESSION_SUMMARY_PROMPT,
      `\nCONVERSACIÓN A RESUMIR:\n\n${conversationText}`,
    ]);

    const responseText = result.response.text().trim();

    let jsonString = responseText;
    const startIndex = responseText.indexOf("{");
    const endIndex = responseText.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonString = responseText.substring(startIndex, endIndex + 1);
    }

    try {
      return JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ JSON parse failed, returning fallback");
      return {
        summary: responseText,
        mainTopics: [],
        alertLevel: "LOW",
        emergencyServicesRecommended: false,
        keyRecommendations: [],
        requiresFollowUp: false,
        followUpReason: null,
      };
    }
  }

  /**
   * SERIALIZACIÓN PERFIL (sin cambios funcionales)
   */
  serializeMedicalProfile(profile: any): string {
    const lines: string[] = [];

    if (profile.personalInfo) {
      const p = profile.personalInfo;
      const age = p.dateOfBirth
        ? this.calculateAge(new Date(p.dateOfBirth))
        : null;

      lines.push(`INFORMACIÓN PERSONAL:`);
      lines.push(`  Nombre: ${p.firstName} ${p.lastName}`);
      if (age) lines.push(`  Edad: ${age} años`);
      if (p.gender) lines.push(`  Género: ${p.gender}`);
      if (p.bloodType)
        lines.push(`  Tipo de sangre: ${this.formatBloodType(p.bloodType)}`);
    }

    if (profile.medicalProfile) {
      const m = profile.medicalProfile;
      lines.push(`\nPERFIL MÉDICO:`);
      if (m.heightCm) lines.push(`  Estatura: ${m.heightCm} cm`);
      if (m.weightKg) lines.push(`  Peso: ${m.weightKg} kg`);
      lines.push(`  Donante: ${m.organDonor ? "Sí" : "No"}`);
    }

    const activeAllergies = profile.allergies.filter((a: any) => a.isActive);

    if (activeAllergies.length > 0) {
      lines.push(`\nALERGIAS:`);
      activeAllergies.forEach((a: any) => {
        lines.push(`  ⚠️ ${a.allergenName} — ${a.severity}`);
      });
    }

    const meds = profile.currentMedications.filter((m: any) => m.isCurrent);

    if (meds.length > 0) {
      lines.push(`\nMEDICAMENTOS:`);
      meds.forEach((m: any) => {
        lines.push(`  • ${m.name} ${m.dosage ?? ""}`);
      });
    }

    return lines.join("\n");
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private formatBloodType(bloodType: string): string {
    const map: Record<string, string> = {
      A_POSITIVE: "A+",
      A_NEGATIVE: "A-",
      B_POSITIVE: "B+",
      B_NEGATIVE: "B-",
      AB_POSITIVE: "AB+",
      AB_NEGATIVE: "AB-",
      O_POSITIVE: "O+",
      O_NEGATIVE: "O-",
    };
    return map[bloodType] ?? bloodType;
  }
}

export const geminiService = new GeminiService();