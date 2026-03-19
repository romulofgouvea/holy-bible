import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadState = async () => {
      let parsed: any = null;
      try {
        const savedPos = await AsyncStorage.getItem('bible-last-read');
        if (savedPos) {
          parsed = JSON.parse(savedPos);
          if (parsed.version) setVersion(parsed.version);
          if (parsed.book) setBook(parsed.book);
          if (parsed.chapter) setChapter(parsed.chapter);
          if (parsed.verse) setVerse(parsed.verse);
        }
        const savedHighlights = await AsyncStorage.getItem('bible-highlights');
        if (savedHighlights) {
          setHighlights(JSON.parse(savedHighlights));
        }
      } catch (e) { }

      // Give the list a moment to mount the new chapter and verse
      setTimeout(() => {
        if (parsed?.chapter && parsed?.verse && sectionListRef.current) {
          targetScrollIndex.current = {
            sectionIndex: 0,
            itemIndex: Math.max(0, parsed.verse - 1),
          };
          try {
            sectionListRef.current.scrollToLocation({
              ...targetScrollIndex.current,
              animated: true,
              viewPosition: 0,
            });
          } catch (err) {}
        }

        // Fade in smoothly after scroll
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 300);
    };
    loadState();
  }, [fadeAnim]);

  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('bible-last-read', JSON.stringify({ book, chapter, verse, version }));
      } catch (e) { }
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
  const isAutoScrolling = useRef(false);
  const targetScrollIndex = useRef({ sectionIndex: 0, itemIndex: 0 });

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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 150,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (isAutoScrolling.current) return;

    // Pick the most prominently visible verse at the top
    const firstVisible = viewableItems.find((v) => v.item && v.item.chapter && v.item.verse && v.isViewable)?.item;
    if (firstVisible) {
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

    setHighlights((prev) => {
      const key = `${currentBook.abbrev}-${item.chapter}-${item.verse}`;
      const clone = { ...prev };
      if (clone[key]) delete clone[key];
      else clone[key] = true;
      AsyncStorage.setItem('bible-highlights', JSON.stringify(clone)).catch(() => { });
      return clone;
    });
  }, [currentBook.abbrev]);

  const scrollToVerse = useCallback((verseNumber: number, chapterNumber = chapter) => {
    const sectionIndex = 0;
    const itemIndex = Math.max(0, verseNumber - 1);
    
    isAutoScrolling.current = true;
    targetScrollIndex.current = { sectionIndex, itemIndex };
    
    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex, itemIndex, animated: true, viewPosition: 0 });
      setBlinkingVerse(`${chapterNumber}-${verseNumber}`);
      setTimeout(() => setBlinkingVerse(null), 1500);
    } catch (error) {
      // Ignore error, onScrollToIndexFailed will retry
    }
    setTimeout(() => { isAutoScrolling.current = false; }, 800);
  }, [chapter]);

  const onScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          ...targetScrollIndex.current,
          animated: true,
          viewPosition: 0,
        });
      } catch (error) {
        // Stop retrying if double failure
      }
    }, 500);
  }, []);

  // useEffect and autoScroll removed in favor of explicit scrolling

  return (
    <Animated.View style={[styles.page, { opacity: fadeAnim }]}>
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

    </Animated.View>
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
