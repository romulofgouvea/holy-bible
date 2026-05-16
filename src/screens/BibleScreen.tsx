import { BibleVerseActionSheet, SelectedVerse } from '@/components/modals/BibleVerseActionSheet';
import { useBibleModals } from '../hooks/useBibleModals';
import { ReaderSettingsModal } from '@/components/modals/ReaderSettingsModal';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState , useMemo } from 'react';
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
import { useHistory } from '../hooks/useHistory';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';

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
  const { ms, DESIGN } = useResponsive();
  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    content: {
      flex: 1,
    },
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
  const [isChangingVersion, setIsChangingVersion] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const navBg = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
  const navIcon = readerTheme === 'sepia' ? readerColors.onPrimary : colors.onPrimary;

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
      const targetIndex = targetVerse;
      sectionListRef.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
        viewPosition: 0.05,
        viewOffset: 0
      });
      setBlinkingVerse(`${targetChapter}-${targetVerse}`);
      setTimeout(() => setBlinkingVerse(null), 1000);
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
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
      if (next.length === 0) {
        setIsActionSheetVisible(false);
      } else {
        setIsActionSheetVisible(true);
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
              const savedVerse = verse;
              const savedChapter = chapter;
              setVersion(s.version);
              setTimeout(() => scrollToVerse(savedVerse, savedChapter), 600);
            }
          }
        })}
        onOpenBook={() => openModal({ 
          initialStep: 'book',
          onSelect: (s) => {
            if (s.book) setBook(s.book.abbrev);
            if (s.chapter) setChapter(s.chapter);
            if (s.verse) {
               setVerse(s.verse);
               setTimeout(() => scrollToVerse(s.verse!, s.chapter!), 300);
            } else if (s.chapter) {
               setVerse(1);
               setTimeout(() => scrollToVerse(1, s.chapter!), 300);
            }
          }
        })}
        onOpenChapter={() => openModal({ 
          initialStep: 'chapter',
          onSelect: (s) => {
             if (s.chapter && s.chapter !== chapter) {
               setChapter(s.chapter);
               setVerse(1);
               setTimeout(() => scrollToVerse(1, s.chapter!), 300);
             }
          }
        })}
        onPrevChapter={() => navigateChapter(-1)}
        onNextChapter={() => navigateChapter(1)}
        onOpenMenu={() => setIsDrawerVisible(true)}
        onOpenSettings={() => setIsSettingsModalVisible(true)}
        onOpenSearch={() => router.push('/search?from=bible')}
        onOpenHistory={() => setIsHistoryModalVisible(true)}
      />

      <BibleHistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
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
            <>
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

              {/* Floating Navigation Buttons - Hidden when actions are open */}
              {!isActionSheetVisible && (
                <View style={styles.floatingNav}>
                  <BibleIcon
                    name="chevron-left"
                    size={ms(DESIGN.fontSize.xxxl)}
                    containerSize={ms(DESIGN.spacing.xxxl)}
                    color={navIcon}
                    backgroundColor={navBg}
                    borderRadius={ms(DESIGN.borderRadius.md)}
                    onPress={() => navigateChapter(-1)}
                    activeOpacity={0.8}
                    style={{ 
                      elevation: 4, 
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: ms(DESIGN.spacing.tiny) }, 
                      shadowOpacity: 0.25, 
                      shadowRadius: 3 
                    }}
                  />

                  <BibleIcon
                    name="chevron-right"
                    size={ms(DESIGN.fontSize.xxxl)}
                    containerSize={ms(DESIGN.spacing.xxxl)}
                    color={navIcon}
                    backgroundColor={navBg}
                    borderRadius={ms(DESIGN.borderRadius.md)}
                    onPress={() => navigateChapter(1)}
                    activeOpacity={0.8}
                    style={{ 
                      elevation: 4, 
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: ms(DESIGN.spacing.tiny) }, 
                      shadowOpacity: 0.25, 
                      shadowRadius: 3 
                    }}
                  />
                </View>
              )}
            </>
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
        onOpenDonate={() => {
          setIsDrawerVisible(false);
          setIsDonateVisible(true);
        }}
      />

      <ReaderSettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />

      <DonateModal
        visible={isDonateVisible}
        onClose={() => setIsDonateVisible(false)}
      />

      <BibleToast opacity={opacity} toast={toast} />
    </View>
  );
}
