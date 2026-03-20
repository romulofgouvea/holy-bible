import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { availableVersions, Book, getBibleData } from '../data';

export function useBible() {
  const [version, setVersion] = useState(availableVersions[0] || 'NAA');
  const versionBooks = useMemo(() => getBibleData(version), [version]);

  const [book, setBook] = useState('gn');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const [visibleChapter, setVisibleChapter] = useState(1);
  const [visibleVerse, setVisibleVerse] = useState(1);

  const [blinkingVerse, setBlinkingVerse] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});

  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);

  const currentState = useRef({ book, chapter, chapterCount: 1 });
  useEffect(() => {
    currentState.current = { book, chapter, chapterCount: currentState.current.chapterCount };
  }, [book, chapter]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const savedPos = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ);
        if (savedPos) {
          const parsed = JSON.parse(savedPos);
          if (parsed.version) setVersion(parsed.version);
          if (parsed.book) setBook(parsed.book);
          if (parsed.chapter) setChapter(parsed.chapter);
          if (parsed.verse) setVerse(parsed.verse);
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
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!isReadyRef.current) return;
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify({ book, chapter, verse, version }));
      } catch (e) { }
    };
    saveState();
  }, [book, chapter, verse, version]);

  const currentBook =
    versionBooks.find((item: Book) => item.name === book || item.abbrev === book) ||
    versionBooks[0] ||
    { name: book, abbrev: book, chapters: [['Nenhum versículo disponível']] };

  const chapterCount = currentBook.chapters?.length || 1;
  useEffect(() => {
    currentState.current.chapterCount = chapterCount;
  }, [chapterCount]);

  const sectionData = useMemo(() => {
    const chapterIndex = chapter - 1;
    const chapterData = currentBook.chapters?.[chapterIndex];
    if (!chapterData) return [];

    return [{
      title: `Capítulo ${chapter}`,
      data: chapterData.map((verseText, verseIndex) => ({
        chapter: chapter,
        verse: verseIndex + 1,
        text: verseText,
      })),
    }];
  }, [currentBook, chapter]);

  const changeChapter = useCallback((delta: number, onChapterChanged?: (newChapter: number) => void) => {
    const { book: currentBookName, chapter: currentChapter, chapterCount: currentChapterCount } = currentState.current;
    
    let nextChapter = currentChapter + delta;
    let nextBookName = currentBookName;

    if (nextChapter > currentChapterCount) {
      const currentBookIndex = versionBooks.findIndex((b: Book) => b.name === currentBookName || b.abbrev === currentBookName);
      if (currentBookIndex >= 0 && currentBookIndex < versionBooks.length - 1) {
        const nextBook = versionBooks[currentBookIndex + 1];
        nextBookName = nextBook.abbrev;
        nextChapter = 1;
      } else {
        return;
      }
    } else if (nextChapter < 1) {
      const currentBookIndex = versionBooks.findIndex((b: Book) => b.name === currentBookName || b.abbrev === currentBookName);
      if (currentBookIndex > 0) {
        const prevBook = versionBooks[currentBookIndex - 1];
        nextBookName = prevBook.abbrev;
        nextChapter = prevBook.chapters?.length || 1;
      } else {
        return;
      }
    }

    currentState.current.book = nextBookName;
    currentState.current.chapter = nextChapter;
    if (nextBookName !== currentBookName) {
      const targetBookObj = versionBooks.find((b: Book) => b.name === nextBookName || b.abbrev === nextBookName);
      currentState.current.chapterCount = targetBookObj?.chapters?.length || 1;
      setBook(nextBookName);
    }
    
    setChapter(nextChapter);
    setVerse(1);
    setVisibleChapter(nextChapter);
    setVisibleVerse(1);
    
    if (onChapterChanged) {
      onChapterChanged(nextChapter);
    }
  }, [versionBooks]);

  const toggleHighlight = useCallback((item: { chapterIndex?: number; verseIndex?: number; chapter: number; verse: number }) => {
    setHighlights((prev) => {
      const key = `${currentBook.abbrev}-${item.chapter}-${item.verse}`;
      const clone = { ...prev };
      if (clone[key]) delete clone[key];
      else clone[key] = true;
      AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(clone)).catch(() => { });
      return clone;
    });
  }, [currentBook.abbrev]);

  const bulkToggleHighlight = useCallback((verses: { chapter: number; verse: number; bookAbbrev: string }[], forceHighlight: boolean) => {
    setHighlights((prev) => {
      const clone = { ...prev };
      verses.forEach((item) => {
        const key = `${item.bookAbbrev}-${item.chapter}-${item.verse}`;
        if (forceHighlight) {
          clone[key] = true;
        } else {
          delete clone[key];
        }
      });
      AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(clone)).catch(() => { });
      return clone;
    });
  }, []);

  const onVersePress = useCallback((item: { chapter: number; verse: number }) => {
    setChapter(item.chapter);
    setVerse(item.verse);
    setVisibleChapter(item.chapter);
    setVisibleVerse(item.verse);
  }, []);

  return {
    isReady,
    version, setVersion, versionBooks,
    book, setBook, currentBook,
    chapter, setChapter, chapterCount,
    verse, setVerse,
    visibleChapter, setVisibleChapter,
    visibleVerse, setVisibleVerse,
    blinkingVerse, setBlinkingVerse,
    highlights, setHighlights,
    sectionData,
    changeChapter,
    onVersePress,
    toggleHighlight,
    bulkToggleHighlight
  };
}
