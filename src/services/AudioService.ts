import { getBibleData } from "../data/bible-version";
import {
  REF_AUDIO_B64,
  REF_AUDIO_TEXT,
} from "../data/bible-voice/voiceReference";

export type RunpodStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface AudioParams {
  version: string;
  abbrev: string;
  chapter: number;
  verse?: number;
  text?: string;
  verses?: string[];
  onGenerationStatus?: (status: RunpodStatus) => void;
}

export class AudioService {
  private static R2_ACCOUNT_ID = process.env.EXPO_PUBLIC_R2_ACCOUNT_ID;
  private static R2_BUCKET_NAME = process.env.EXPO_PUBLIC_R2_BUCKET_NAME;
  private static R2_PUBLIC_URL = process.env.EXPO_PUBLIC_R2_PUBLIC_URL;
  private static RUNPOD_API_KEY = process.env.EXPO_PUBLIC_RUNPOD_API_KEY;
  private static RUNPOD_ENDPOINT = `https://api.runpod.ai/v2/${process.env.EXPO_PUBLIC_RUNPOD_SERVERLESS_ID}`;

  private static getR2BaseUrl(): string {
    if (this.R2_PUBLIC_URL) {
      return `${this.R2_PUBLIC_URL}`;
    }
    if (this.R2_ACCOUNT_ID && !this.R2_ACCOUNT_ID.startsWith("http")) {
      return `https://${this.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.R2_BUCKET_NAME}`;
    }
    return `${this.R2_ACCOUNT_ID}/${this.R2_BUCKET_NAME}`;
  }

  static async getAudio({
    version,
    abbrev,
    chapter,
    verse,
    text,
    verses,
    onGenerationStatus,
  }: AudioParams): Promise<string[]> {
    if (verse === undefined) {
      const fileName = `${version.toLowerCase()}-${abbrev.toLowerCase()}-${chapter}.mp3`;
      const r2Url = `${this.getR2BaseUrl()}/${fileName}`;

      try {
        const exists = await this.checkIfExistsInR2(r2Url);
        if (exists) {
          return [r2Url];
        }

        let chapterVerses = verses;
        if (!chapterVerses || chapterVerses.length === 0) {
          const bibleData = getBibleData(version);
          const bookData = bibleData.find((b) => b.abbrev === abbrev);
          chapterVerses = bookData?.chapters[chapter - 1] || [];
        }

        if (chapterVerses && chapterVerses.length > 0) {
          const chapterText = chapterVerses.join(" ");
          const audioUrl = await this.generateOnRunpod(
            chapterText,
            fileName,
            onGenerationStatus,
          );
          return [audioUrl ?? r2Url];
        }

        return [];
      } catch (error) {
        console.error("Erro ao buscar/gerar áudio do capítulo:", error);
        return [];
      }
    }

    const fileName = `${version.toLowerCase()}-${abbrev.toLowerCase()}-${chapter}-${verse}.mp3`;
    const r2Url = `${this.getR2BaseUrl()}/${fileName}`;

    try {
      const exists = await this.checkIfExistsInR2(r2Url);

      if (exists) {
        return [r2Url];
      }

      if (!text) {
        throw new Error("Texto é obrigatório para gerar o áudio no Runpod.");
      }

      const audioUrl = await this.generateOnRunpod(
        text,
        fileName,
        onGenerationStatus,
      );

      return [audioUrl ?? r2Url];
    } catch (error) {
      console.error("Erro ao buscar/gerar áudio:", error);
      throw error;
    }
  }

  private static async checkIfExistsInR2(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.status === 200 || response.status === 206;
    } catch (e) {
      return false;
    }
  }

  private static async generateOnRunpod(
    text: string,
    fileName: string,
    onStatus?: (status: RunpodStatus) => void,
  ): Promise<string | null> {
    const runResponse = await fetch(`${this.RUNPOD_ENDPOINT}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify({
        input: {
          text: text,
          file_name: fileName,
          language: "Auto",
          steps: 16,
          ref_audio_b64: REF_AUDIO_B64,
          ref_text: REF_AUDIO_TEXT,
        },
      }),
    });

    if (!runResponse.ok) {
      throw new Error(`Falha ao chamar Runpod: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const jobId = runData.id;

    let statusData = runData;
    onStatus?.(statusData.status as RunpodStatus);

    while (
      statusData.status !== "COMPLETED" &&
      statusData.status !== "FAILED"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const statusResponse = await fetch(
        `${this.RUNPOD_ENDPOINT}/status/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${this.RUNPOD_API_KEY}`,
          },
        },
      );

      statusData = await statusResponse.json();
      onStatus?.(statusData.status as RunpodStatus);

      if (statusData.status === "FAILED") {
        throw new Error("Erro na geração de áudio no Runpod.");
      }
    }

    return statusData.output?.audio_url ?? null;
  }
}
