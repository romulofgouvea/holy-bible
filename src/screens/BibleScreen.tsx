import { BibleVerseActionSheet, SelectedVerse } from '@/components/modals/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/modals/ReaderSettingsModal';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BibleDrawerMenu } from '../components/BibleDrawerMenu';
import { BibleIcon } from '../components/BibleIcon';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { BibleToast } from '../components/BibleToast';
import { BibleTopBar } from '../components/BibleTopBar';
import { BibleVerseReader } from '../components/BibleVerseReader';
import { BibleHistoryModal } from '../components/modals/BibleHistoryModal';
import { DonateModal } from '../components/modals/DonateModal';
import { useBible } from '../hooks/useBible';
import { useBibleModals } from '../hooks/useBibleModals';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';


export default function BibleScreen() {
  const {
    isReady,
    version, versionBooks,
    book, currentBook,
    chapter, chapterCount,
    verse,
    blinkingVerse, setBlinkingVerse,
    sectionData,
    highlights,
    bulkToggleHighlight,
    navigateTo,
    changeChapter
  } = useBible();

  const router = useRouter();
  const { ms, DESIGN } = useResponsive();
  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    content: { flex: 1 },
    floatingNav: {
      position: 'absolute',
      bottom: ms(DESIGN.spacing.xl),
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: ms(DESIGN.spacing.lg),
      pointerEvents: 'box-none',
    }
  }), [ms, colors, DESIGN]);

  const { readerTheme, readerColors } = useReaderSettings();

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isDonateVisible, setIsDonateVisible] = useState(false);

  const navBg = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
  const navIcon = readerTheme === 'sepia' ? readerColors.onPrimary : colors.onPrimary;

  const sectionListRef = useRef<any>(null);
  const isAutoScrolling = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasInitialScrolled = useRef(false);

  const scrollToVerse = useCallback((targetVerse: number, targetChapter: number) => {
    if (sectionListRef.current) {
      isAutoScrolling.current = true;
      sectionListRef.current?.scrollToIndex({
        index: targetVerse,
        animated: false,
        viewPosition: 0.05,
        viewOffset: 0
      });
      setBlinkingVerse(`${targetChapter}-${targetVerse}`);
      setTimeout(() => setBlinkingVerse(null), 1000);
      setTimeout(() => { isAutoScrolling.current = false; }, 500);
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
        setTimeout(() => scrollToVerse(verse, chapter), 500);
      }
    }
  }, [isReady, verse, chapter, scrollToVerse, fadeAnim]);

  const handleNavigateChapter = useCallback((delta: number) => {
    changeChapter(delta, (newCh) => {
      setTimeout(() => scrollToVerse(1, newCh), 300);
    });
  }, [changeChapter, scrollToVerse]);

  const onVersePress = (item: any) => {
    const verseText = sectionData[0]?.data.find((v: any) => v.verse === item.verse)?.text || '';
    const selected: SelectedVerse = {
      chapter: item.chapter,
      verse: item.verse,
      text: verseText,
      bookName: currentBook.name,
      bookAbbrev: currentBook.abbrev,
      version,
    };
    const key = `${selected.bookAbbrev}-${selected.chapter}-${selected.verse}`;
    setSelectedVerses((prev) => {
      const exists = prev.some((v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}` === key);
      const next = exists
        ? prev.filter((v) => `${v.bookAbbrev}-${v.chapter}-${v.verse}` !== key)
        : [...prev, selected];
      setIsActionSheetVisible(next.length > 0);
      return next;
    });
  };


  const onActionSheetClose = () => {
    setIsActionSheetVisible(false);
    setSelectedVerses([]);
  };

  const { openModal } = useBibleModals();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1, opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), pointerEvents: isReady ? 'none' : 'auto' }]}>
        <BibleSkeleton />
      </Animated.View>

      <BibleTopBar
        version={version}
        bookName={currentBook.name}
        currentChapter={chapter}
        onOpenVersion={() => openModal({
          initialStep: 'version',
          onSelect: (s) => {
            if (s.version) {
              navigateTo({ version: s.version });
              setTimeout(() => scrollToVerse(verse, chapter), 600);
            }
          }
        })}
        onOpenBook={() => openModal({
          initialStep: 'book',
          onSelect: (s) => {
            const nextV = s.version || version;
            const nextB = s.book?.abbrev || book;
            const nextC = s.chapter || chapter;
            const nextVe = s.verse || verse;
            navigateTo({ version: nextV, book: nextB, chapter: nextC, verse: nextVe });
            setTimeout(() => scrollToVerse(nextVe, nextC), 300);
          }
        })}
        onOpenChapter={() => openModal({
          initialStep: 'chapter',
          onSelect: (s) => {
            const nextV = s.version || version;
            const nextB = book;
            const nextC = s.chapter || chapter;
            const nextVe = 1;
            navigateTo({ version: nextV, book: nextB, chapter: nextC, verse: nextVe });
            setTimeout(() => scrollToVerse(nextVe, nextC), 300);
          }
        })}
        onPrevChapter={() => handleNavigateChapter(-1)}
        onNextChapter={() => handleNavigateChapter(1)}
        onOpenMenu={() => setIsDrawerVisible(true)}
        onOpenSettings={() => setIsSettingsModalVisible(true)}
        onOpenSearch={() => router.push('/search?from=bible')}
        onOpenHistory={() => setIsHistoryModalVisible(true)}
      />

      <BibleHistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
        onSelect={(item) => {
          navigateTo({ version: item.version, book: item.bookAbbrev, chapter: item.chapter, verse: item.verse });
          setTimeout(() => scrollToVerse(item.verse, item.chapter), 300);
        }}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.content}>
          <BibleVerseReader
            listRef={sectionListRef}
            sections={sectionData}
            blinkingVerse={blinkingVerse}
            highlights={highlights}
            version={version}
            selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
            bookAbbrev={currentBook.abbrev}
            onVersePress={onVersePress}
          />

          {!isActionSheetVisible && (
            <View style={styles.floatingNav}>
              <BibleIcon
                name="chevron-left"
                size={ms(DESIGN.fontSize.xxxl)}
                containerSize={ms(DESIGN.spacing.xxxl)}
                color={navIcon}
                backgroundColor={navBg}
                borderRadius={ms(DESIGN.borderRadius.md)}
                onPress={() => handleNavigateChapter(-1)}
                activeOpacity={0.8}
                style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3 }}
              />

              <BibleIcon
                name="chevron-right"
                size={ms(DESIGN.fontSize.xxxl)}
                containerSize={ms(DESIGN.spacing.xxxl)}
                color={navIcon}
                backgroundColor={navBg}
                borderRadius={ms(DESIGN.borderRadius.md)}
                onPress={() => handleNavigateChapter(1)}
                activeOpacity={0.8}
                style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3 }}
              />
            </View>
          )}
        </View>
      </Animated.View>

      <BibleVerseActionSheet
        visible={isActionSheetVisible}
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
        visible={isDrawerVisible}
        activeItem="bible"
        onClose={() => setIsDrawerVisible(false)}
        onSelectItem={(key) => {
          if (key === 'history') setIsHistoryModalVisible(true);
          if (key === 'settings') setIsSettingsModalVisible(true);
        }}
        onOpenDonate={() => { setIsDrawerVisible(false); setIsDonateVisible(true); }}
      />

      <ReaderSettingsModal visible={isSettingsModalVisible} onClose={() => setIsSettingsModalVisible(false)} />
      <DonateModal visible={isDonateVisible} onClose={() => setIsDonateVisible(false)} />
      <BibleToast opacity={opacity} toast={toast} />
    </View>
  );
}
