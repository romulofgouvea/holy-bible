import { BibleVerseActionSheet } from '@/components/modals/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/modals/ReaderSettingsModal';
import { Book, SelectedVerse } from '@/models';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, BackHandler } from 'react-native';
import { BibleDivider } from '../components/BibleDivider';
import { BibleDrawerMenu } from '../components/BibleDrawerMenu';
import { BibleIcon } from '../components/BibleIcon';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { BibleText } from '../components/BibleText';
import { BibleToast } from '../components/BibleToast';
import { BibleTopBar } from '../components/BibleTopBar';
import { BibleVerseReader } from '../components/BibleVerseReader';
import { BibleHistoryModal } from '../components/modals/BibleHistoryModal';
import { DonateModal } from '../components/modals/DonateModal';
import { BibleConfirmModal } from '../components/modals/BibleConfirmModal';
import { STORAGE_KEYS } from '../constants/storage';
import { getBibleTitles } from '../data/bible-titles';
import { getBibleData } from '../data/bible-version';
import { useBible } from '../hooks/useBible';
import { useBibleModals } from '../hooks/useBibleModals';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';


export default function BibleScreen() {
  const {
    version, setVersion, book, setBook, chapter, setChapter, verse, setVerse,
    versionBooks, currentBook, chapterCount, sectionData,
    visibleChapter, setVisibleChapter,
    visibleVerse, setVisibleVerse,
    blinkingVerse, setBlinkingVerse,
    highlights, bulkToggleHighlight,
    navigateTo,
    changeChapter,
    readingPlanGoal,
    isReady
  } = useBible();

  const router = useRouter();

  const { ms, DESIGN } = useResponsive();
  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();
  const { readerTheme, readerColors } = useReaderSettings();
  const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;

  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!router.canGoBack()) {
          setIsExitConfirmVisible(true);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );
  const [secondVersion, setSecondVersion] = useState('ARA');
  const secondSectionListRef = useRef<any>(null);
  const containerRef = useRef<View>(null);

  const secondVersionBooks = useMemo(() => getBibleData(secondVersion), [secondVersion]);

  const secondCurrentBook = useMemo(() => {
    return secondVersionBooks.find((item: Book) => item.name === book || item.abbrev === book) ||
      secondVersionBooks[0] ||
      { name: book, abbrev: book, chapters: [['Nenhum versículo disponível']] };
  }, [secondVersionBooks, book]);

  const secondSectionData = useMemo(() => {
    const verses = secondCurrentBook.chapters[chapter - 1] || [];
    const versionTitles = getBibleTitles(secondVersion);
    const bookTitles = versionTitles?.books.find((b: any) => b.abbrev.toLowerCase() === secondCurrentBook.abbrev.toLowerCase());
    const chapterTitles = bookTitles?.chapters.find((c: any) => c.number === chapter)?.titles || [];

    return [{
      title: `${secondCurrentBook.name} ${chapter}`,
      data: verses.map((text: string, i: number) => {
        const verseNum = i + 1;
        const titlesForVerse = chapterTitles.filter((t: any) => t.startVerse === verseNum);

        return {
          bookAbbrev: secondCurrentBook.abbrev,
          chapter,
          verse: verseNum,
          text,
          titles: titlesForVerse
        };
      })
    }];
  }, [secondCurrentBook, chapter, secondVersion]);

  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [isControlGroupExpanded, setIsControlGroupExpanded] = useState(false);
  const controlGroupAnim = useRef(new Animated.Value(0)).current;
  const hasRestored = useRef(false);

  useEffect(() => {
    if (!isReady || hasRestored.current) return;
    const restoreCompare = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.BIBLE_COMPARE);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.versionCurrent && parsed.versionCompare) {
            navigateTo({ version: parsed.versionCurrent });
            setSecondVersion(parsed.versionCompare);
            setIsSplitScreen(true);
          }
        }
      } catch (e) {
      } finally {
        hasRestored.current = true;
      }
    };
    restoreCompare();
  }, [isReady, navigateTo]);

  useEffect(() => {
    if (!isReady || !hasRestored.current) return;
    const syncStorage = async () => {
      try {
        if (isSplitScreen) {
          const data = {
            versionCurrent: version,
            versionCompare: secondVersion,
          };
          await AsyncStorage.setItem(STORAGE_KEYS.BIBLE_COMPARE, JSON.stringify(data));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.BIBLE_COMPARE);
        }
      } catch (e) {
      }
    };
    syncStorage();
  }, [isReady, isSplitScreen, version, secondVersion]);

  const isScrollingTop = useRef(false);
  const isScrollingBottom = useRef(false);
  const lastScrollY = useRef(0);
  const navVisibleAnim = useRef(new Animated.Value(1)).current;
  const navVisibleRef = useRef(true);
  const [isNavInteractive, setIsNavInteractive] = useState(true);

  const setNavVisible = useCallback((visible: boolean) => {
    if (navVisibleRef.current === visible) return;
    navVisibleRef.current = visible;
    setIsNavInteractive(visible);
    Animated.timing(navVisibleAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [navVisibleAnim]);

  const hasTrackedScroll = useRef(false);

  useEffect(() => {
    hasTrackedScroll.current = false;
    lastScrollY.current = 0;
    setNavVisible(true);
  }, [chapter, book, version, setNavVisible]);

  const isAtScrollEnd = useCallback((nativeEvent: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (!layoutMeasurement?.height || !contentSize?.height) return false;
    const threshold = ms(DESIGN.spacing.xl);
    const notScrollable = contentSize.height <= layoutMeasurement.height + threshold;
    return notScrollable
      || contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;
  }, [ms, DESIGN]);

  const updateNavVisibility = useCallback((nativeEvent: any) => {
    const offsetY = nativeEvent.contentOffset.y;
    const atEnd = isAtScrollEnd(nativeEvent);

    if (!hasTrackedScroll.current) {
      hasTrackedScroll.current = true;
      lastScrollY.current = offsetY;
      if (atEnd) setNavVisible(true);
      return;
    }

    const diff = offsetY - lastScrollY.current;
    if (offsetY <= 8 || atEnd) {
      setNavVisible(true);
    } else if (diff > 4) {
      setNavVisible(false);
    } else if (diff < -4) {
      setNavVisible(true);
    }
    lastScrollY.current = offsetY;
  }, [setNavVisible, isAtScrollEnd]);

  const handleReaderScroll = useCallback((event: any) => {
    updateNavVisibility(event.nativeEvent);
  }, [updateNavVisibility]);

  const handleFirstScroll = useCallback((event: any) => {
    if (!isScrollingBottom.current) {
      updateNavVisibility(event.nativeEvent);
    }
    if (isScrollingBottom.current) return;
    isScrollingTop.current = true;
    if (secondSectionListRef.current) {
      const offsetY = event.nativeEvent.contentOffset.y;
      secondSectionListRef.current.scrollToOffset({ offset: offsetY, animated: false });
    }
    setTimeout(() => {
      isScrollingTop.current = false;
    }, 50);
  }, [updateNavVisibility]);

  const handleSecondScroll = useCallback((event: any) => {
    if (!isScrollingTop.current) {
      updateNavVisibility(event.nativeEvent);
    }
    if (isScrollingTop.current) return;
    isScrollingBottom.current = true;
    if (sectionListRef.current) {
      const offsetY = event.nativeEvent.contentOffset.y;
      sectionListRef.current.scrollToOffset({ offset: offsetY, animated: false });
    }
    setTimeout(() => {
      isScrollingBottom.current = false;
    }, 50);
  }, [updateNavVisibility]);

  const handleToggleOrientation = useCallback(() => {
    setSplitOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
    setIsControlGroupExpanded(false);
    controlGroupAnim.setValue(0);
  }, [controlGroupAnim]);

  const handleSwapVersions = useCallback(() => {
    const tempMain = version;
    setVersion(secondVersion);
    setSecondVersion(tempMain);
  }, [version, secondVersion, setVersion]);

  const handleToggleControlGroup = useCallback(() => {
    const toValue = isControlGroupExpanded ? 0 : 1;
    setIsControlGroupExpanded(!isControlGroupExpanded);
    Animated.spring(controlGroupAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 100,
    }).start();
  }, [isControlGroupExpanded, controlGroupAnim]);

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
    },
    miniHeaderHorizontal: {
      height: ms(DESIGN.spacing.xxxl),
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(DESIGN.spacing.md),
      zIndex: 20,
    },
    versionBadge: {
      position: 'absolute',
      top: ms(DESIGN.spacing.sm),
      left: ms(DESIGN.spacing.sm),
      zIndex: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ms(DESIGN.borderRadius.md),
      paddingHorizontal: ms(DESIGN.spacing.md),
      paddingVertical: ms(DESIGN.spacing.sm),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: ms(2) },
      shadowOpacity: 0.15,
      shadowRadius: ms(4),
      elevation: 3,
    },
    versionBadgeText: {
      fontSize: ms(DESIGN.fontSize.lg),
      fontWeight: '800',
      letterSpacing: 1,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionColumn: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    splitHandleBtn: {
      width: ms(DESIGN.height.sm),
      height: ms(DESIGN.height.sm),
      borderRadius: ms(DESIGN.borderRadius.sm),
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingControlGroup: {
      position: 'absolute',
      left: '50%',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: ms(DESIGN.borderRadius.md),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: ms(2) },
      shadowOpacity: 0.15,
      shadowRadius: ms(3),
      elevation: 3,
      zIndex: 30,
      overflow: 'hidden',
    },
    splitScreenContainerVertical: { flex: 1, flexDirection: 'column', position: 'relative' },
    splitScreenContainerHorizontal: { flex: 1, flexDirection: 'row', position: 'relative' },
    splitPane: { flex: 1, position: 'relative' },
    splitPaneTop: { flex: 9, position: 'relative' },
    splitPaneBottom: { flex: 11, position: 'relative' },
    mainContainer: { flex: 1 },
  }), [ms, colors, DESIGN]);

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isDonateVisible, setIsDonateVisible] = useState(false);

  const navBg = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
  const navBtnSize = ms(DESIGN.spacing.xxl);
  const navIconSize = ms(DESIGN.fontSize.xxl);
  const navIcon = readerTheme === 'sepia' ? readerColors.onPrimary : colors.onPrimary;

  const sectionListRef = useRef<any>(null);
  const isAutoScrolling = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasInitialScrolled = useRef(false);

  const scrollToVerse = useCallback((targetVerse: number, targetChapter: number) => {
    isAutoScrolling.current = true;

    if (sectionListRef.current) {
      sectionListRef.current?.scrollToIndex({
        index: targetVerse,
        animated: false,
        viewPosition: 0.05,
        viewOffset: 0
      });
    }

    if (secondSectionListRef.current) {
      secondSectionListRef.current?.scrollToIndex({
        index: targetVerse,
        animated: false,
        viewPosition: 0.05,
        viewOffset: 0
      });
    }

    setBlinkingVerse(`${targetChapter}-${targetVerse}`);
    setTimeout(() => setBlinkingVerse(null), 1000);
    setTimeout(() => { isAutoScrolling.current = false; }, 500);
  }, [setBlinkingVerse]);

  useEffect(() => {
    if (isSplitScreen) {
      setTimeout(() => scrollToVerse(verse, chapter), 300);
    }
  }, [isSplitScreen, scrollToVerse, verse, chapter]);

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

    let compareText;
    if (isSplitScreen && secondSectionData && secondSectionData[0]) {
      compareText = secondSectionData[0].data.find((v: any) => v.verse === item.verse)?.text;
    }

    const selected: SelectedVerse = {
      chapter: item.chapter,
      verse: item.verse,
      text: verseText,
      bookName: currentBook.name,
      bookAbbrev: currentBook.abbrev,
      version,
      ...(compareText ? { compareText, compareVersion: secondVersion } : {})
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

  const renderVersionBadge = (label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.versionBadge} onPress={onPress} activeOpacity={0.8}>
      <BibleText style={[styles.versionBadgeText, { color: primaryColor }]}>
        {label.toUpperCase()}
      </BibleText>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1, opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), pointerEvents: isReady ? 'none' : 'auto' }]}>
        <BibleSkeleton />
      </Animated.View>

      <BibleTopBar
        bookName={currentBook.name}
        currentChapter={chapter}
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
        isSplitScreen={isSplitScreen}
        onToggleCompare={() => {
          if (isSplitScreen) {
            setIsSplitScreen(false);
          } else {
            openModal({
              initialStep: 'version',
              target: 'study',
              onSelect: (s) => {
                if (s.version) {
                  setSecondVersion(s.version);
                  setIsSplitScreen(true);
                }
              }
            });
          }
        }}
      />

      <BibleHistoryModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
        onSelect={(item) => {
          navigateTo({ version: item.version, book: item.bookAbbrev, chapter: item.chapter, verse: item.verse });
          setTimeout(() => scrollToVerse(item.verse, item.chapter), 300);
        }}
      />

      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          {isSplitScreen ? (
            <View style={splitOrientation === 'vertical' ? styles.splitScreenContainerVertical : styles.splitScreenContainerHorizontal}>
              <View style={splitOrientation === 'vertical' ? styles.splitPaneTop : styles.splitPane}>
                {renderVersionBadge(version, () => openModal({
                  initialStep: 'version',
                  initialVersion: version,
                  onSelect: (s) => {
                    if (s.version) {
                      navigateTo({ version: s.version });
                      setTimeout(() => scrollToVerse(verse, chapter), 600);
                    }
                  }
                }))}
                <BibleVerseReader
                  listRef={sectionListRef}
                  sections={sectionData}
                  blinkingVerse={blinkingVerse}
                  highlights={highlights}
                  version={version}
                  selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
                  bookAbbrev={currentBook.abbrev}
                  onVersePress={onVersePress}
                  onScroll={handleFirstScroll}
                  scrollEventThrottle={16}
                />
              </View>

              <BibleDivider
                vertical={splitOrientation === 'horizontal'}
                size={ms(DESIGN.spacing.xs)}
                style={splitOrientation === 'horizontal' ? {
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  zIndex: 25,
                  transform: [{ translateX: -1 }],
                } : undefined}
              />

              <Animated.View style={[
                styles.floatingControlGroup,
                {
                  top: splitOrientation === 'vertical' ? '45%' : '50%',
                  width: controlGroupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ms(DESIGN.spacing.xxl), splitOrientation === 'horizontal' ? ms(DESIGN.height.sm + DESIGN.spacing.sm) : ms(DESIGN.height.sm * 4 + DESIGN.spacing.sm * 4)],
                  }),
                  height: controlGroupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ms(DESIGN.spacing.xxl), splitOrientation === 'horizontal' ? ms(DESIGN.height.sm * 4 + DESIGN.spacing.sm * 4) : ms(DESIGN.height.sm + DESIGN.spacing.sm)],
                  }),
                  transform: [
                    {
                      translateX: controlGroupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-ms(DESIGN.spacing.xxl) / 2, -(splitOrientation === 'horizontal' ? ms(DESIGN.height.sm + DESIGN.spacing.sm) : ms(DESIGN.height.sm * 4 + DESIGN.spacing.sm * 4)) / 2],
                      })
                    },
                    {
                      translateY: controlGroupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-ms(DESIGN.spacing.xxl) / 2, -(splitOrientation === 'horizontal' ? ms(DESIGN.height.sm * 4 + DESIGN.spacing.sm * 4) : ms(DESIGN.height.sm + DESIGN.spacing.sm)) / 2],
                      })
                    },
                  ],
                }
              ]}>
                {isControlGroupExpanded ? (
                  <View style={{ flex: 1, flexDirection: splitOrientation === 'horizontal' ? 'column' : 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      style={[styles.splitHandleBtn, { backgroundColor: primaryColor + '1F' }]}
                      onPress={handleToggleOrientation}
                      hitSlop={{
                        top: DESIGN.spacing.sm,
                        bottom: DESIGN.spacing.sm,
                        left: DESIGN.spacing.sm,
                        right: DESIGN.spacing.sm
                      }}
                    >
                      <BibleIcon
                        name="columns"
                        color={primaryColor}
                        size={ms(DESIGN.icon.xs)}
                      />
                    </TouchableOpacity>

                    <View style={{ [splitOrientation === 'horizontal' ? 'height' : 'width']: ms(DESIGN.spacing.sm) }} />

                    <TouchableOpacity
                      style={[styles.splitHandleBtn, { backgroundColor: primaryColor + '1F' }]}
                      onPress={handleSwapVersions}
                      hitSlop={{
                        top: DESIGN.spacing.sm,
                        bottom: DESIGN.spacing.sm,
                        left: DESIGN.spacing.sm,
                        right: DESIGN.spacing.sm
                      }}
                    >
                      <MaterialIcons
                        name={splitOrientation === 'vertical' ? 'swap-vert' : 'swap-horiz'}
                        color={primaryColor}
                        size={ms(DESIGN.icon.xs)}
                      />
                    </TouchableOpacity>

                    <View style={{ [splitOrientation === 'horizontal' ? 'height' : 'width']: ms(DESIGN.spacing.sm) }} />

                    <TouchableOpacity
                      style={[styles.splitHandleBtn, { backgroundColor: (colors.error || '#FF4D4D') + '1F' }]}
                      onPress={() => setIsSplitScreen(false)}
                      hitSlop={{
                        top: DESIGN.spacing.sm,
                        bottom: DESIGN.spacing.sm,
                        left: DESIGN.spacing.sm,
                        right: DESIGN.spacing.sm
                      }}
                    >
                      <BibleIcon name="x" color={colors.error || '#FF4D4D'} size={ms(DESIGN.icon.xs)} />
                    </TouchableOpacity>

                    <View style={{ [splitOrientation === 'horizontal' ? 'height' : 'width']: ms(DESIGN.spacing.sm) }} />

                    <TouchableOpacity
                      style={[styles.splitHandleBtn, { backgroundColor: colors.border + '40' }]}
                      onPress={handleToggleControlGroup}
                      hitSlop={{
                        top: DESIGN.spacing.sm,
                        bottom: DESIGN.spacing.sm,
                        left: DESIGN.spacing.sm,
                        right: DESIGN.spacing.sm
                      }}
                    >
                      <BibleIcon name={splitOrientation === 'horizontal' ? "chevron-up" : "chevron-left"} color={colors.textMuted} size={ms(DESIGN.icon.xs)} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleToggleControlGroup}
                    style={{
                      flex: 1,
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: primaryColor,
                      borderRadius: ms(DESIGN.borderRadius.md),
                    }}
                    activeOpacity={0.7}
                  >
                    <BibleIcon
                      name={splitOrientation === 'horizontal' ? "more-vertical" : "more-horizontal"}
                      color={colors.onPrimary}
                      size={ms(DESIGN.icon.xs)}
                    />
                  </TouchableOpacity>
                )}
              </Animated.View>

              <View style={splitOrientation === 'vertical' ? styles.splitPaneBottom : styles.splitPane}>
                {renderVersionBadge(secondVersion, () => openModal({
                  initialStep: 'version',
                  target: 'study',
                  initialVersion: secondVersion,
                  onSelect: (s) => {
                    if (s.version) setSecondVersion(s.version);
                  }
                }))}
                <BibleVerseReader
                  listRef={secondSectionListRef}
                  sections={secondSectionData}
                  blinkingVerse={blinkingVerse}
                  highlights={highlights}
                  version={secondVersion}
                  selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
                  bookAbbrev={currentBook.abbrev}
                  onVersePress={onVersePress}
                  onScroll={handleSecondScroll}
                  scrollEventThrottle={16}
                />
              </View>
            </View>
          ) : (
            <View style={styles.splitPane}>
              {renderVersionBadge(version, () => openModal({
                initialStep: 'version',
                initialVersion: version,
                onSelect: (s) => {
                  if (s.version) {
                    navigateTo({ version: s.version });
                    setTimeout(() => scrollToVerse(verse, chapter), 600);
                  }
                }
              }))}
              <BibleVerseReader
                listRef={sectionListRef}
                sections={sectionData}
                blinkingVerse={blinkingVerse}
                highlights={highlights}
                version={version}
                selectedKeys={selectedVerses.reduce((acc, v) => { acc[`${v.bookAbbrev}-${v.chapter}-${v.verse}`] = true; return acc; }, {} as Record<string, boolean>)}
                bookAbbrev={currentBook.abbrev}
                onVersePress={onVersePress}
                onScroll={handleReaderScroll}
                scrollEventThrottle={16}
              />
            </View>
          )}

          {!isActionSheetVisible && (
            <Animated.View
              pointerEvents={isNavInteractive ? 'box-none' : 'none'}
              style={[
                styles.floatingNav,
                {
                  opacity: navVisibleAnim,
                  transform: [{
                    translateY: navVisibleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ms(24), 0],
                    }),
                  }],
                },
              ]}>
              <BibleIcon
                name="chevron-left"
                size={navIconSize}
                containerSize={navBtnSize}
                color={navIcon}
                backgroundColor={navBg}
                borderRadius={ms(DESIGN.borderRadius.md)}
                onPress={() => handleNavigateChapter(-1)}
                activeOpacity={0.8}
                style={{ elevation: 4, shadowColor: colors.shadow, shadowOffset: { width: 0, height: ms(2) }, shadowOpacity: 0.25, shadowRadius: ms(3) }}
              />

              <BibleIcon
                name="chevron-right"
                size={navIconSize}
                containerSize={navBtnSize}
                color={navIcon}
                backgroundColor={navBg}
                borderRadius={ms(DESIGN.borderRadius.md)}
                onPress={() => handleNavigateChapter(1)}
                activeOpacity={0.8}
                style={{ elevation: 4, shadowColor: colors.shadow, shadowOffset: { width: 0, height: ms(2) }, shadowOpacity: 0.25, shadowRadius: ms(3) }}
              />
            </Animated.View>
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
      <BibleConfirmModal
        visible={isExitConfirmVisible}
        title="Sair do aplicativo"
        message="Tem certeza que deseja sair do aplicativo?"
        confirmText="Sair"
        isDanger={true}
        onConfirm={() => BackHandler.exitApp()}
        onCancel={() => setIsExitConfirmVisible(false)}
      />
      <BibleToast opacity={opacity} toast={toast} />
    </View>
  );
}
