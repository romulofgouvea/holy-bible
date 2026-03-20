import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BibleModals } from '../components/bible-modals';
import { TopBar } from '../components/top-bar';
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
    highlights,
    sectionData,
    changeChapter,
    onVersePress
  } = useBible();

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
    // If the requested chapter is different from current, we need to switch first.
    // However, if we just came from changeChapter, they should match already.
    if (targetChapter !== chapter) {
      isAutoScrolling.current = true;
      setChapter(targetChapter);
      // Wait for re-render before scrolling
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
    
    // Hold isAutoScrolling for longer to avoid onViewableItemsChanged interference
    setTimeout(() => { isAutoScrolling.current = false; }, 1200);
  }, [chapter, setChapter, setBlinkingVerse]);

  const navigateChapter = useCallback((delta: number) => {
    isAutoScrolling.current = true;
    changeChapter(delta, (newChapter) => {
      // When changing chapter, we always scroll to the top of the new chapter
      setTimeout(() => {
        try {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: 0,
            itemIndex: 0,
            animated: false, // Use false here to avoid the "bounce" during chapter swap
            viewPosition: 0,
          });
        } catch (e) { }
        // Then do a tiny animated scroll or just release the lock
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

        {/* Left Floating Navigation Arrow */}
        <TouchableOpacity
          style={[styles.floatingArrow, styles.floatingArrowLeft]}
          onPress={() => navigateChapter(-1)}
        >
          <Feather name="chevron-left" size={32} color="#008080" />
        </TouchableOpacity>

        {/* Right Floating Navigation Arrow */}
        <TouchableOpacity
          style={[styles.floatingArrow, styles.floatingArrowRight]}
          onPress={() => navigateChapter(1)}
        >
          <Feather name="chevron-right" size={32} color="#008080" />
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
    position: 'relative',
  },
  floatingArrow: {
    position: 'absolute',
    bottom: 60, // Moved lower
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  floatingArrowLeft: {
    left: 20,
  },
  floatingArrowRight: {
    right: 20,
  }
});
