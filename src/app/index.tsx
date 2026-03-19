import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SelectModal } from '../components/select-modal';
import { TopBar } from '../components/top-bar';
import { VerseReader } from '../components/verse-reader';

import KJFData from '../data/KJF.json';
import NAAData from '../data/NAA.json';

type Book = {
  abbrev: string;
  name: string;
  chapters: string[][];
};

type BibleVersion = 'NAA' | 'KJF';

type KJFBibleData = {
  books: Book[];
};

const versions: BibleVersion[] = ['NAA', 'KJF'];

const booksByVersion: Record<BibleVersion, Book[]> = {
  NAA: NAAData as Book[],
  KJF: (KJFData as unknown as KJFBibleData).books,
};

export default function HomeScreen() {
  const [version, setVersion] = useState<BibleVersion>('NAA');
  const versionBooks = booksByVersion[version] || [];

  const [book, setBook] = useState('Gênesis');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const [visibleChapter, setVisibleChapter] = useState(1);
  const [visibleVerse, setVisibleVerse] = useState(1);

  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [searchVersionQuery, setSearchVersionQuery] = useState('');
  const [searchChapterQuery, setSearchChapterQuery] = useState('');
  const [searchVerseQuery, setSearchVerseQuery] = useState('');

  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);

  const [blinkingVerse, setBlinkingVerse] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadState = async () => {
      try {
        const savedPos = await AsyncStorage.getItem('bible-last-read');
        if (savedPos) {
          const { book, chapter, verse, version } = JSON.parse(savedPos);
          if (version) setVersion(version);
          if (book) setBook(book);
          if (chapter) setChapter(chapter);
          if (verse) setVerse(verse);
        }
        const savedHighlights = await AsyncStorage.getItem('bible-highlights');
        if (savedHighlights) {
          setHighlights(JSON.parse(savedHighlights));
        }
      } catch (e) {}
    };
    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('bible-last-read', JSON.stringify({ book, chapter, verse, version }));
      } catch (e) {}
    };
    saveState();
  }, [book, chapter, verse, version]);

  const currentBook =
    versionBooks.find((item: Book) => item.name === book || item.abbrev === book) ||
    versionBooks[0] ||
    { name: book, abbrev: book, chapters: [['Nenhum versículo disponível']] };

  const filteredBooks = useMemo(() => {
    const query = searchBookQuery.trim().toLowerCase();
    if (!query) return versionBooks;

    return versionBooks.filter((item: Book) => {
      const abbrev = (item.abbrev || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return abbrev.includes(query) || name.includes(query);
    });
  }, [searchBookQuery, versionBooks]);

  const filteredVersions = useMemo(() => {
    const query = searchVersionQuery.trim().toLowerCase();
    if (!query) return versions;
    return versions.filter((item) => item.toLowerCase().includes(query));
  }, [searchVersionQuery]);

  const chapterCount = currentBook.chapters?.length || 1;
  const chapterNumbers = useMemo(
    () => Array.from({ length: chapterCount }, (_, i) => i + 1),
    [chapterCount]
  );

  const filteredChapters = useMemo(() => {
    const query = searchChapterQuery.trim().toLowerCase();
    if (!query) return chapterNumbers;
    return chapterNumbers.filter((num) => num.toString().includes(query));
  }, [searchChapterQuery, chapterNumbers]);

  const allVerses = useMemo(() => {
    const verses: { chapter: number; verse: number; text: string }[] = [];
    currentBook.chapters?.forEach((chapterData, chapterIndex) => {
      chapterData.forEach((verseText, verseIndex) => {
        verses.push({ chapter: chapterIndex + 1, verse: verseIndex + 1, text: verseText });
      });
    });
    return verses;
  }, [currentBook]);

  const verseCount = allVerses.filter((item) => item.chapter === chapter).length || 1;
  const verseNumbers = useMemo(
    () => Array.from({ length: verseCount }, (_, i) => i + 1),
    [verseCount]
  );

  const filteredVerses = useMemo(() => {
    const query = searchVerseQuery.trim().toLowerCase();
    if (!query) return verseNumbers;
    return verseNumbers.filter((num) => num.toString().includes(query));
  }, [searchVerseQuery, verseNumbers]);

  const currentTitle = `${currentBook.name} ${visibleChapter}:${visibleVerse}`;
  const sectionListRef = useRef<any>(null);

  const sectionData = useMemo(() => {
    return currentBook.chapters?.map((chapterData, chapterIndex) => ({
      title: `Capítulo ${chapterIndex + 1}`,
      data: chapterData.map((verseText, verseIndex) => ({
        chapter: chapterIndex + 1,
        verse: verseIndex + 1,
        text: verseText,
      })),
    })) || [];
  }, [currentBook]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const firstVisible = viewableItems.find((v) => v.item && v.item.chapter && v.item.verse)?.item;
    if (firstVisible) {
      // Apenas atualiza o índice visível, não o selecioando.
      setVisibleChapter(firstVisible.chapter);
      setVisibleVerse(firstVisible.verse);
    }
  });

  useEffect(() => {
    setVisibleChapter(chapter);
    setVisibleVerse(verse);
  }, [chapter, verse]);

  const closeAllModals = () => {
    setVersionModalVisible(false);
    setBookModalVisible(false);
    setChapterModalVisible(false);
    setVerseModalVisible(false);
  };

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const changeChapter = useCallback((delta: number) => {
    setChapter((prev) => {
      const nextChapter = clamp(prev + delta, 1, chapterCount);
      if (nextChapter === prev) return prev;
      setVerse(1);
      setVisibleChapter(nextChapter);
      setVisibleVerse(1);
      setTimeout(() => scrollToVerse(1, nextChapter), 300);
      return nextChapter;
    });
  }, [chapterCount]);

  const onVersePress = useCallback((item: { chapter: number; verse: number }) => {
    setChapter(item.chapter);
    setVerse(item.verse);
    setVisibleChapter(item.chapter);
    setVisibleVerse(item.verse);
  }, []);

  const onVerseLongPress = useCallback((item: { chapter: number; verse: number }) => {
    setHighlights((prev) => {
      const key = `${currentBook.abbrev}-${item.chapter}-${item.verse}`;
      const clone = { ...prev };
      if (clone[key]) delete clone[key];
      else clone[key] = true;
      AsyncStorage.setItem('bible-highlights', JSON.stringify(clone)).catch(() => {});
      return clone;
    });
  }, [currentBook.abbrev]);

  const scrollToVerse = useCallback((verseNumber: number, chapterNumber = chapter) => {
    const sectionIndex = Math.max(0, chapterNumber - 1);
    const itemIndex = Math.max(0, verseNumber - 1);
    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex, itemIndex, animated: true, viewPosition: 0 });
      setBlinkingVerse(`${chapterNumber}-${verseNumber}`);
      setTimeout(() => setBlinkingVerse(null), 1500);
    } catch (error) {
      // Ignore error, onScrollToIndexFailed will retry
    }
  }, [chapter]);

  const onScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    setTimeout(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: Math.max(0, chapter - 1),
          itemIndex: Math.max(0, verse - 1),
          animated: true,
          viewPosition: 0,
        });
      } catch (error) {
        // Stop retrying if double failure
      }
    }, 500);
  }, [chapter, verse]);

  // useEffect and autoScroll removed in favor of explicit scrolling

  return (
    <View style={styles.page}>
      <TopBar
        version={version}
        bookName={currentBook.name}
        currentChapter={visibleChapter}
        onOpenVersion={() => setVersionModalVisible(true)}
        onOpenBook={() => setBookModalVisible(true)}
        onOpenChapter={() => setChapterModalVisible(true)}
        onPrevChapter={() => changeChapter(-1)}
        onNextChapter={() => changeChapter(1)}
      />

      <View style={styles.content}>
        <VerseReader
          listRef={sectionListRef}
          sections={sectionData}
          blinkingVerse={blinkingVerse}
          highlights={highlights}
          bookAbbrev={currentBook.abbrev}
          onVersePress={onVersePress}
          onVerseLongPress={onVerseLongPress}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />
      </View>

      <SelectModal
        visible={versionModalVisible}
        onClose={closeAllModals}
        title="Selecione a versão"
        placeholder="Buscar versão"
        value={searchVersionQuery}
        onChangeText={setSearchVersionQuery}
        items={filteredVersions}
        itemKey={(item) => item}
        renderItem={(item) => <Text style={styles.item}>{item}</Text>}
        onSelect={(item) => {
          const targetVersion = item as BibleVersion;
          setVersion(targetVersion);
          const firstBook = booksByVersion[targetVersion]?.[0];
          if (firstBook) {
            setBook(firstBook.name || firstBook.abbrev);
          }
          setChapter(1);
          setVerse(1);
          setSearchVersionQuery('');
          setSearchBookQuery('');
          setSearchChapterQuery('');
          setSearchVerseQuery('');
          setVersionModalVisible(false);
          setBookModalVisible(true);
        }}
      />

      <SelectModal
        visible={bookModalVisible}
        onClose={closeAllModals}
        title="Selecione o livro"
        placeholder="Buscar por abreviação"
        value={searchBookQuery}
        onChangeText={setSearchBookQuery}
        items={filteredBooks}
        itemKey={(item) => `${item.abbrev}-${item.name}`}
        renderItem={(item) => <Text style={styles.item}>{item.abbrev || item.name}</Text>}
        onSelect={(item) => {
          setBook(item.name || item.abbrev || '');
          setChapter(1);
          setVerse(1);
          setBookModalVisible(false);
          setChapterModalVisible(true);
          setSearchBookQuery('');
          setSearchChapterQuery('');
          setSearchVerseQuery('');
        }}
      />

      <SelectModal
        visible={chapterModalVisible}
        onClose={closeAllModals}
        title="Selecione o capítulo"
        placeholder="Buscar capítulo"
        value={searchChapterQuery}
        onChangeText={setSearchChapterQuery}
        items={chapterNumbers}
        itemKey={(item) => item.toString()}
        renderItem={(item) => <Text style={styles.item}>{item}</Text>}
        onSelect={(num) => {
          setChapter(num);
          setVerse(1);
          setChapterModalVisible(false);
          setVerseModalVisible(true);
          setSearchChapterQuery('');
          setSearchVerseQuery('');
        }}
      />

      <SelectModal
        visible={verseModalVisible}
        onClose={closeAllModals}
        title="Selecione o versículo"
        placeholder="Buscar versículo"
        value={searchVerseQuery}
        onChangeText={setSearchVerseQuery}
        items={verseNumbers}
        itemKey={(item) => item.toString()}
        renderItem={(item) => <Text style={styles.item}>{item}</Text>}
        onSelect={(num) => {
          setVerse(num);
          setVerseModalVisible(false);
          setSearchVerseQuery('');
          setTimeout(() => scrollToVerse(num, chapter), 300);
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  item: {
    color: '#ffffff'
  }
});
