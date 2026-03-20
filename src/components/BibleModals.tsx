import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Book, availableVersions } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleSelectModal } from './BibleSelectModal';
import { BibleText } from './BibleText';
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

  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [searchVersionQuery, setSearchVersionQuery] = useState('');
  const [searchChapterQuery, setSearchChapterQuery] = useState('');
  const [searchVerseQuery, setSearchVerseQuery] = useState('');

  const closeAllModals = () => {
    setVersionModalVisible(false);
    setBookModalVisible(false);
    setChapterModalVisible(false);
    setVerseModalVisible(false);
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredBooks = useMemo(() => {
    const query = normalize(searchBookQuery.trim());
    if (!query) return versionBooks;
    return versionBooks.filter((item: Book) => {
      const abbrev = normalize(item.abbrev || '');
      const name = normalize(item.name || '');
      return abbrev.includes(query) || name.includes(query);
    });
  }, [searchBookQuery, versionBooks]);

  const filteredVersions = useMemo(() => {
    const query = normalize(searchVersionQuery.trim());
    if (!query) return availableVersions;
    return availableVersions.filter((item) => normalize(item).includes(query));
  }, [searchVersionQuery]);

  const chapterNumbers = useMemo(() => Array.from({ length: chapterCount }, (_, i) => i + 1), [chapterCount]);
  const filteredChapters = useMemo(() => {
    const query = searchChapterQuery.trim().toLowerCase();
    if (!query) return chapterNumbers;
    return chapterNumbers.filter((num) => num.toString().includes(query));
  }, [searchChapterQuery, chapterNumbers]);

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
  const filteredVerses = useMemo(() => {
    const query = searchVerseQuery.trim().toLowerCase();
    if (!query) return verseNumbers;
    return verseNumbers.filter((num) => num.toString().includes(query));
  }, [searchVerseQuery, verseNumbers]);

  return (
    <>
      <BibleVersionModal
        visible={versionModalVisible}
        onClose={closeAllModals}
        onSelect={(v) => {
          onVersionSelect(v.sigla, '');
          setSearchVersionQuery('');
          setVersionModalVisible(false);
        }}
      />
      <BibleSelectModal
        visible={bookModalVisible}
        onClose={closeAllModals}
        title="Selecione o livro"
        placeholder="Buscar por abreviação"
        value={searchBookQuery}
        onChangeText={setSearchBookQuery}
        items={filteredBooks}
        itemKey={(item) => `${item.abbrev}-${item.name}`}
        renderItem={(item) => <BibleText style={[styles.item, { fontSize }]}>{item.abbrev || item.name}</BibleText>}
        onSelect={(item) => {
          onBookSelect(item.name || item.abbrev || '');
          setSearchBookQuery('');
          setBookModalVisible(false);
          setChapterModalVisible(true);
        }}
      />
      <BibleSelectModal
        visible={chapterModalVisible}
        onClose={closeAllModals}
        title="Selecione o capítulo"
        placeholder="Buscar capítulo"
        value={searchChapterQuery}
        onChangeText={setSearchChapterQuery}
        items={filteredChapters}
        itemKey={(item) => item.toString()}
        renderItem={(item) => <BibleText style={[styles.item, { fontSize }]}>{item}</BibleText>}
        onSelect={(num) => {
          onChapterSelect(num);
          setSearchChapterQuery('');
          setChapterModalVisible(false);
          setVerseModalVisible(true);
        }}
        hideSearch
      />
      <BibleSelectModal
        visible={verseModalVisible}
        onClose={closeAllModals}
        title="Selecione o versículo"
        placeholder="Buscar versículo"
        value={searchVerseQuery}
        onChangeText={setSearchVerseQuery}
        items={filteredVerses}
        itemKey={(item) => item.toString()}
        renderItem={(item) => <BibleText style={[styles.item, { fontSize }]}>{item}</BibleText>}
        onSelect={(num) => {
          onVerseSelect(num);
          setSearchVerseQuery('');
          setVerseModalVisible(false);
        }}
        hideSearch
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    color: '#ffffff'
  }
});
