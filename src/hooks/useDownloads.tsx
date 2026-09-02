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

const DOWNLOAD_CONCURRENCY = 16;

type Progress = { completed: number; total: number };

export type DownloadQueueItem = { version: string; abbrev: string };

export type DownloadFailure = DownloadQueueItem & { failedChapters: number };

function itemKey(item: DownloadQueueItem): string {
  return `${item.version}:${item.abbrev}`;
}

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
  queue: DownloadQueueItem[];
  activeItem: DownloadQueueItem | null;
  bookProgress: Progress;
  failures: DownloadFailure[];
  refreshSignal: number;
  enqueueBooks: (version: string, abbrevs: string[]) => void;
  cancelAll: () => void;
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
  const [queue, setQueueState] = useState<DownloadQueueItem[]>([]);
  const [activeItem, setActiveItemState] = useState<DownloadQueueItem | null>(
    null,
  );
  const [bookProgress, setBookProgress] = useState<Progress>({
    completed: 0,
    total: 0,
  });
  const [failures, setFailuresState] = useState<DownloadFailure[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const queueRef = useRef<DownloadQueueItem[]>([]);
  const activeItemRef = useRef<DownloadQueueItem | null>(null);
  const failuresRef = useRef<DownloadFailure[]>([]);
  const processingRef = useRef(false);
  const cancelRef = useRef(false);
  const selectedVoiceRef = useRef(selectedVoice);
  selectedVoiceRef.current = selectedVoice;

  const persistQueue = useCallback(async (items: DownloadQueueItem[]) => {
    try {
      if (items.length > 0) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.DOWNLOAD_QUEUE,
          JSON.stringify(items),
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOAD_QUEUE);
      }
    } catch {}
  }, []);

  const persistState = useCallback(() => {
    const items = activeItemRef.current
      ? [activeItemRef.current, ...queueRef.current]
      : [...queueRef.current];
    persistQueue(items);
  }, [persistQueue]);

  const setQueue = useCallback(
    (updater: (prev: DownloadQueueItem[]) => DownloadQueueItem[]) => {
      const next = updater(queueRef.current);
      queueRef.current = next;
      setQueueState(next);
      persistState();
    },
    [persistState],
  );

  const setActiveItem = useCallback(
    (item: DownloadQueueItem | null) => {
      activeItemRef.current = item;
      setActiveItemState(item);
      persistState();
    },
    [persistState],
  );

  const setFailures = useCallback(
    (updater: (prev: DownloadFailure[]) => DownloadFailure[]) => {
      const next = updater(failuresRef.current);
      failuresRef.current = next;
      setFailuresState(next);
    },
    [],
  );

  const recordFailure = useCallback(
    (failure: DownloadFailure) => {
      setFailures((prev) => [
        ...prev.filter((f) => itemKey(f) !== itemKey(failure)),
        failure,
      ]);
    },
    [setFailures],
  );

  const clearFailures = useCallback(
    (keys: Set<string>) => {
      setFailures((prev) => prev.filter((f) => !keys.has(itemKey(f))));
    },
    [setFailures],
  );

  const downloadOneBook = useCallback(
    async (version: string, abbrev: string): Promise<number> => {
      const books = getBibleData(version);
      const book = books.find((b) => b.abbrev === abbrev);
      if (!book) return 0;

      const chapters = Array.from(
        { length: book.chapters.length },
        (_, i) => i + 1,
      );
      let succeeded = 0;
      let failed = 0;
      setBookProgress({ completed: 0, total: chapters.length });

      await runWithConcurrency(
        chapters,
        DOWNLOAD_CONCURRENCY,
        async (chapter) => {
          const uri = await AudioService.downloadChapterAudio(
            version,
            abbrev,
            chapter,
            selectedVoiceRef.current,
          );
          if (uri) {
            succeeded++;
            setBookProgress({ completed: succeeded, total: chapters.length });
          } else {
            failed++;
          }
        },
        () => cancelRef.current,
      );

      return cancelRef.current ? 0 : failed;
    },
    [],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    cancelRef.current = false;

    try {
      while (queueRef.current.length > 0 && !cancelRef.current) {
        const next = queueRef.current[0];
        setActiveItem(next);
        setQueue((prev) => prev.slice(1));

        const failedChapters = await downloadOneBook(next.version, next.abbrev);

        if (!cancelRef.current) {
          if (failedChapters > 0) {
            recordFailure({ ...next, failedChapters });
          } else {
            clearFailures(new Set([itemKey(next)]));
          }
        }

        setActiveItem(null);
        setBookProgress({ completed: 0, total: 0 });
        setRefreshSignal((s) => s + 1);
      }
    } finally {
      processingRef.current = false;
      setActiveItem(null);
      setBookProgress({ completed: 0, total: 0 });
    }
  }, [downloadOneBook, setActiveItem, setQueue, recordFailure, clearFailures]);

  const enqueueBooks = useCallback(
    (version: string, abbrevs: string[]) => {
      if (abbrevs.length === 0) return;
      cancelRef.current = false;
      clearFailures(
        new Set(abbrevs.map((abbrev) => itemKey({ version, abbrev }))),
      );
      setQueue((prev) => {
        const taken = new Set(prev.map(itemKey));
        const activeKey = activeItemRef.current
          ? itemKey(activeItemRef.current)
          : null;
        const additions = abbrevs
          .map((abbrev) => ({ version, abbrev }))
          .filter((item) => {
            const key = itemKey(item);
            return key !== activeKey && !taken.has(key);
          });
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
      processQueue();
    },
    [processQueue, setQueue, clearFailures],
  );

  const cancelAll = useCallback(() => {
    cancelRef.current = true;
    queueRef.current = [];
    setQueueState([]);
    persistQueue([]);
  }, [persistQueue]);

  const deleteBook = useCallback(
    async (version: string, abbrev: string) => {
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
      clearFailures(new Set([itemKey({ version, abbrev })]));
      setRefreshSignal((s) => s + 1);
    },
    [clearFailures],
  );

  const deleteVersion = useCallback(
    async (version: string) => {
      await AudioService.deleteVersionAudio(version, selectedVoiceRef.current);
      setFailures((prev) => prev.filter((f) => f.version !== version));
      setRefreshSignal((s) => s + 1);
    },
    [setFailures],
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_QUEUE);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        const items: DownloadQueueItem[] = parsed.filter(
          (it) =>
            it &&
            typeof it.version === "string" &&
            typeof it.abbrev === "string",
        );
        if (items.length === 0) return;
        queueRef.current = items;
        setQueueState(items);
        processQueue();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      queue,
      activeItem,
      bookProgress,
      failures,
      refreshSignal,
      enqueueBooks,
      cancelAll,
      deleteBook,
      deleteVersion,
    }),
    [
      queue,
      activeItem,
      bookProgress,
      failures,
      refreshSignal,
      enqueueBooks,
      cancelAll,
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

  const downloadingBook =
    ctx.activeItem && ctx.activeItem.version === version
      ? ctx.activeItem.abbrev
      : null;

  const queuedAbbrevs = useMemo(() => {
    const set = new Set<string>();
    ctx.queue.forEach((item) => {
      if (item.version === version) set.add(item.abbrev);
    });
    return set;
  }, [ctx.queue, version]);

  const isBusy = downloadingBook !== null || queuedAbbrevs.size > 0;

  const failedBooks = useMemo(
    () => ctx.failures.filter((f) => f.version === version),
    [ctx.failures, version],
  );

  const failedAbbrevs = useMemo(
    () => new Set(failedBooks.map((f) => f.abbrev)),
    [failedBooks],
  );

  const failedChapterCount = useMemo(
    () => failedBooks.reduce((sum, f) => sum + f.failedChapters, 0),
    [failedBooks],
  );

  const enqueueBook = useCallback(
    (abbrev: string) => ctx.enqueueBooks(version, [abbrev]),
    [ctx, version],
  );

  const retryFailedBooks = useCallback(() => {
    ctx.enqueueBooks(
      version,
      failedBooks.map((f) => f.abbrev),
    );
  }, [ctx, version, failedBooks]);

  const downloadAllBooks = useCallback(() => {
    const incomplete = summaries
      .filter((s) => s.downloadedChapters < s.totalChapters)
      .map((s) => s.abbrev);
    ctx.enqueueBooks(version, incomplete);
  }, [ctx, version, summaries]);

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
    downloadingBook,
    bookProgress:
      downloadingBook !== null ? ctx.bookProgress : { completed: 0, total: 0 },
    queuedAbbrevs,
    queueCount: queuedAbbrevs.size,
    isBusy,
    failedAbbrevs,
    failedBookCount: failedBooks.length,
    failedChapterCount,
    refresh,
    enqueueBook,
    downloadAllBooks,
    retryFailedBooks,
    cancelAll: ctx.cancelAll,
    deleteBook,
    deleteVersion,
  };
}
