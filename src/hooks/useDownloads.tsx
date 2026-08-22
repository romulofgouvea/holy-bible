import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { STORAGE_KEYS } from "../constants/storage";
import { getBibleData } from "../data/bible-version";
import { BookDownloadSummary } from "../models";
import { AudioService } from "../services/AudioService";
import { useAudioSettings } from "./useAudioSettings";

const DOWNLOAD_CONCURRENCY = 4;

type Progress = { completed: number; total: number };

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
  shouldStop: () => boolean,
): Promise<void> {
  let cursor = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        if (shouldStop()) return;
        const index = cursor;
        cursor += 1;
        await worker(items[index], index);
      }
    },
  );

  await Promise.all(runners);
}

type DownloadsContextType = {
  activeVersion: string | null;
  downloadingBook: string | null;
  bookProgress: Progress;
  isBulkDownloading: boolean;
  bulkBookProgress: Progress;
  refreshSignal: number;
  downloadBook: (version: string, abbrev: string) => Promise<void>;
  downloadAllBooks: (version: string) => Promise<void>;
  cancelDownload: () => void;
  deleteBook: (version: string, abbrev: string) => Promise<void>;
  deleteVersion: (version: string) => Promise<void>;
};

const DownloadsContext = createContext<DownloadsContextType>(
  {} as DownloadsContextType,
);

export const DownloadsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { selectedVoice } = useAudioSettings();
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [downloadingBook, setDownloadingBook] = useState<string | null>(null);
  const [bookProgress, setBookProgress] = useState<Progress>({
    completed: 0,
    total: 0,
  });
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkBookProgress, setBulkBookProgress] = useState<Progress>({
    completed: 0,
    total: 0,
  });
  const [refreshSignal, setRefreshSignal] = useState(0);

  const cancelRef = useRef(false);
  const selectedVoiceRef = useRef(selectedVoice);
  selectedVoiceRef.current = selectedVoice;

  const persistActiveDownload = useCallback(async (version: string | null) => {
    try {
      if (version) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACTIVE_DOWNLOAD_VERSION,
          version,
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_DOWNLOAD_VERSION);
      }
    } catch {}
  }, []);

  const downloadBook = useCallback(async (version: string, abbrev: string) => {
    const books = getBibleData(version);
    const book = books.find((b) => b.abbrev === abbrev);
    if (!book) return;

    setActiveVersion(version);
    setDownloadingBook(abbrev);
    const chapters = Array.from(
      { length: book.chapters.length },
      (_, i) => i + 1,
    );
    let completed = 0;
    setBookProgress({ completed: 0, total: chapters.length });

    await runWithConcurrency(
      chapters,
      DOWNLOAD_CONCURRENCY,
      async (chapter) => {
        await AudioService.downloadChapterAudio(
          version,
          abbrev,
          chapter,
          selectedVoiceRef.current,
        );
        completed++;
        setBookProgress({ completed, total: chapters.length });
      },
      () => cancelRef.current,
    );

    setDownloadingBook(null);
    setRefreshSignal((s) => s + 1);
  }, []);

  const downloadAllBooks = useCallback(
    async (version: string) => {
      const books = getBibleData(version);
      cancelRef.current = false;
      setActiveVersion(version);
      setIsBulkDownloading(true);
      setBulkBookProgress({ completed: 0, total: books.length });
      await persistActiveDownload(version);

      for (let i = 0; i < books.length; i++) {
        if (cancelRef.current) break;
        await downloadBook(version, books[i].abbrev);
        setBulkBookProgress({ completed: i + 1, total: books.length });
      }

      setIsBulkDownloading(false);
      setActiveVersion(null);
      await persistActiveDownload(null);
    },
    [downloadBook, persistActiveDownload],
  );

  const cancelDownload = useCallback(() => {
    cancelRef.current = true;
    persistActiveDownload(null);
  }, [persistActiveDownload]);

  const deleteBook = useCallback(async (version: string, abbrev: string) => {
    const books = getBibleData(version);
    const book = books.find((b) => b.abbrev === abbrev);
    if (!book) return;

    for (let ch = 1; ch <= book.chapters.length; ch++) {
      await AudioService.deleteChapterAudio(
        version,
        abbrev,
        ch,
        selectedVoiceRef.current,
      );
    }
    setRefreshSignal((s) => s + 1);
  }, []);

  const deleteVersion = useCallback(async (version: string) => {
    await AudioService.deleteVersionAudio(version, selectedVoiceRef.current);
    setRefreshSignal((s) => s + 1);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const pendingVersion = await AsyncStorage.getItem(
          STORAGE_KEYS.ACTIVE_DOWNLOAD_VERSION,
        );
        if (pendingVersion) {
          downloadAllBooks(pendingVersion);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      activeVersion,
      downloadingBook,
      bookProgress,
      isBulkDownloading,
      bulkBookProgress,
      refreshSignal,
      downloadBook,
      downloadAllBooks,
      cancelDownload,
      deleteBook,
      deleteVersion,
    }),
    [
      activeVersion,
      downloadingBook,
      bookProgress,
      isBulkDownloading,
      bulkBookProgress,
      refreshSignal,
      downloadBook,
      downloadAllBooks,
      cancelDownload,
      deleteBook,
      deleteVersion,
    ],
  );

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
};

export function useDownloads(version: string) {
  const { selectedVoice } = useAudioSettings();
  const ctx = useContext(DownloadsContext);
  const [isLoaded, setIsLoaded] = useState(false);
  const [summaries, setSummaries] = useState<BookDownloadSummary[]>([]);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);

  const refresh = useCallback(async () => {
    const books = getBibleData(version);
    const downloaded = await AudioService.listDownloadedChapters(
      version,
      selectedVoice,
    );
    const downloadedSet = new Set(
      downloaded.map((d) => `${d.abbrev.toLowerCase()}-${d.chapter}`),
    );

    const nextSummaries: BookDownloadSummary[] = books.map((book) => {
      const totalChapters = book.chapters.length;
      let downloadedChapters = 0;
      for (let ch = 1; ch <= totalChapters; ch++) {
        if (downloadedSet.has(`${book.abbrev.toLowerCase()}-${ch}`)) {
          downloadedChapters++;
        }
      }
      return {
        abbrev: book.abbrev,
        name: book.name,
        totalChapters,
        downloadedChapters,
      };
    });

    const size = await AudioService.getVersionDownloadedSize(
      version,
      selectedVoice,
    );

    setSummaries(nextSummaries);
    setTotalSizeBytes(size);
    setIsLoaded(true);
  }, [version, selectedVoice]);

  useEffect(() => {
    setIsLoaded(false);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (ctx.refreshSignal > 0) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.refreshSignal]);

  const isThisVersionActive = ctx.activeVersion === version;

  const downloadBook = useCallback(
    (abbrev: string) => ctx.downloadBook(version, abbrev),
    [ctx, version],
  );
  const downloadAllBooks = useCallback(
    () => ctx.downloadAllBooks(version),
    [ctx, version],
  );
  const deleteBook = useCallback(
    (abbrev: string) => ctx.deleteBook(version, abbrev),
    [ctx, version],
  );
  const deleteVersion = useCallback(
    () => ctx.deleteVersion(version),
    [ctx, version],
  );

  return {
    isLoaded,
    summaries,
    totalSizeBytes,
    downloadingBook: isThisVersionActive ? ctx.downloadingBook : null,
    bookProgress: isThisVersionActive
      ? ctx.bookProgress
      : { completed: 0, total: 0 },
    isBulkDownloading: isThisVersionActive && ctx.isBulkDownloading,
    bulkBookProgress: isThisVersionActive
      ? ctx.bulkBookProgress
      : { completed: 0, total: 0 },
    isOtherVersionDownloading: !!ctx.activeVersion && !isThisVersionActive,
    refresh,
    downloadBook,
    downloadAllBooks,
    cancelDownload: ctx.cancelDownload,
    deleteBook,
    deleteVersion,
  };
}
