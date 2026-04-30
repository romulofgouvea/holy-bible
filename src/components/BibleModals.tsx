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
      <BibleVersionModal
        visible={versionModalVisible}
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
        onSelect={(bookName) => {
          selectionHaptic();
          onBookSelect(bookName);
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
        items={chapterNumbers}
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
      <BibleNumberModal
        visible={verseModalVisible}
        onClose={closeAllModals}
        onBack={() => {
          setVerseModalVisible(false);
          setChapterModalVisible(true);
        }}
        title="Versículos"
        iconName="hash"
        items={verseNumbers}
        onSelect={(num) => {
          selectionHaptic();
          onVerseSelect(num);
          setVerseModalVisible(false);
        }}
      />
    </BibleBottomSheet>
  );
}
