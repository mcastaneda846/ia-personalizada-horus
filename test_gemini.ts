import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  
  const chatModel = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
  });

  const chatSession = chatModel.startChat({
    history: [],
  });

  const prompt = "Actúa como un experto médico de emergencias. Escribe una guía EXTREMADAMENTE LARGA Y EXHAUSTIVA, de al menos 3000 palabras, sobre cómo realizar la maniobra de Heimlich en todas las situaciones posibles (adultos, niños, bebés, uno mismo, personas embarazadas, personas obesas), incluyendo la anatomía involucrada, historia de la maniobra, riesgos potenciales, qué hacer antes y después, y estadísticas globales. No omitas ningún detalle, usa muchas negritas y listas.";

  console.log("Enviando prompt...");
  const result = await chatSession.sendMessage(prompt);
  
  console.log("=== ANÁLISIS DE LA RESPUESTA ===");
  const text = result.response.text();
  console.log(`\n1. Longitud del texto recibido: ${text.length} caracteres`);
  console.log(`2. Últimos 100 caracteres del texto:\n"...${text.slice(-100)}"`);
  
  if (result.response.candidates && result.response.candidates.length > 0) {
    const candidate = result.response.candidates[0];
    console.log(`\n3. finishReason del candidato: ${candidate.finishReason}`);
  } else {
    console.log(`\n3. No candidates found`);
  }

  if (result.response.usageMetadata) {
    console.log(`\n4. Usage Metadata:`, result.response.usageMetadata);
  } else {
    console.log(`\n4. Usage Metadata no disponible.`);
  }
}

run().catch(console.error);
