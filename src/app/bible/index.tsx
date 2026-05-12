import { BibleModals } from '@/components/BibleModals';
import { BibleVerseActionSheet, SelectedVerse } from '@/components/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/ReaderSettingsModal';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleText } from '../../components/BibleText';
import { BibleTopBar } from '../../components/BibleTopBar';
import { BibleVerseReader } from '../../components/BibleVerseReader';
import { useBible } from '../../hooks/use-bible';

import { BibleHistoryModal } from '../../components/BibleHistoryModal';
import { BibleSkeleton } from '../../components/BibleSkeleton';
import { BibleToast } from '../../components/BibleToast';
import { DonateModal } from '../../components/DonateModal';
import { useHistory } from '../../hooks/use-history';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useTheme } from '../../hooks/use-theme';
import { useToast } from '../../hooks/use-toast';

export default function BibleScreen() {
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
    bulkToggleHighlight,
    highlights
  } = useBible();

  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();
  const { readerColors, readerTheme } = useReaderSettings();

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const params = useLocalSearchParams<{ book?: string; ch?: string; v?: string; ver?: string; openSearch?: string }>();
  const router = useRouter();

  const [drawerVisible, setDrawerVisible] = useState(false);

  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [donateVisible, setDonateVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  // Única instância do hook de histórico — compartilhada com o modal
  const { history, addHistoryEntry, loadHistory, clearHistory } = useHistory();

  const [isChangingVersion, setIsChangingVersion] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sectionListRef = useRef<any>(null);
  const isAutoScrolling = useRef(false);
  const targetScrollIndex = useRef({ sectionIndex: 0, itemIndex: 0 });
  const initialScrollDone = useRef(false);
  const chapterRef = useRef(chapter);
  useEffect(() => { chapterRef.current = chapter; }, [chapter]);

  useEffect(() => {
    if (!isReady || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const abbrev = (currentBook.abbrev || book).toLowerCase();
    const url = `/bible/${version.toLowerCase()}/${abbrev}/${chapter}`;
    window.history.replaceState(null, '', url);
  }, [version, currentBook.abbrev, chapter, isReady]);

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
  }, [isReady, fadeAnim]);

  useEffect(() => {
    if (isReady && params.book && params.ch) {
      const targetVerse = Number(params.v || 1);
      const targetChapter = Number(params.ch);

      if (params.ver && params.ver.toLowerCase() !== version.toLowerCase()) {
        setIsChangingVersion(params.ver.toUpperCase());
        setTimeout(() => {
          setVersion(params.ver!.toUpperCase());
          setBook(params.book!);
          setChapter(targetChapter);
          setVerse(targetVerse);
          setVisibleChapter(targetChapter);
          setVisibleVerse(targetVerse);
          setIsChangingVersion(null);
          setTimeout(() => scrollToVerse(targetVerse, targetChapter), 600);
        }, 300);
      } else {
        setBook(params.book);
        setChapter(targetChapter);
        setVerse(targetVerse);
        setVisibleChapter(targetChapter);
        setVisibleVerse(targetVerse);
        setTimeout(() => scrollToVerse(targetVerse, targetChapter), 600);
      }
    }
  }, [isReady, params.book, params.ch, params.v, params.ver]);

  useEffect(() => {
    setActionSheetVisible(false);
    setSelectedVerses([]);
  }, [currentBook.abbrev, chapter]);


  const scrollToVerse = useCallback((verseNumber: number, targetChapter?: number) => {
    const resolvedChapter = targetChapter ?? chapterRef.current;
    setIsNavigating(true);

    if (resolvedChapter !== chapterRef.current) {
      isAutoScrolling.current = true;
      setChapter(resolvedChapter);
      setTimeout(() => {
        const sectionIndex = 0;
        const itemIndex = Math.max(0, verseNumber - 1);
        targetScrollIndex.current = { sectionIndex, itemIndex };
        try {
          sectionListRef.current?.scrollToLocation({ sectionIndex, itemIndex, animated: true, viewPosition: 0 });
          setBlinkingVerse(`${resolvedChapter}-${verseNumber}`);
          setTimeout(() => setBlinkingVerse(null), 1500);
        } catch (error) { }
        setTimeout(() => {
          isAutoScrolling.current = false;
          setIsNavigating(false);
        }, 2000);
      }, 500);
      return;
    }

    const sectionIndex = 0;
    const itemIndex = Math.max(0, verseNumber - 1);
    isAutoScrolling.current = true;
    targetScrollIndex.current = { sectionIndex, itemIndex };
    try {
      sectionListRef.current?.scrollToLocation({ sectionIndex, itemIndex, animated: true, viewPosition: 0 });
      setBlinkingVerse(`${resolvedChapter}-${verseNumber}`);
      setTimeout(() => setBlinkingVerse(null), 1500);
    } catch (error) { }
    setTimeout(() => {
      isAutoScrolling.current = false;
      setIsNavigating(false);
    }, 2000);
  }, [setChapter, setBlinkingVerse]);

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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 15, // Sensibilidade alta para capturar o versículo exatamente no topo
    minimumViewTime: 100,
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
    // Bloqueia atualizações durante trocas de versão, rolagem automática ou navegação manual
    if (isAutoScrolling.current || isChangingVersion || isNavigating) return;
    const firstVisible = viewableItems.find((v) => v.item && v.item.chapter && v.item.verse && v.isViewable)?.item;
    if (firstVisible) {
      setVisibleChapter(firstVisible.chapter);
      setVisibleVerse(firstVisible.verse);
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1, opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), pointerEvents: isReady ? 'none' : 'auto' }]}>
        <BibleSkeleton />
      </Animated.View>
      <BibleTopBar
        version={version}
        bookName={currentBook.name}
        currentChapter={visibleChapter}
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
          setVisibleChapter(item.chapter);
          setVisibleVerse(item.verse);
          setTimeout(() => scrollToVerse(item.verse, item.chapter), 300);
        }}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.content}>
          {isChangingVersion ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <BibleText style={{ marginTop: 16, fontWeight: '700', color: colors.primary, fontSize: 16 }}>Carregando {isChangingVersion}...</BibleText>
            </View>
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
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={viewabilityConfig.current}
              onScrollToIndexFailed={onScrollToIndexFailed}
            />
          )}

          {!actionSheetVisible && (
            <>
              <TouchableOpacity
                style={[styles.floatingArrow, styles.floatingArrowLeft, { backgroundColor: readerColors.primary, shadowColor: colors.shadow }]}
                onPress={() => navigateChapter(-1)}
              >
                <Feather name="chevron-left" size={24} color={readerColors.onPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingArrow, styles.floatingArrowRight, { backgroundColor: readerColors.primary, shadowColor: colors.shadow }]}
                onPress={() => navigateChapter(1)}
              >
                <Feather name="chevron-right" size={24} color={readerColors.onPrimary} />
              </TouchableOpacity>
            </>
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
          setVersionModalVisible(false);
          setIsChangingVersion(v);
          setIsNavigating(true);
          
          // Captura a posição atual antes de qualquer mudança
          const savedBook = book;
          const savedChapter = chapter;
          const savedVerse = visibleVerse || verse;

          setVersion(v);
          setBook(savedBook);
          setChapter(savedChapter);
          setVerse(savedVerse);
          setVisibleChapter(savedChapter);
          setVisibleVerse(savedVerse);

          addHistoryEntry({
            version: v,
            bookName: currentBook.name,
            bookAbbrev: savedBook,
            chapter: savedChapter,
            verse: savedVerse,
          });

          setTimeout(() => {
            setIsChangingVersion(null);
            setTimeout(() => {
              scrollToVerse(savedVerse, savedChapter);
            }, 500); // Tempo extra para garantir que a NVI/ARA carregou os textos
          }, 200);
        }}
        onBookSelect={(b) => {
          if (b !== currentBook.abbrev && b !== currentBook.name) {
            setBook(b);
            setChapter(1);
            setVerse(1);
            setVisibleChapter(1);
            setVisibleVerse(1);
          }
        }}
        onChapterSelect={(c) => {
          if (c !== chapter) {
            setChapter(c);
            setVerse(1);
            setVisibleChapter(c);
            setVisibleVerse(1);
          }
        }}
        onVerseSelect={(v) => {
          setVerse(v);
          setVisibleVerse(v);
          setVisibleChapter(chapter);
          addHistoryEntry({
            version,
            bookName: currentBook.name,
            bookAbbrev: currentBook.abbrev,
            chapter,
            verse: v
          });
          setTimeout(() => scrollToVerse(v, chapterRef.current), 300);
        }}
      />

      <BibleVerseActionSheet
        visible={actionSheetVisible}
        selectedVerses={selectedVerses}
        highlights={highlights}
        onClose={onActionSheetClose}
        onBulkHighlight={bulkToggleHighlight}
        onShowToast={show}
      />

      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="bible"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => setDrawerVisible(false)}
        onOpenDonate={() => { setDrawerVisible(false); setTimeout(() => setDonateVisible(true), 250); }}
      />

      <BibleToast toast={toast} opacity={opacity} />

      <DonateModal visible={donateVisible} onClose={() => setDonateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
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
