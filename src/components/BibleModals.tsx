import React, { useMemo } from 'react';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleBookModal } from './BibleBookModal';
import { BibleNumberModal } from './BibleNumberModal';
import { BibleVersionModal } from './BibleVersionModal';
import { BibleBottomSheet } from './BibleBottomSheet';
import { selectionHaptic } from '../utils/haptics';

export type BibleModalsProps = {
  versionBooks: Book[];
  currentBook: Book;
  chapter: number;
  chapterCount: number;
  verse?: number;
  version?: string;

  versionModalVisible: boolean;
  bookModalVisible: boolean;
  chapterModalVisible: boolean;
  verseModalVisible: boolean;

  setVersionModalVisible: (v: boolean) => void;
  setBookModalVisible: (v: boolean) => void;
  setChapterModalVisible: (v: boolean) => void;
  setVerseModalVisible: (v: boolean) => void;

  onVersionSelect: (version: string, firstBookName: string) => void;
  onBookSelect: (bookName: string) => void;
  onChapterSelect: (chapter: number) => void;
  onVerseSelect: (verse: number) => void;
  skipVerseSelection?: boolean;
};

export function BibleModals(props: BibleModalsProps) {
  const {
    versionBooks, currentBook, chapter, chapterCount, verse, version,
    versionModalVisible, bookModalVisible, chapterModalVisible, verseModalVisible,
    setVersionModalVisible, setBookModalVisible, setChapterModalVisible, setVerseModalVisible,
    onVersionSelect, onBookSelect, onChapterSelect, onVerseSelect,
    skipVerseSelection = false
  } = props;
  const { ms } = useResponsive();
  const [navBook, setNavBook] = React.useState<Book | null>(null);
  const [navChapter, setNavChapter] = React.useState<number | null>(null);

  const closeAllModals = () => {
    setVersionModalVisible(false);
    setBookModalVisible(false);
    setChapterModalVisible(false);
    setVerseModalVisible(false);
  };

  const isAnyVisible = versionModalVisible || bookModalVisible || chapterModalVisible || verseModalVisible;

  React.useEffect(() => {
    if (!isAnyVisible) {
      setNavBook(null);
      setNavChapter(null);
    }
  }, [isAnyVisible]);

  const activeBook = navBook || currentBook;
  const activeChapterCount = activeBook?.chapters?.length || chapterCount;
  const activeChapterNumbers = useMemo(() => Array.from({ length: activeChapterCount }, (_, i) => i + 1), [activeChapterCount]);

  const activeVerseCount = useMemo(() => {
    const ch = navChapter || chapter;
    if (!activeBook?.chapters || !activeBook.chapters[ch - 1]) return 1;
    return activeBook.chapters[ch - 1].length;
  }, [activeBook, navChapter, chapter]);

  const activeVerseNumbers = useMemo(() => Array.from({ length: activeVerseCount }, (_, i) => i + 1), [activeVerseCount]);

  const highlightedBook = currentBook?.abbrev;
  const isShowingCurrentBook = !navBook || navBook.abbrev === currentBook?.abbrev;
  const highlightedChapter = isShowingCurrentBook ? chapter : undefined;
  const isShowingCurrentChapter = isShowingCurrentBook && (!navChapter || navChapter === chapter);
  const highlightedVerse = isShowingCurrentChapter ? verse : undefined;

  return (
    <BibleBottomSheet visible={isAnyVisible} onClose={closeAllModals}>
      <BibleVersionModal
        visible={versionModalVisible}
        currentVersionSigla={version}
        onClose={closeAllModals}
        onSelect={(v) => {
          selectionHaptic();
          onVersionSelect(v.sigla, '');
          setVersionModalVisible(false);
        }}
      />
      <BibleBookModal
        visible={bookModalVisible}
        onClose={closeAllModals}
        books={versionBooks}
        currentBookAbbrev={highlightedBook}
        onSelect={(bookNameOrAbbrev) => {
          selectionHaptic();
          const selectedBookObj = versionBooks.find(b => b.abbrev === bookNameOrAbbrev || b.name === bookNameOrAbbrev) || null;
          setNavBook(selectedBookObj);
          setNavChapter(null);
          setBookModalVisible(false);
          setChapterModalVisible(true);
        }}
      />
      <BibleNumberModal
        visible={chapterModalVisible}
        onClose={closeAllModals}
        onBack={() => {
          setChapterModalVisible(false);
          setBookModalVisible(true);
        }}
        title="Capítulos"
        iconName="list"
        items={activeChapterNumbers}
        currentItem={highlightedChapter}
        onSelect={(num) => {
          selectionHaptic();
          if (skipVerseSelection) {
            if (navBook) onBookSelect(navBook.name);
            onChapterSelect(num);
            setChapterModalVisible(false);
          } else {
            setNavChapter(num);
            setChapterModalVisible(false);
            setVerseModalVisible(true);
          }
        }}
      />
      <BibleNumberModal
        visible={verseModalVisible}
        onClose={closeAllModals}
        onBack={() => {
          setVerseModalVisible(false);
          setChapterModalVisible(true);
        }}
        title="Versículos"
        iconName="hash"
        items={activeVerseNumbers}
        currentItem={highlightedVerse}
        onSelect={(num) => {
          selectionHaptic();
          if (navBook) onBookSelect(navBook.name);
          
          if (navChapter !== null) {
            onChapterSelect(navChapter);
          }
          
          onVerseSelect(num);
          setVerseModalVisible(false);
        }}
      />
    </BibleBottomSheet>
  );
}
