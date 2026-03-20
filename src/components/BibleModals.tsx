import React, { useMemo } from 'react';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleBookModal } from './BibleBookModal';
import { BibleNumberModal } from './BibleNumberModal';
import { BibleVersionModal } from './BibleVersionModal';

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
};

export function BibleModals(props: BibleModalsProps) {
  const {
    versionBooks, currentBook, chapter, chapterCount,
    versionModalVisible, bookModalVisible, chapterModalVisible, verseModalVisible,
    setVersionModalVisible, setBookModalVisible, setChapterModalVisible, setVerseModalVisible,
    onVersionSelect, onBookSelect, onChapterSelect, onVerseSelect
  } = props;
  const { ms } = useResponsive();
  const fontSize = ms(14);

  const closeAllModals = () => {
    setVersionModalVisible(false);
    setBookModalVisible(false);
    setChapterModalVisible(false);
    setVerseModalVisible(false);
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();



  const chapterNumbers = useMemo(() => Array.from({ length: chapterCount }, (_, i) => i + 1), [chapterCount]);

  const allVerses = useMemo(() => {
    const verses: { chapter: number; verse: number; text: string }[] = [];
    currentBook?.chapters?.forEach((chapterData, chapterIndex) => {
      chapterData.forEach((verseText, verseIndex) => {
        verses.push({ chapter: chapterIndex + 1, verse: verseIndex + 1, text: verseText });
      });
    });
    return verses;
  }, [currentBook]);

  const verseCount = allVerses.filter((item) => item.chapter === chapter).length || 1;
  const verseNumbers = useMemo(() => Array.from({ length: verseCount }, (_, i) => i + 1), [verseCount]);

  return (
    <>
      <BibleVersionModal
        visible={versionModalVisible}
        onClose={closeAllModals}
        onSelect={(v) => {
          onVersionSelect(v.sigla, '');
          setVersionModalVisible(false);
        }}
      />
      <BibleBookModal
        visible={bookModalVisible}
        onClose={closeAllModals}
        books={versionBooks}
        onSelect={(bookName) => {
          onBookSelect(bookName);
          setBookModalVisible(false);
          setChapterModalVisible(true);
        }}
      />
      <BibleNumberModal
        visible={chapterModalVisible}
        onClose={closeAllModals}
        title="Capítulos"
        iconName="list"
        items={chapterNumbers}
        onSelect={(num) => {
          onChapterSelect(num);
          setChapterModalVisible(false);
          setVerseModalVisible(true);
        }}
      />
      <BibleNumberModal
        visible={verseModalVisible}
        onClose={closeAllModals}
        title="Versículos"
        iconName="align-left"
        items={verseNumbers}
        onSelect={(num) => {
          onVerseSelect(num);
          setVerseModalVisible(false);
        }}
      />
    </>
  );
}
