import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { availableVersions, Book, getBibleData } from '../data';
import { useHistory } from './useHistory';

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
  highlights: Record<string, string>;
  toggleHighlight: (key: string, color: string) => void;
  bulkToggleHighlight: (verses: { bookAbbrev: string; chapter: number; verse: number }[], color: string | null) => void;
  isReady: boolean;
  navigateTo: (p: { version?: string; book?: string; chapter?: number; verse?: number }) => void;
  changeChapter: (deltaOrValue: number, onComplete?: (newChapter: number) => void) => void;
  addHistoryEntry: (entry: { version: string; bookAbbrev: string; bookName: string; chapter: number; verse: number }) => Promise<void>;
};

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: React.ReactNode }) {
  const { addHistoryEntry } = useHistory();
  const [version, setVersionState] = useState(availableVersions[0] || 'NAA');
  const [book, setBookState] = useState('gn');
  const [chapter, setChapterState] = useState(1);
  const [verse, setVerseState] = useState(1);
  
  const [visibleChapter, setVisibleChapter] = useState(1);
  const [visibleVerse, setVisibleVerse] = useState(1);
  const [blinkingVerse, setBlinkingVerse] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);

  const versionBooks = useMemo(() => getBibleData(version), [version]);

  const currentBook = useMemo(() => {
    return versionBooks.find((item: Book) => item.name === book || item.abbrev === book) ||
      versionBooks[0] ||
      { name: book, abbrev: book, chapters: [['Nenhum versículo disponível']] };
  }, [versionBooks, book]);

  const chapterCount = currentBook.chapters.length;

  const sectionData = useMemo(() => {
    const verses = currentBook.chapters[chapter - 1] || [];
    return [{
      title: `${currentBook.name} ${chapter}`,
      data: verses.map((text, i) => ({
        bookAbbrev: currentBook.abbrev,
        chapter,
        verse: i + 1,
        text
      }))
    }];
  }, [currentBook, chapter]);

  const updateCurrentRead = useCallback(async (v: string, b: string, c: number, ve: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_READ, JSON.stringify({
        version: v,
        book: b,
        chapter: c,
        verse: ve
      }));
    } catch (e) { }
  }, []);

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
        const firstVersion = availableVersions[0] || 'NAA';
        const firstData = getBibleData(firstVersion);
        const firstBook = firstData[0]?.abbrev || 'gn';

        setVersionState(firstVersion);
        setBookState(firstBook);
        setChapterState(1);
        setVerseState(1);

        await updateCurrentRead(firstVersion, firstBook, 1, 1);
      }

      const savedHighlights = await AsyncStorage.getItem(STORAGE_KEYS.HIGHLIGHTS);
      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
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

  const setVersion = useCallback((v: string) => {
    setVersionState(v);
    updateCurrentRead(v, book, chapter, verse);
    DeviceEventEmitter.emit('BibleVersionChanged', v);
  }, [book, chapter, verse, updateCurrentRead]);

  const setBook = useCallback((b: string) => {
    setBookState(b);
    updateCurrentRead(version, b, chapter, verse);
  }, [version, chapter, verse, updateCurrentRead]);

  const setChapter = useCallback((c: number) => {
    setChapterState(c);
    updateCurrentRead(version, book, c, verse);
  }, [version, book, verse, updateCurrentRead]);

  const setVerse = useCallback((v: number) => {
    setVerseState(v);
    updateCurrentRead(version, book, chapter, v);
  }, [version, book, chapter, updateCurrentRead]);

  const navigateTo = useCallback((p: { version?: string; book?: string; chapter?: number; verse?: number }) => {
    const nextV = p.version || version;
    const nextB = p.book || book;
    const nextC = p.chapter || chapter;
    const nextVe = p.verse || verse;

    setVersionState(nextV);
    setBookState(nextB);
    setChapterState(nextC);
    setVerseState(nextVe);

    updateCurrentRead(nextV, nextB, nextC, nextVe);
    if (p.version) DeviceEventEmitter.emit('BibleVersionChanged', p.version);

    if (p.book || p.chapter || p.verse || p.version) {
      const books = getBibleData(nextV);
      const foundBook = books.find((b) => b.abbrev === nextB || b.name === nextB);
      addHistoryEntry({
        version: nextV,
        bookAbbrev: nextB,
        bookName: foundBook?.name || nextB,
        chapter: nextC,
        verse: nextVe
      });
    }
  }, [version, book, chapter, verse, updateCurrentRead, addHistoryEntry]);

  const changeChapter = useCallback((deltaOrValue: number, onComplete?: (newChapter: number) => void) => {
    let nextChapter = chapter;
    if (deltaOrValue === 1 || deltaOrValue === -1) {
      nextChapter = chapter + deltaOrValue;
    } else {
      nextChapter = deltaOrValue;
    }

    if (nextChapter < 1 || nextChapter > chapterCount) return;

    setChapterState(nextChapter);
    setVerseState(1);

    AsyncStorage.setItem(STORAGE_KEYS.CURRENT_READ, JSON.stringify({
      version,
      book,
      chapter: nextChapter,
      verse: 1
    })).catch(() => { });

    onComplete?.(nextChapter);
  }, [chapter, chapterCount, version, book]);

  const toggleHighlight = useCallback((key: string, color: string) => {
    setHighlights(prev => {
      const next = { ...prev };
      if (next[key] === color) {
        delete next[key];
      } else {
        next[key] = color;
      }
      AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(next)).catch(() => { });
      return next;
    });
  }, []);

  const bulkToggleHighlight = useCallback((verses: { bookAbbrev: string; chapter: number; verse: number }[], color: string | null) => {
    setHighlights(prev => {
      const next = { ...prev };
      verses.forEach(v => {
        const key = `${v.bookAbbrev}-${v.chapter}-${v.verse}`;
        if (!color || next[key] === color) {
          delete next[key];
        } else {
          next[key] = color;
        }
      });
      AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(next)).catch(() => { });
      return next;
    });
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('BibleVersionChanged', (newV) => {
      if (newV !== version) setVersionState(newV);
    });
    return () => sub.remove();
  }, [version]);

  return (
    <BibleContext.Provider value={{
      version, setVersion,
      book, setBook,
      chapter, setChapter,
      verse, setVerse,
      versionBooks, currentBook, chapterCount, sectionData,
      visibleChapter, setVisibleChapter,
      visibleVerse, setVisibleVerse,
      blinkingVerse, setBlinkingVerse,
      highlights, toggleHighlight, bulkToggleHighlight,
      isReady, navigateTo, changeChapter, addHistoryEntry
    }}>
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
}
