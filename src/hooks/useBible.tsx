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
import { DeviceEventEmitter } from "react-native";
import { STORAGE_KEYS } from "../constants/storage";
import { availableVersions, getBibleData } from "../data/bible-version";
import { getBibleTitles } from "../data/bible-titles";
import { Book, HighlightItem } from "../models";
import { BACKUP_RESTORED_EVENT } from "../utils/backup";
import { useHistory } from "./useHistory";

type BibleContextType = {
  version: string;
  setVersion: (v: string) => void;
  book: string;
  setBook: (b: string) => void;
  chapter: number;
  setChapter: (c: number) => void;
  verse: number;
  setVerse: (v: number) => void;
  versionBooks: Book[];
  currentBook: Book;
  chapterCount: number;
  sectionData: any[];
  visibleChapter: number;
  setVisibleChapter: (c: number) => void;
  visibleVerse: number;
  setVisibleVerse: (v: number) => void;
  blinkingVerse: string | null;
  setBlinkingVerse: (v: string | null) => void;
  highlights: Record<string, HighlightItem>;
  toggleHighlight: (key: string, color: string) => void;
  bulkToggleHighlight: (
    verses: { bookAbbrev: string; chapter: number; verse: number }[],
    color: string | null,
  ) => void;
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  isReady: boolean;
  navigateTo: (p: {
    version?: string;
    book?: string;
    chapter?: number;
    verse?: number;
  }) => void;
  changeChapter: (
    deltaOrValue: number,
    onComplete?: (newChapter: number) => void,
  ) => void;
  addHistoryEntry: (entry: {
    version: string;
    bookAbbrev: string;
    bookName: string;
    chapter: number;
    verse: number;
  }) => Promise<void>;
  isSplitScreen: boolean;
  setIsSplitScreen: (v: boolean) => void;
  secondVersion: string;
  setSecondVersion: (v: string) => void;
  splitOrientation: "vertical" | "horizontal";
  setSplitOrientation: React.Dispatch<
    React.SetStateAction<"vertical" | "horizontal">
  >;
};

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: React.ReactNode }) {
  const { addHistoryEntry } = useHistory();
  const [version, setVersionState] = useState(availableVersions[0] || "NAA");
  const [book, setBookState] = useState("gn");
  const [chapter, setChapterState] = useState(1);
  const [verse, setVerseState] = useState(1);

  const [visibleChapter, setVisibleChapter] = useState(1);
  const [visibleVerse, setVisibleVerse] = useState(1);
  const [blinkingVerse, setBlinkingVerse] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, HighlightItem>>(
    {},
  );
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [secondVersion, setSecondVersion] = useState("ARA");
  const [splitOrientation, setSplitOrientation] = useState<
    "vertical" | "horizontal"
  >("vertical");
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);

  const versionBooks = useMemo(() => getBibleData(version), [version]);

  const currentBook = useMemo(() => {
    return (
      versionBooks.find(
        (item: Book) => item.name === book || item.abbrev === book,
      ) ||
      versionBooks[0] || {
        name: book,
        abbrev: book,
        chapters: [["Nenhum versículo disponível"]],
      }
    );
  }, [versionBooks, book]);

  const chapterCount = currentBook.chapters.length;

  const currentBookIndex = useMemo(() => {
    return versionBooks.findIndex(
      (item: Book) =>
        item.abbrev.toLowerCase() === currentBook.abbrev.toLowerCase() ||
        item.name.toLowerCase() === currentBook.name.toLowerCase(),
    );
  }, [versionBooks, currentBook]);

  const hasPrevChapter = useMemo(() => {
    return chapter > 1 || currentBookIndex > 0;
  }, [chapter, currentBookIndex]);

  const hasNextChapter = useMemo(() => {
    return (
      chapter < chapterCount ||
      (currentBookIndex !== -1 && currentBookIndex < versionBooks.length - 1)
    );
  }, [chapter, chapterCount, currentBookIndex, versionBooks.length]);

  const sectionData = useMemo(() => {
    const verses = currentBook.chapters[chapter - 1] || [];

    const versionTitles = getBibleTitles(version);
    const bookTitles = versionTitles?.books.find(
      (b: any) => b.abbrev.toLowerCase() === currentBook.abbrev.toLowerCase(),
    );
    const chapterTitles =
      bookTitles?.chapters.find((c: any) => c.number === chapter)?.titles || [];

    return [
      {
        title: `${currentBook.name} ${chapter}`,
        data: verses.map((text, i) => {
          const verseNum = i + 1;
          const titlesForVerse = chapterTitles.filter(
            (t) => t.startVerse === verseNum,
          );

          return {
            bookAbbrev: currentBook.abbrev,
            chapter,
            verse: verseNum,
            text,
            titles: titlesForVerse,
          };
        }),
      },
    ];
  }, [currentBook, chapter, version]);

  const updateCurrentRead = useCallback(
    async (v: string, b: string, c: number, ve: number) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_READ,
          JSON.stringify({
            version: v,
            book: b,
            chapter: c,
            verse: ve,
          }),
        );
      } catch (e) {}
    },
    [],
  );

  const loadState = useCallback(async () => {
    try {
      const savedPos = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_READ);

      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (parsed.version) setVersionState(parsed.version);
        if (parsed.book) setBookState(parsed.book);
        if (parsed.chapter) {
          setChapterState(parsed.chapter);
          setVisibleChapter(parsed.chapter);
        }
        if (parsed.verse) {
          setVerseState(parsed.verse);
          setVisibleVerse(parsed.verse);
        }
      } else {
        const firstVersion = availableVersions[0] || "NAA";
        const firstData = getBibleData(firstVersion);
        const firstBook = firstData[0]?.abbrev || "gn";

        setVersionState(firstVersion);
        setBookState(firstBook);
        setChapterState(1);
        setVerseState(1);

        await updateCurrentRead(firstVersion, firstBook, 1, 1);
      }

      const savedHighlights = await AsyncStorage.getItem(
        STORAGE_KEYS.HIGHLIGHTS,
      );
      if (savedHighlights) {
        const parsed = JSON.parse(savedHighlights);
        const normalized: Record<string, HighlightItem> = {};

        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            let abbrev = item.abbrev;
            if (!abbrev && item.book) {
              const books = getBibleData(version);
              const foundBook = books.find(
                (b) =>
                  b.name.toLowerCase() === item.book.toLowerCase() ||
                  b.abbrev.toLowerCase() === item.book.toLowerCase(),
              );
              abbrev = foundBook ? foundBook.abbrev : item.book;
            }
            if (!abbrev) abbrev = "gn";

            const key = `${abbrev}-${item.chapter}-${item.verse}`;
            normalized[key] = {
              color: item.color,
              abbrev,
              chapter: item.chapter,
              verse: item.verse,
            };
          });
        } else if (parsed && typeof parsed === "object") {
          Object.keys(parsed).forEach((key) => {
            const val = parsed[key];
            if (typeof val === "string") {
              const parts = key.split("-");
              const abbrev = parts[0] || "gn";
              const chapter = parseInt(parts[1], 10) || 1;
              const verse = parseInt(parts[2], 10) || 1;
              normalized[key] = {
                color: val,
                abbrev,
                chapter,
                verse,
              };
            } else if (val && typeof val === "object") {
              let abbrev = val.abbrev;
              if (!abbrev && val.book) {
                const books = getBibleData(version);
                const foundBook = books.find(
                  (b) =>
                    b.name.toLowerCase() === val.book.toLowerCase() ||
                    b.abbrev.toLowerCase() === val.book.toLowerCase(),
                );
                abbrev = foundBook ? foundBook.abbrev : val.book;
              }
              if (!abbrev) abbrev = "gn";
              normalized[key] = {
                color: val.color,
                abbrev,
                chapter: val.chapter,
                verse: val.verse,
              };
            }
          });
        }
        setHighlights(normalized);
      }

      const savedCompare = await AsyncStorage.getItem(
        STORAGE_KEYS.BIBLE_COMPARE,
      );
      if (savedCompare) {
        const parsed = JSON.parse(savedCompare);
        if (parsed) {
          if (typeof parsed.isSplitScreen === "boolean") {
            setIsSplitScreen(parsed.isSplitScreen);
          } else if (parsed.versionCompare) {
            setIsSplitScreen(true);
          }
          if (parsed.versionCompare) {
            setSecondVersion(parsed.versionCompare);
          }
          if (
            parsed.splitOrientation === "vertical" ||
            parsed.splitOrientation === "horizontal"
          ) {
            setSplitOrientation(parsed.splitOrientation);
          }
        }
      }
    } catch (e) {
    } finally {
      setIsReady(true);
      isReadyRef.current = true;
    }
  }, [updateCurrentRead]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      BACKUP_RESTORED_EVENT,
      loadState,
    );
    return () => sub.remove();
  }, [loadState]);

  useEffect(() => {
    if (!isReady) return;
    const saveCompare = async () => {
      try {
        if (isSplitScreen) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.BIBLE_COMPARE,
            JSON.stringify({
              isSplitScreen: true,
              versionCurrent: version,
              versionCompare: secondVersion,
              splitOrientation,
            }),
          );
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.BIBLE_COMPARE);
        }
      } catch (e) {}
    };
    saveCompare();
  }, [isReady, isSplitScreen, version, secondVersion, splitOrientation]);

  const setVersion = useCallback(
    (v: string) => {
      setVersionState(v);
      updateCurrentRead(v, book, chapter, verse);
      DeviceEventEmitter.emit("BibleVersionChanged", v);
    },
    [book, chapter, verse, updateCurrentRead],
  );

  const setBook = useCallback(
    (b: string) => {
      setBookState(b);
      updateCurrentRead(version, b, chapter, verse);
    },
    [version, chapter, verse, updateCurrentRead],
  );

  const setChapter = useCallback(
    (c: number) => {
      setChapterState(c);
      updateCurrentRead(version, book, c, verse);
    },
    [version, book, verse, updateCurrentRead],
  );

  const setVerse = useCallback(
    (v: number) => {
      setVerseState(v);
      updateCurrentRead(version, book, chapter, v);
    },
    [version, book, chapter, updateCurrentRead],
  );

  const navigateTo = useCallback(
    (p: {
      version?: string;
      book?: string;
      chapter?: number;
      verse?: number;
    }) => {
      const nextV = p.version || version;
      const nextB = p.book || book;
      const nextC = p.chapter || chapter;
      const nextVe = p.verse || verse;

      setVersionState(nextV);
      setBookState(nextB);
      setChapterState(nextC);
      setVerseState(nextVe);

      updateCurrentRead(nextV, nextB, nextC, nextVe);
      if (p.version) DeviceEventEmitter.emit("BibleVersionChanged", p.version);

      if (p.book || p.chapter || p.verse || p.version) {
        const books = getBibleData(nextV);
        const foundBook = books.find(
          (b) => b.abbrev === nextB || b.name === nextB,
        );
        addHistoryEntry({
          version: nextV,
          bookAbbrev: nextB,
          bookName: foundBook?.name || nextB,
          chapter: nextC,
          verse: nextVe,
        });
      }
    },
    [version, book, chapter, verse, updateCurrentRead, addHistoryEntry],
  );

  const changeChapter = useCallback(
    (deltaOrValue: number, onComplete?: (newChapter: number) => void) => {
      if (deltaOrValue === -1) {
        if (chapter > 1) {
          const nextChapter = chapter - 1;
          setChapterState(nextChapter);
          setVerseState(1);
          updateCurrentRead(version, book, nextChapter, 1);
          addHistoryEntry({
            version,
            bookAbbrev: currentBook.abbrev,
            bookName: currentBook.name,
            chapter: nextChapter,
            verse: 1,
          });
          onComplete?.(nextChapter);
        } else if (currentBookIndex > 0) {
          const prevBook = versionBooks[currentBookIndex - 1];
          const nextChapter = prevBook.chapters.length;
          setBookState(prevBook.abbrev);
          setChapterState(nextChapter);
          setVerseState(1);
          updateCurrentRead(version, prevBook.abbrev, nextChapter, 1);
          addHistoryEntry({
            version,
            bookAbbrev: prevBook.abbrev,
            bookName: prevBook.name,
            chapter: nextChapter,
            verse: 1,
          });
          onComplete?.(nextChapter);
        }
        return;
      }

      if (deltaOrValue === 1) {
        if (chapter < chapterCount) {
          const nextChapter = chapter + 1;
          setChapterState(nextChapter);
          setVerseState(1);
          updateCurrentRead(version, book, nextChapter, 1);
          addHistoryEntry({
            version,
            bookAbbrev: currentBook.abbrev,
            bookName: currentBook.name,
            chapter: nextChapter,
            verse: 1,
          });
          onComplete?.(nextChapter);
        } else if (
          currentBookIndex !== -1 &&
          currentBookIndex < versionBooks.length - 1
        ) {
          const nextBook = versionBooks[currentBookIndex + 1];
          const nextChapter = 1;
          setBookState(nextBook.abbrev);
          setChapterState(nextChapter);
          setVerseState(1);
          updateCurrentRead(version, nextBook.abbrev, nextChapter, 1);
          addHistoryEntry({
            version,
            bookAbbrev: nextBook.abbrev,
            bookName: nextBook.name,
            chapter: nextChapter,
            verse: 1,
          });
          onComplete?.(nextChapter);
        }
        return;
      }

      const nextChapter = deltaOrValue;
      if (nextChapter < 1 || nextChapter > chapterCount) return;

      setChapterState(nextChapter);
      setVerseState(1);
      updateCurrentRead(version, book, nextChapter, 1);
      addHistoryEntry({
        version,
        bookAbbrev: currentBook.abbrev,
        bookName: currentBook.name,
        chapter: nextChapter,
        verse: 1,
      });
      onComplete?.(nextChapter);
    },
    [
      chapter,
      chapterCount,
      currentBookIndex,
      versionBooks,
      currentBook,
      version,
      book,
      updateCurrentRead,
      addHistoryEntry,
    ],
  );

  const toggleHighlight = useCallback((key: string, color: string) => {
    setHighlights((prev) => {
      const next = { ...prev };
      const parts = key.split("-");
      const bookAbbrev = parts[0] || "gn";
      const chapter = parseInt(parts[1], 10) || 1;
      const verse = parseInt(parts[2], 10) || 1;

      if (next[key] && next[key].color === color) {
        delete next[key];
      } else {
        next[key] = {
          color,
          abbrev: bookAbbrev,
          chapter,
          verse,
        };
      }
      const arrayToSave = Object.values(next);
      AsyncStorage.setItem(
        STORAGE_KEYS.HIGHLIGHTS,
        JSON.stringify(arrayToSave),
      ).catch(() => {});
      return next;
    });
  }, []);

  const bulkToggleHighlight = useCallback(
    (
      verses: { bookAbbrev: string; chapter: number; verse: number }[],
      color: string | null,
    ) => {
      setHighlights((prev) => {
        const next = { ...prev };
        verses.forEach((v) => {
          const key = `${v.bookAbbrev}-${v.chapter}-${v.verse}`;
          if (!color || (next[key] && next[key].color === color)) {
            delete next[key];
          } else {
            next[key] = {
              color,
              abbrev: v.bookAbbrev,
              chapter: v.chapter,
              verse: v.verse,
            };
          }
        });
        const arrayToSave = Object.values(next);
        AsyncStorage.setItem(
          STORAGE_KEYS.HIGHLIGHTS,
          JSON.stringify(arrayToSave),
        ).catch(() => {});
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "BibleVersionChanged",
      (newV) => {
        if (newV !== version) setVersionState(newV);
      },
    );
    return () => sub.remove();
  }, [version]);

  return (
    <BibleContext.Provider
      value={{
        version,
        setVersion,
        book,
        setBook,
        chapter,
        setChapter,
        verse,
        setVerse,
        versionBooks,
        currentBook,
        chapterCount,
        sectionData,
        visibleChapter,
        setVisibleChapter,
        visibleVerse,
        setVisibleVerse,
        blinkingVerse,
        setBlinkingVerse,
        highlights,
        toggleHighlight,
        bulkToggleHighlight,
        isReady,
        navigateTo,
        changeChapter,
        hasPrevChapter,
        hasNextChapter,
        addHistoryEntry,
        isSplitScreen,
        setIsSplitScreen,
        secondVersion,
        setSecondVersion,
        splitOrientation,
        setSplitOrientation,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error("useBible must be used within a BibleProvider");
  }
  return context;
}
