import { BibleModals } from '@/components/BibleModals';
import { BibleVerseActionSheet, SelectedVerse } from '@/components/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/ReaderSettingsModal';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleTopBar } from '../../components/BibleTopBar';
import { BibleVerseReader } from '../../components/BibleVerseReader';
import { useBible } from '../../hooks/use-bible';

import { BibleHistoryModal } from '../../components/BibleHistoryModal';
import { BibleSkeleton } from '../../components/BibleSkeleton';
import { BibleToast } from '../../components/BibleToast';
import { DonateModal } from '../../components/DonateModal';
import { useHistory } from '../../hooks/use-history';
import { useTheme } from '../../hooks/use-theme';
import { useToast } from '../../hooks/use-toast';

export default function BibleScreen() {
  const {
    isReady,
    version, setVersion, versionBooks,
    book, setBook, currentBook,
    chapter, setChapter, chapterCount,
    verse, setVerse,
    blinkingVerse, setBlinkingVerse,
    sectionData,
    changeChapter: bibleChangeChapter,
    onVersePress: originalOnVersePress,
    bulkToggleHighlight,
    highlights
  } = useBible();

  const router = useRouter();
  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [isChangingVersion, setIsChangingVersion] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const sectionListRef = useRef<any>(null);
  const isAutoScrolling = useRef(false);
  const chapterRef = useRef(chapter);
  const targetScrollIndex = useRef({ sectionIndex: 0, itemIndex: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasInitialScrolled = useRef(false);
  const { addHistoryEntry } = useHistory();

  useEffect(() => {
    chapterRef.current = chapter;
  }, [chapter]);

  const scrollToVerse = useCallback((targetVerse: number, targetChapter: number) => {
    if (sectionListRef.current) {
      isAutoScrolling.current = true;
      const sectionIndex = 0;
      const itemIndex = Math.max(0, targetVerse - 1);

      targetScrollIndex.current = { sectionIndex, itemIndex };

      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex,
        animated: true,
        viewPosition: 0,
      });

      setBlinkingVerse(`${targetChapter}-${targetVerse}`);
      setTimeout(() => setBlinkingVerse(null), 1500);

      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 1000);
    }
  }, [setBlinkingVerse]);

  useEffect(() => {
    if (isReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      if (!hasInitialScrolled.current) {
        hasInitialScrolled.current = true;
        setTimeout(() => {
          scrollToVerse(verse, chapter);
        }, 500);
      }
    }
  }, [isReady, verse, chapter, scrollToVerse]);

  const changeChapter = useCallback((deltaOrValue: number, onComplete?: (newChapter: number) => void) => {
    setIsNavigating(true);
    bibleChangeChapter(deltaOrValue, (newChapter) => {
      onComplete?.(newChapter);
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
    });
  }, [bibleChangeChapter]);

  const navigateChapter = useCallback((delta: number) => {
    changeChapter(delta, (newChapter) => {
      setTimeout(() => {
        scrollToVerse(1, newChapter);
      }, 300);
    });
  }, [changeChapter, scrollToVerse]);

  const onScrollToIndexFailed = useCallback((info: any) => {
    try {
      const offset = (info.averageItemLength || 50) * info.index;
      sectionListRef.current?.getScrollResponder()?.scrollTo({ y: offset, animated: false });
    } catch (e) { }

    setTimeout(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          ...targetScrollIndex.current,
          animated: true,
          viewPosition: 0,
        });
      } catch (error) { }
    }, 100);
  }, []);

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

  const historySyncRef = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    if (!historySyncRef.current) {
      historySyncRef.current = true;
      return;
    }

    addHistoryEntry({
      version,
      bookName: currentBook.name,
      bookAbbrev: currentBook.abbrev,
      chapter,
      verse,
    });
  }, [version, book, chapter, verse, isReady]);

  const onActionSheetClose = () => {
    setActionSheetVisible(false);
    setSelectedVerses([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1, opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), pointerEvents: isReady ? 'none' : 'auto' }]}>
        <BibleSkeleton />
      </Animated.View>
      <BibleTopBar
        version={version}
        bookName={currentBook.name}
        currentChapter={chapter}
        onOpenVersion={() => setVersionModalVisible(true)}
        onOpenBook={() => setBookModalVisible(true)}
        onOpenChapter={() => setChapterModalVisible(true)}
        onPrevChapter={() => navigateChapter(-1)}
        onNextChapter={() => navigateChapter(1)}
        onOpenMenu={() => setDrawerVisible(true)}
        onOpenSettings={() => setSettingsModalVisible(true)}
        onOpenSearch={() => router.push('/search?from=bible')}
        onOpenHistory={() => setHistoryModalVisible(true)}
      />

      <BibleHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        onSelect={(item) => {
          setVersion(item.version);
          setBook(item.bookAbbrev);
          setChapter(item.chapter);
          setVerse(item.verse);
          setTimeout(() => scrollToVerse(item.verse, item.chapter), 300);
        }}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.content}>
          {isChangingVersion ? (
            <BibleSkeleton onlyContent={true} />
          ) : (
            <BibleVerseReader
              listRef={sectionListRef}
              sections={sectionData}
              blinkingVerse={blinkingVerse}
              highlights={highlights}
              version={version}
              selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
              bookAbbrev={currentBook.abbrev}
              onVersePress={onVersePress}
              onScrollToIndexFailed={onScrollToIndexFailed}
            />
          )}
        </View>
      </Animated.View>

      <BibleModals
        versionBooks={versionBooks}
        currentBook={currentBook}
        chapter={chapter}
        chapterCount={chapterCount}
        verse={verse}
        version={version}
        versionModalVisible={versionModalVisible}
        bookModalVisible={bookModalVisible}
        chapterModalVisible={chapterModalVisible}
        verseModalVisible={verseModalVisible}
        setVersionModalVisible={setVersionModalVisible}
        setBookModalVisible={setBookModalVisible}
        setChapterModalVisible={setChapterModalVisible}
        setVerseModalVisible={setVerseModalVisible}
        onVersionSelect={(v) => {
          const savedVerse = verse;
          setVersion(v);
          setTimeout(() => {
            scrollToVerse(savedVerse, chapterRef.current);
          }, 400);
        }}
        onBookSelect={(b) => {
          setBook(b);
          setChapter(1);
          setVerse(1);
          setTimeout(() => scrollToVerse(1, 1), 300);
        }}
        onChapterSelect={(c) => {
          if (c !== chapter) {
            setChapter(c);
            setVerse(1);
            setTimeout(() => scrollToVerse(1, c), 300);
          }
        }}
        onVerseSelect={(v) => {
          setVerse(v);
          setTimeout(() => scrollToVerse(v, chapterRef.current), 300);
        }}
      />

      <BibleVerseActionSheet
        visible={actionSheetVisible}
        onClose={onActionSheetClose}
        selectedVerses={selectedVerses}
        highlights={highlights}
        onBulkHighlight={(verses, color) => {
          bulkToggleHighlight(verses, color);
          onActionSheetClose();
        }}
        onShowToast={(msg) => show(msg)}
      />

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="bible"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={(key) => {
          if (key === 'history') setHistoryModalVisible(true);
          if (key === 'settings') setSettingsModalVisible(true);
        }}
        onOpenDonate={() => {
          setDrawerVisible(false);
          setDonateModalVisible(true);
        }}
      />

      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      <DonateModal
        visible={donateModalVisible}
        onClose={() => setDonateModalVisible(false)}
      />

      <BibleToast opacity={opacity} toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
