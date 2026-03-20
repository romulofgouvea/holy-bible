import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BibleModals } from '../components/bible-modals';
import { DrawerMenu } from '../components/drawer-menu';
import { TopBar } from '../components/top-bar';
import { VerseActionSheet, SelectedVerse } from '../components/verse-action-sheet';
import { VerseReader } from '../components/verse-reader';
import { useBible } from '../hooks/use-bible';

export default function HomeScreen() {
  const {
    isReady,
    version, setVersion, versionBooks,
    book, setBook, currentBook,
    chapter, setChapter, chapterCount,
    verse, setVerse,
    visibleChapter, setVisibleChapter,
    visibleVerse, setVisibleVerse,
    blinkingVerse, setBlinkingVerse,
    sectionData,
    changeChapter,
    onVersePress: originalOnVersePress,
    toggleHighlight,
    highlights
  } = useBible();

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('biblia');

  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sectionListRef = useRef<any>(null);
  const isAutoScrolling = useRef(false);
  const targetScrollIndex = useRef({ sectionIndex: 0, itemIndex: 0 });
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (isReady && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        if (sectionListRef.current) {
          const sectionIndex = 0;
          const itemIndex = Math.max(0, verse - 1);
          targetScrollIndex.current = { sectionIndex, itemIndex };
          try {
            sectionListRef.current.scrollToLocation({
              ...targetScrollIndex.current,
              animated: true,
              viewPosition: 0,
            });
          } catch (err) { }
        }
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 300);
    }
  }, [isReady, fadeAnim, verse]);

  const scrollToVerse = useCallback((verseNumber: number, targetChapter = chapter) => {
    if (targetChapter !== chapter) {
      isAutoScrolling.current = true;
      setChapter(targetChapter);
      setTimeout(() => scrollToVerse(verseNumber, targetChapter), 400);
      return;
    }

    const sectionIndex = 0;
    const itemIndex = Math.max(0, verseNumber - 1);

    isAutoScrolling.current = true;
    targetScrollIndex.current = { sectionIndex, itemIndex };

    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex, itemIndex, animated: true, viewPosition: 0 });
      setBlinkingVerse(`${targetChapter}-${verseNumber}`);
      setTimeout(() => setBlinkingVerse(null), 1500);
    } catch (error) { }

    setTimeout(() => { isAutoScrolling.current = false; }, 1200);
  }, [chapter, setChapter, setBlinkingVerse]);

  const navigateChapter = useCallback((delta: number) => {
    isAutoScrolling.current = true;
    changeChapter(delta, (newChapter) => {
      setTimeout(() => {
        try {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: 0,
            itemIndex: 0,
            animated: false,
            viewPosition: 0,
          });
        } catch (e) { }
        setTimeout(() => { isAutoScrolling.current = false; }, 1000);
      }, 500);
    });
  }, [changeChapter]);

  const onScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          ...targetScrollIndex.current,
          animated: true,
          viewPosition: 0,
        });
      } catch (error) { }
    }, 500);
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 150,
  });

  const onVersePress = (item: any) => {
    const verseText = sectionData[0]?.data.find((v: any) => v.verse === item.verse)?.text || '';
    const selected: SelectedVerse = {
      chapter: item.chapter,
      verse: item.verse,
      text: verseText,
      bookName: currentBook.name,
      bookAbbrev: currentBook.abbrev,
    };
    const key = `${selected.bookAbbrev}-${selected.chapter}-${selected.verse}`;

    setSelectedVerses((prev) => {
      const exists = prev.some((v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}` === key);
      const next = exists
        ? prev.filter((v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}` !== key)
        : [...prev, selected];
      if (next.length === 0) {
        setActionSheetVisible(false);
      } else {
        setActionSheetVisible(true);
      }
      return next;
    });
  };

  const onActionSheetClose = () => {
    setActionSheetVisible(false);
    setSelectedVerses([]);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (isAutoScrolling.current) return;
    const firstVisible = viewableItems.find((v) => v.item && v.item.chapter && v.item.verse && v.isViewable)?.item;
    if (firstVisible) {
      setVisibleChapter(firstVisible.chapter);
      setVisibleVerse(firstVisible.verse);
    }
  });

  return (
    <Animated.View style={[styles.page, { opacity: fadeAnim }]}>
      <TopBar
        version={version}
        bookName={currentBook.name}
        currentChapter={visibleChapter}
        onOpenVersion={() => setVersionModalVisible(true)}
        onOpenBook={() => setBookModalVisible(true)}
        onOpenChapter={() => setChapterModalVisible(true)}
        onPrevChapter={() => navigateChapter(-1)}
        onNextChapter={() => navigateChapter(1)}
        onOpenMenu={() => setDrawerVisible(true)}
      />

      <View style={styles.content}>
        <VerseReader
          listRef={sectionListRef}
          sections={sectionData}
          blinkingVerse={blinkingVerse}
          highlights={highlights}
          selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
          bookAbbrev={currentBook.abbrev}
          onVersePress={onVersePress}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />

        <TouchableOpacity
          style={[styles.floatingArrow, styles.floatingArrowLeft]}
          onPress={() => navigateChapter(-1)}
        >
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingArrow, styles.floatingArrowRight]}
          onPress={() => navigateChapter(1)}
        >
          <Feather name="chevron-right" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <BibleModals
        versionBooks={versionBooks}
        currentBook={currentBook}
        chapter={chapter}
        chapterCount={chapterCount}
        versionModalVisible={versionModalVisible}
        bookModalVisible={bookModalVisible}
        chapterModalVisible={chapterModalVisible}
        verseModalVisible={verseModalVisible}
        setVersionModalVisible={setVersionModalVisible}
        setBookModalVisible={setBookModalVisible}
        setChapterModalVisible={setChapterModalVisible}
        setVerseModalVisible={setVerseModalVisible}
        onVersionSelect={(v, firstBook) => { setVersion(v); setBook(firstBook); setChapter(1); setVerse(1); }}
        onBookSelect={(b) => { setBook(b); setChapter(1); setVerse(1); }}
        onChapterSelect={(c) => { setChapter(c); setVerse(1); }}
        onVerseSelect={(v) => { setVerse(v); setTimeout(() => scrollToVerse(v, chapter), 300); }}
      />

      <VerseActionSheet
        visible={actionSheetVisible}
        selectedVerses={selectedVerses}
        highlights={highlights}
        onClose={onActionSheetClose}
        onToggleHighlight={toggleHighlight}
      />

      <DrawerMenu
        visible={drawerVisible}
        activeItem={activeSection}
        onClose={() => setDrawerVisible(false)}
        onSelectItem={(key: string) => setActiveSection(key)}
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
    padding: 0,
    position: 'relative',
  },
  floatingArrow: {
    position: 'absolute',
    bottom: 40,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  floatingArrowLeft: {
    left: 16,
  },
  floatingArrowRight: {
    right: 16,
  }
});
