import OpenAI from "openai";
import { env } from "../config/env";
import { ChatMessage, MedicalProfile } from "../models/types";
import { SESSION_SUMMARY_PROMPT } from "../prompts/system.prompt";

const HISTORY_WINDOW = 12;

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  }

  async chat(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
    ragContext?: string,
    contextNote?: string
  ): Promise<string> {
    const recentHistory = history.slice(-HISTORY_WINDOW);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    if (ragContext) {
      messages.push({
        role: "system",
        content: `PROTOCOLOS RELEVANTES:\n${ragContext}`,
      });
    }

    if (contextNote) {
      messages.push({ role: "system", content: contextNote });
    }

    messages.push({ role: "user", content: userMessage });

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 700,
    });

    return response.choices[0].message.content ?? "";
  }

  async generateSessionSummary(messages: ChatMessage[]): Promise<{
    summary: string;
    mainTopics: string[];
    alertLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    emergencyServicesRecommended: boolean;
    keyRecommendations: string[];
    requiresFollowUp: boolean;
    followUpReason: string | null;
  }> {
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "USUARIO" : "HORUS"}: ${msg.content}`)
      .join("\n\n");

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: SESSION_SUMMARY_PROMPT },
        { role: "user", content: conversationText },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0].message.content ?? "{}");
    } catch {
      return {
        summary: "",
        mainTopics: [],
        alertLevel: "LOW",
        emergencyServicesRecommended: false,
        keyRecommendations: [],
        requiresFollowUp: false,
        followUpReason: null,
      };
    }
  }

  serializeMedicalProfile(profile: MedicalProfile): string {
    const lines: string[] = [];

    if (profile.personalInfo) {
      const p = profile.personalInfo;
      const age = p.dateOfBirth ? this.calculateAge(new Date(p.dateOfBirth)) : null;
      lines.push("PACIENTE:");
      lines.push(`  ${p.firstName} ${p.lastName}${age ? `, ${age} anos` : ""}${p.gender ? `, ${p.gender}` : ""}${p.bloodType ? `, sangre ${this.formatBloodType(p.bloodType)}` : ""}`);
    }

    if (profile.medicalProfile) {
      const m = profile.medicalProfile;
      const physical = [
        m.heightCm ? `${m.heightCm}cm` : null,
        m.weightKg ? `${m.weightKg}kg` : null,
      ].filter(Boolean).join(", ");
      if (physical) lines.push(`  Fisico: ${physical}`);
      if (m.additionalNotes) lines.push(`  Notas: ${m.additionalNotes}`);
    }

    const activeAllergies = profile.allergies.filter((a) => a.isActive);
    if (activeAllergies.length > 0) {
      lines.push("ALERGIAS (CRITICO):");
      activeAllergies.forEach((a) => {
        lines.push(`  [${a.severity}] ${a.allergenName} (${a.allergyType})${a.reactionDescription ? ` - ${a.reactionDescription}` : ""}`);
      });
    }

    const activeMeds = profile.currentMedications.filter((m) => m.isCurrent);
    if (activeMeds.length > 0) {
      lines.push("MEDICAMENTOS ACTUALES:");
      activeMeds.forEach((m) => {
        lines.push(`  - ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` ${m.frequency}` : ""}`);
      });
    }

    if (profile.chronicConditions.length > 0) {
      lines.push("CONDICIONES CRONICAS:");
      profile.chronicConditions.forEach((c) => {
        lines.push(`  - ${c.conditionName} [${c.status}]${c.severity ? ` (${c.severity})` : ""}`);
      });
    }

    if (profile.medicalHistory && profile.medicalHistory.length > 0) {
      lines.push("HISTORIAL MEDICO RELEVANTE:");
      profile.medicalHistory.slice(0, 5).forEach((h) => {
        const date = h.eventDate ? ` (${new Date(h.eventDate).getFullYear()})` : "";
        lines.push(`  - ${h.eventType}: ${h.eventName}${date}${h.outcome ? ` - ${h.outcome}` : ""}`);
      });
    }

    if (profile.emergencyContacts.length > 0) {
      lines.push("CONTACTO DE EMERGENCIA:");
      const primary = profile.emergencyContacts[0];
      lines.push(`  ${primary.fullName} (${primary.relationship}): ${primary.phonePrimary}`);
    }

    return lines.length > 0
      ? lines.join("\n")
      : "Sin informacion medica registrada.";
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  private formatBloodType(bloodType: string): string {
    const map: Record<string, string> = {
      A_POSITIVE: "A+", A_NEGATIVE: "A-",
      B_POSITIVE: "B+", B_NEGATIVE: "B-",
      AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-",
      O_POSITIVE: "O+", O_NEGATIVE: "O-",
    };
    return map[bloodType] ?? bloodType;
  }
}

export const openAIService = new OpenAIService();
