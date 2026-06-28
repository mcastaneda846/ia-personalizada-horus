import OpenAI, { toFile } from "openai";
import { env } from "../config/env";
import { ChatMessage, MedicalProfile } from "../models/types";
import { SESSION_SUMMARY_PROMPT } from "../prompts/system.prompt";
import logger from "../config/logger";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as napi from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Polyfill globals que pdfjs-dist necesita antes de cargarlo
const g = globalThis as Record<string, unknown>;
if (!g.DOMMatrix) g.DOMMatrix = napi.DOMMatrix;
if (!g.Path2D)    g.Path2D    = napi.Path2D;
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

const HISTORY_WINDOW = 12;

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async speechToText(audioBase64: string, mimeType: string): Promise<string> {
    const buffer = Buffer.from(audioBase64, "base64");
    const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "mp3";
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
    const response = await this.client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "es",
    });
    return response.text;
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
    contextNote?: string,
    mediaBase64?: string,
    mediaType?: string,
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
      messages.push({ role: "system", content: `PROTOCOLOS RELEVANTES:\n${ragContext}` });
    }
    if (contextNote) {
      messages.push({ role: "system", content: contextNote });
    }

    // Límite de tokens en userMessage para evitar saturar el modelo
    const safeUserMessage = userMessage ? userMessage.slice(0, 4000) : "";

    if (mediaBase64 && mediaType) {
      if (mediaType.startsWith("image/")) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: safeUserMessage || "Analiza esta imagen médica y orientame según mi perfil." },
            // detail:"low" = 85 tokens fijos (~$0.00013) vs "high" que puede superar 1500 tokens
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${mediaBase64}`, detail: "low" } },
          ],
        });
      } else if (mediaType === "application/pdf") {
        try {
          const pdfText = await this.extractPdfText(mediaBase64);
          if (pdfText.length > 80) {
            messages.push({ role: "system", content: `DOCUMENTO PDF ADJUNTO POR EL USUARIO:\n${pdfText}` });
            messages.push({ role: "user", content: safeUserMessage || "Analiza este documento médico adjunto." });
          } else {
            // PDF escaneado — renderizar página 1 como imagen y usar visión (85 tokens, ~$0.00001)
            logger.info("Scanned PDF detected, rendering page 1 for vision OCR");
            const jpegBase64 = await this.renderPdfPageAsImage(mediaBase64);
            messages.push({
              role: "user",
              content: [
                { type: "text", text: safeUserMessage || "Analiza este documento médico escaneado." },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpegBase64}`, detail: "low" } },
              ],
            });
          }
        } catch (err) {
          logger.warn({ err }, "PDF processing failed");
          messages.push({ role: "system", content: "El usuario adjuntó un PDF pero no fue posible procesarlo. Pídele que tome una foto del documento." });
          messages.push({ role: "user", content: safeUserMessage || "Analiza este documento médico adjunto." });
        }
      } else if (mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          const docxText = await this.extractDocxText(mediaBase64);
          messages.push({ role: "system", content: `DOCUMENTO WORD ADJUNTO POR EL USUARIO:\n${docxText}` });
        } catch (err) {
          logger.warn({ err }, "DOCX extraction failed");
          messages.push({ role: "system", content: "El usuario adjuntó un Word pero no fue posible leerlo. Pídele que describa el contenido." });
        }
        messages.push({ role: "user", content: safeUserMessage || "Analiza este documento médico adjunto." });
      } else {
        messages.push({ role: "user", content: safeUserMessage });
      }
    } else {
      messages.push({ role: "user", content: safeUserMessage });
    }

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0].message.content ?? "";
  }

  private async extractPdfText(base64: string): Promise<string> {
    const buffer = Buffer.from(base64, "base64");
    const data = await pdfParse(buffer);
    return data.text.trim().slice(0, 5000);
  }

  private async renderPdfPageAsImage(base64: string): Promise<string> {
    // Factory para que pdfjs use @napi-rs/canvas en lugar de node-canvas
    const canvasFactory = {
      create: (w: number, h: number) => {
        const canvas = napi.createCanvas(w, h);
        return { canvas, context: canvas.getContext("2d") };
      },
      reset: (obj: any, w: number, h: number) => { obj.canvas.width = w; obj.canvas.height = h; },
      destroy: (obj: any) => { obj.canvas.width = 0; obj.canvas.height = 0; },
    };

    const buffer = Buffer.from(base64, "base64");
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), canvasFactory }).promise;
    const page   = await pdfDoc.getPage(1);

    const viewport  = page.getViewport({ scale: 1.5 });
    const obj       = canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));

    await page.render({ canvasContext: obj.context, viewport, canvasFactory } as any).promise;

    const jpegBuffer: Buffer = obj.canvas.toBuffer("image/jpeg");
    return jpegBuffer.toString("base64");
  }

  private async extractDocxText(base64: string): Promise<string> {
    const buffer = Buffer.from(base64, "base64");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, 5000);
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
      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");
      return JSON.parse(content);
    } catch (err) {
      logger.warn({ err }, "Failed to parse session summary JSON, using safe fallback");
      return {
        summary: response.choices[0].message.content?.slice(0, 300) ?? "Resumen no disponible",
        mainTopics: [],
        alertLevel: "HIGH",
        emergencyServicesRecommended: false,
        keyRecommendations: [],
        requiresFollowUp: true,
        followUpReason: "Resumen automático falló — revisar sesión manualmente",
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
