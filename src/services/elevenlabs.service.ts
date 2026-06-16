import { env } from "../config/env";
import logger from "../config/logger";

class ElevenLabsService {
  private static instance: ElevenLabsService;
  private readonly baseUrl = "https://api.elevenlabs.io/v1";

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  async textToSpeech(text: string, voiceId: string): Promise<Buffer> {
    if (!env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY no configurada");

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "ElevenLabs TTS error");
      throw new Error(`ElevenLabs error ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();
