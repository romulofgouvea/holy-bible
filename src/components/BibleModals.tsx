import React, { useMemo } from 'react';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleBottomSheet } from './BibleBottomSheet';
import { VersionPicker } from './modals/VersionPicker';
import { BookPicker } from './modals/BookPicker';
import { NumberPicker } from './modals/NumberPicker';
import { selectionHaptic } from '../utils/haptics';

export type BibleModalsProps = {
  versionBooks: Book[];
  currentBook: Book;
  chapter: number;
  chapterCount: number;

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
    versionBooks, currentBook, chapter, chapterCount,
    versionModalVisible, bookModalVisible, chapterModalVisible, verseModalVisible,
    setVersionModalVisible, setBookModalVisible, setChapterModalVisible, setVerseModalVisible,
    onVersionSelect, onBookSelect, onChapterSelect, onVerseSelect,
    skipVerseSelection = false
  } = props;
  const { ms } = useResponsive();

  const closeAllModals = () => {
    setVersionModalVisible(false);
    setBookModalVisible(false);
    setChapterModalVisible(false);
    setVerseModalVisible(false);
  };

  const isAnyVisible = versionModalVisible || bookModalVisible || chapterModalVisible || verseModalVisible;

  const chapterNumbers = useMemo(() => Array.from({ length: chapterCount }, (_, i) => i + 1), [chapterCount]);

  const verseCount = useMemo(() => {
    if (!currentBook?.chapters || !currentBook.chapters[chapter - 1]) return 1;
    return currentBook.chapters[chapter - 1].length;
  }, [currentBook, chapter]);

  const verseNumbers = useMemo(() => Array.from({ length: verseCount }, (_, i) => i + 1), [verseCount]);

  return (
    <BibleBottomSheet visible={isAnyVisible} onClose={closeAllModals}>
      {versionModalVisible && (
        <VersionPicker
          onClose={closeAllModals}
          onSelect={(v) => {
            selectionHaptic();
            onVersionSelect(v, '');
            setVersionModalVisible(false);
          }}
        />
      )}
      {bookModalVisible && (
        <BookPicker
          books={versionBooks}
          onClose={closeAllModals}
          onSelect={(name) => {
            selectionHaptic();
            onBookSelect(name);
            setBookModalVisible(false);
            setChapterModalVisible(true);
          }}
        />
      )}
      {chapterModalVisible && (
        <NumberPicker
          title="Capítulos"
          items={chapterNumbers}
          activeNumber={chapter}
          onClose={closeAllModals}
          onBack={() => {
            setChapterModalVisible(false);
            setBookModalVisible(true);
          }}
          onSelect={(num) => {
            selectionHaptic();
            onChapterSelect(num);
            setChapterModalVisible(false);
            if (skipVerseSelection) {
              onVerseSelect(1);
            } else {
              setVerseModalVisible(true);
            }
          }}
        />
      )}
      {verseModalVisible && (
        <NumberPicker
          title="Versículos"
          items={verseNumbers}
          onClose={closeAllModals}
          onBack={() => {
            setVerseModalVisible(false);
            setChapterModalVisible(true);
          }}
          onSelect={(num) => {
            selectionHaptic();
            onVerseSelect(num);
            setVerseModalVisible(false);
          }}
        />
      )}
    </BibleBottomSheet>
  );
}
