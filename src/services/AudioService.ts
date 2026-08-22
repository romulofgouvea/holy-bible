import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { DEFAULT_VOICE_ID } from "../constants/audioVoices";
import { ChapterAudioManifest } from "../models";

const IS_WEB = Platform.OS === "web";

interface AudioParams {
  version: string;
  abbrev: string;
  chapter: number;
  verse?: number;
  voice?: string;
}

export const AUDIO_EXTENSIONS = ["flac", "wav", "mp3"] as const;

export interface LocalChapterAudio {
  abbrev: string;
  chapter: number;
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

    try {
      for (const ext of AUDIO_EXTENSIONS) {
        const path = this.getVoiceAudioPath(
          version,
          abbrev,
          chapter,
          resolvedVoice,
          ext,
          verse,
        );
        const r2Url = `${r2Base}/${path}`;
        if (await this.checkIfExistsInR2(r2Url)) {
          return [r2Url];
        }
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

  static getLocalAudioDir(version: string, voice: string): string {
    return `${FileSystem.documentDirectory}audios/${version.toLowerCase()}/${voice}/`;
  }

  static async ensureLocalAudioDir(
    version: string,
    voice: string,
  ): Promise<string> {
    const dir = this.getLocalAudioDir(version, voice);
    if (IS_WEB) return dir;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  }

  static async findLocalAudioUri(
    version: string,
    abbrev: string,
    chapter: number,
    voice: string,
  ): Promise<string | null> {
    if (IS_WEB) return null;
    const dir = this.getLocalAudioDir(version, voice);
    for (const ext of AUDIO_EXTENSIONS) {
      const uri = `${dir}${abbrev.toLowerCase()}-${chapter}.${ext}`;
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && info.size > 0) return uri;
      } catch {}
    }
    return null;
  }

  static async downloadChapterAudio(
    version: string,
    abbrev: string,
    chapter: number,
    voice: string,
    onProgress?: (bytesWritten: number, bytesTotal: number) => void,
  ): Promise<string | null> {
    const existing = await this.findLocalAudioUri(
      version,
      abbrev,
      chapter,
      voice,
    );
    if (existing) return existing;

    const urls = await this.getAudio({ version, abbrev, chapter, voice });
    if (urls.length === 0) return null;

    const remoteUrl = urls[0];
    if (IS_WEB) return remoteUrl;

    const ext = remoteUrl.split("?")[0].split(".").pop() || "mp3";
    const dir = await this.ensureLocalAudioDir(version, voice);
    const localUri = `${dir}${abbrev.toLowerCase()}-${chapter}.${ext}`;

    try {
      const resumable = FileSystem.createDownloadResumable(
        remoteUrl,
        localUri,
        {},
        onProgress
          ? (data) =>
              onProgress(data.totalBytesWritten, data.totalBytesExpectedToWrite)
          : undefined,
      );
      const result = await resumable.downloadAsync();
      return result?.uri ?? null;
    } catch {
      return null;
    }
  }

  static async deleteChapterAudio(
    version: string,
    abbrev: string,
    chapter: number,
    voice: string,
  ): Promise<void> {
    if (IS_WEB) return;
    const uri = await this.findLocalAudioUri(version, abbrev, chapter, voice);
    if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  static async deleteVersionAudio(
    version: string,
    voice: string,
  ): Promise<void> {
    if (IS_WEB) return;
    const dir = this.getLocalAudioDir(version, voice);
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }

  static async listDownloadedChapters(
    version: string,
    voice: string,
  ): Promise<LocalChapterAudio[]> {
    if (IS_WEB) return [];
    const dir = this.getLocalAudioDir(version, voice);
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) return [];
      const files = await FileSystem.readDirectoryAsync(dir);
      const result: LocalChapterAudio[] = [];
      for (const file of files) {
        const base = file.replace(/\.(flac|wav|mp3)$/i, "");
        const idx = base.lastIndexOf("-");
        if (idx === -1) continue;
        const abbrev = base.slice(0, idx);
        const chapter = Number(base.slice(idx + 1));
        if (!abbrev || !Number.isFinite(chapter)) continue;
        result.push({ abbrev, chapter });
      }
      return result;
    } catch {
      return [];
    }
  }

  static async getVersionDownloadedSize(
    version: string,
    voice: string,
  ): Promise<number> {
    if (IS_WEB) return 0;
    const dir = this.getLocalAudioDir(version, voice);
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) return 0;
      const files = await FileSystem.readDirectoryAsync(dir);
      let total = 0;
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${dir}${file}`);
        if (fileInfo.exists) total += fileInfo.size;
      }
      return total;
    } catch {
      return 0;
    }
  }
}
