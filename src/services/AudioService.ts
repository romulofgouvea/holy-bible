import { DEFAULT_VOICE_ID } from "../constants/audioVoices";
import { ChapterAudioManifest } from "../models";

interface AudioParams {
  version: string;
  abbrev: string;
  chapter: number;
  verse?: number;
  voice?: string;
}

export class AudioService {
  private static R2_ACCOUNT_ID = process.env.EXPO_PUBLIC_R2_ACCOUNT_ID;
  private static R2_BUCKET_NAME = process.env.EXPO_PUBLIC_R2_BUCKET_NAME;
  private static R2_PUBLIC_URL = process.env.EXPO_PUBLIC_R2_PUBLIC_URL;

  private static getR2BaseUrl(): string | null {
    if (this.R2_PUBLIC_URL) {
      return this.R2_PUBLIC_URL;
    }
    if (this.R2_ACCOUNT_ID && this.R2_BUCKET_NAME) {
      if (this.R2_ACCOUNT_ID.startsWith("http")) {
        return `${this.R2_ACCOUNT_ID}/${this.R2_BUCKET_NAME}`;
      }
      return `https://${this.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.R2_BUCKET_NAME}`;
    }
    return null;
  }

  private static getVoiceAudioPath(
    version: string,
    abbrev: string,
    chapter: number,
    voice: string,
    ext: string,
    verse?: number,
  ): string {
    const file = verse
      ? `${abbrev.toLowerCase()}-${chapter}-${verse}`
      : `${abbrev.toLowerCase()}-${chapter}`;
    return `${version.toLowerCase()}/audios/${voice}/${file}.${ext}`;
  }

  static async getAudio({
    version,
    abbrev,
    chapter,
    verse,
    voice,
  }: AudioParams): Promise<string[]> {
    const r2Base = this.getR2BaseUrl();
    if (!r2Base) {
      console.error(
        "AudioService: R2 não configurado (EXPO_PUBLIC_R2_PUBLIC_URL ou EXPO_PUBLIC_R2_ACCOUNT_ID/EXPO_PUBLIC_R2_BUCKET_NAME ausentes no .env).",
      );
      return [];
    }

    const resolvedVoice = voice ?? DEFAULT_VOICE_ID;
    const path = this.getVoiceAudioPath(
      version,
      abbrev,
      chapter,
      resolvedVoice,
      "wav",
      verse,
    );
    const r2WavUrl = `${r2Base}/${path}`;
    const r2Url = r2WavUrl.replace(/\.wav$/, ".mp3");

    try {
      if (await this.checkIfExistsInR2(r2WavUrl)) {
        return [r2WavUrl];
      }
      if (await this.checkIfExistsInR2(r2Url)) {
        return [r2Url];
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar áudio:", error);
      return [];
    }
  }

  static async getVerseTimings(
    version: string,
    abbrev: string,
    chapter: number,
    voice?: string,
  ): Promise<ChapterAudioManifest | null> {
    const r2Base = this.getR2BaseUrl();
    if (!r2Base) return null;

    const path = this.getVoiceAudioPath(
      version,
      abbrev,
      chapter,
      voice ?? DEFAULT_VOICE_ID,
      "json",
    );
    const r2Url = `${r2Base}/${path}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(r2Url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;
      return (await response.json()) as ChapterAudioManifest;
    } catch {
      return null;
    }
  }

  private static async checkIfExistsInR2(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.status === 200 || response.status === 206;
    } catch {
      return false;
    }
  }
}
