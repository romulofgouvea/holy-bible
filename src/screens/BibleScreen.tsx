import { BibleVerseActionSheet } from '@/components/modals/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/modals/ReaderSettingsModal';
import { Book, SelectedVerse } from '@/models';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { getBibleData } from '../data';
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
  const { ms, DESIGN, width, height } = useResponsive();
  const { toast, opacity, show } = useToast();
  const { colors } = useTheme();
  const { readerTheme, readerColors } = useReaderSettings();
  const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;

  const [isSplitScreen, setIsSplitScreen] = useState(false);
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
    return [{
      title: `${secondCurrentBook.name} ${chapter}`,
      data: verses.map((text, i) => ({
        bookAbbrev: secondCurrentBook.abbrev,
        chapter,
        verse: i + 1,
        text
      }))
    }];
  }, [secondCurrentBook, chapter]);

  const [splitRatio, setSplitRatio] = useState(0.5);
  const startSplitRatio = useRef(0.5);
  const isDraggingDivider = useRef(false);
  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Refs to avoid stale closures in PanResponder callbacks
  const splitRatioRef = useRef(splitRatio);
  const splitOrientationRef = useRef(splitOrientation);
  const containerLayoutRef = useRef(containerLayout);

  const firstHalfRef = useRef<View>(null);
  const secondHalfRef = useRef<View>(null);
  const currentDragRatio = useRef(splitRatio);

  useEffect(() => {
    splitRatioRef.current = splitRatio;
    currentDragRatio.current = splitRatio;
  }, [splitRatio]);

  useEffect(() => {
    splitOrientationRef.current = splitOrientation;
  }, [splitOrientation]);

  useEffect(() => {
    containerLayoutRef.current = containerLayout;
  }, [containerLayout]);

  const isScrollingTop = useRef(false);
  const isScrollingBottom = useRef(false);

  const handleFirstScroll = useCallback((event: any) => {
    if (isDraggingDivider.current) return;
    if (isScrollingBottom.current) return;
    isScrollingTop.current = true;
    if (secondSectionListRef.current) {
      const offsetY = event.nativeEvent.contentOffset.y;
      secondSectionListRef.current.scrollToOffset({ offset: offsetY, animated: false });
    }
    setTimeout(() => {
      isScrollingTop.current = false;
    }, 50);
  }, []);

  const handleSecondScroll = useCallback((event: any) => {
    if (isDraggingDivider.current) return;
    if (isScrollingTop.current) return;
    isScrollingBottom.current = true;
    if (sectionListRef.current) {
      const offsetY = event.nativeEvent.contentOffset.y;
      sectionListRef.current.scrollToOffset({ offset: offsetY, animated: false });
    }
    setTimeout(() => {
      isScrollingBottom.current = false;
    }, 50);
  }, []);

  const handleToggleOrientation = useCallback(() => {
    setSplitOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
    setSplitRatio(0.5);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Set to false so nested TouchableOpacity buttons receive touch down events instantly
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        isDraggingDivider.current = true;
        startSplitRatio.current = splitRatioRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const layoutHeight = containerLayoutRef.current.height || height;
        const layoutWidth = containerLayoutRef.current.width || width;
        if (layoutHeight === 0 || layoutWidth === 0) return;

        let newRatio = 0.5;
        if (splitOrientationRef.current === 'vertical') {
          const deltaY = gestureState.dy;
          const ratioDelta = deltaY / layoutHeight;
          newRatio = Math.max(0.35, Math.min(0.65, startSplitRatio.current + ratioDelta));
        } else {
          const deltaX = gestureState.dx;
          const ratioDelta = deltaX / layoutWidth;
          newRatio = Math.max(0.35, Math.min(0.65, startSplitRatio.current + ratioDelta));
        }

        currentDragRatio.current = newRatio;

        // Perform native size mutation for butter-smooth 60fps dragging on Android/iOS/Web (bypasses full React re-renders)
        const isVert = splitOrientationRef.current === 'vertical';
        const firstPercent = `${newRatio * 100}%`;
        const secondPercent = `${(1 - newRatio) * 100}%`;

        // Calculate absolute numeric sizes for native layout updates (since setNativeProps does not support percentage strings on native views)
        const firstPixelSize = isVert ? newRatio * layoutHeight : newRatio * layoutWidth;
        const secondPixelSize = isVert ? (1 - newRatio) * layoutHeight : (1 - newRatio) * layoutWidth;

        let success = false;
        if (firstHalfRef.current && secondHalfRef.current) {
          if (typeof firstHalfRef.current.setNativeProps === 'function' && typeof secondHalfRef.current.setNativeProps === 'function') {
            firstHalfRef.current.setNativeProps({
              style: {
                flex: newRatio,
                width: isVert ? '100%' : firstPixelSize,
                height: isVert ? firstPixelSize : '100%',
              }
            });
            secondHalfRef.current.setNativeProps({
              style: {
                flex: 1 - newRatio,
                width: isVert ? '100%' : secondPixelSize,
                height: isVert ? secondPixelSize : '100%',
              }
            });
            success = true;
          } else {
            // Web/DOM fallback
            const firstStyle = (firstHalfRef.current as any).style;
            const secondStyle = (secondHalfRef.current as any).style;
            if (firstStyle && secondStyle) {
              firstStyle.flex = String(newRatio);
              firstStyle.width = isVert ? '100%' : firstPercent;
              firstStyle.height = isVert ? firstPercent : '100%';

              secondStyle.flex = String(1 - newRatio);
              secondStyle.width = isVert ? '100%' : secondPercent;
              secondStyle.height = isVert ? secondPercent : '100%';
              success = true;
            }
          }
        }
        if (!success) {
          setSplitRatio(newRatio);
        }
      },
      onPanResponderRelease: () => {
        isDraggingDivider.current = false;
        // Sync final ratio back to state once interaction finishes
        setSplitRatio(currentDragRatio.current);
      },
      onPanResponderTerminate: () => {
        isDraggingDivider.current = false;
        // Reset or commit to state depending on behavior (committing ensures it stays where user terminated)
        setSplitRatio(currentDragRatio.current);
      },
    })
  ).current;

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
    miniHeaderVertical: {
      width: ms(DESIGN.spacing.xl),
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
      overflow: 'visible',
    },
    versionBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ms(DESIGN.borderRadius.sm),
      paddingHorizontal: ms(DESIGN.spacing.sm),
      paddingVertical: ms(DESIGN.spacing.xs),
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    versionBadgeText: {
      fontSize: ms(DESIGN.fontSize.xs + 1),
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    dragHandleHorizontal: {
      width: ms(DESIGN.button.height.sm),
      height: ms(DESIGN.spacing.xs + DESIGN.spacing.tiny),
      borderRadius: ms((DESIGN.spacing.xs + DESIGN.spacing.tiny) / 2),
      backgroundColor: primaryColor,
    },
    dragHandleVertical: {
      width: ms(DESIGN.spacing.xs + DESIGN.spacing.tiny),
      height: ms(DESIGN.button.height.sm),
      borderRadius: ms((DESIGN.spacing.xs + DESIGN.spacing.tiny) / 2),
      backgroundColor: primaryColor,
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
      width: ms(DESIGN.spacing.xxl - DESIGN.spacing.tiny),
      height: ms(DESIGN.spacing.xxl - DESIGN.spacing.tiny),
      borderRadius: ms(DESIGN.borderRadius.sm),
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [ms, colors, DESIGN, primaryColor]);

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
                  setSplitRatio(0.5);
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

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View
          ref={containerRef}
          style={styles.content}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setContainerLayout({ x: 0, y: 0, width, height });
          }}
        >
          {isSplitScreen ? (
            <View style={{ flex: 1, flexDirection: splitOrientation === 'vertical' ? 'column' : 'row' }}>
              {/* Top/Left Half */}
              <View
                ref={firstHalfRef}
                style={{
                  flex: splitRatio,
                  position: 'relative',
                  width: splitOrientation === 'vertical' ? '100%' : `${splitRatio * 100}%`,
                  height: splitOrientation === 'vertical' ? `${splitRatio * 100}%` : '100%',
                  minWidth: splitOrientation === 'vertical' ? undefined : '25%',
                  maxWidth: splitOrientation === 'vertical' ? undefined : '75%',
                  minHeight: splitOrientation === 'vertical' ? '25%' : undefined,
                  maxHeight: splitOrientation === 'vertical' ? '75%' : undefined,
                }}
              >
                {splitOrientation === 'horizontal' && (
                  <>
                    <View
                      style={{
                        height: ms(DESIGN.spacing.xxxl),
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: ms(DESIGN.spacing.md),
                        backgroundColor: colors.background,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.versionBadge}
                        onPress={() => {
                          openModal({
                            initialStep: 'version',
                            onSelect: (s) => {
                              if (s.version) {
                                navigateTo({ version: s.version });
                                setTimeout(() => scrollToVerse(verse, chapter), 600);
                              }
                            }
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <BibleText style={[styles.versionBadgeText, { color: primaryColor }]}>
                          {version.toUpperCase()}
                        </BibleText>
                      </TouchableOpacity>
                    </View>
                    <BibleDivider />
                  </>
                )}
                <View style={{ flex: 1 }}>
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
              </View>

              {/* Divider Handle Container / Mini-Header */}
              {splitOrientation === 'vertical' && <BibleDivider />}
              <View
                style={[
                  splitOrientation === 'vertical' ? styles.miniHeaderHorizontal : styles.miniHeaderVertical,
                  {
                    backgroundColor: splitOrientation === 'vertical' ? colors.background : 'transparent',
                  }
                ]}
              >
                {splitOrientation === 'vertical' ? (
                  // Horizontal Divider (Vertical Split)
                  <>
                    {/* Left: Version Badge Pill */}
                    <TouchableOpacity
                      style={styles.versionBadge}
                      onPress={() => {
                        openModal({
                          initialStep: 'version',
                          target: 'study',
                          onSelect: (s) => {
                            if (s.version) {
                              setSecondVersion(s.version);
                            }
                          }
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <BibleText style={[styles.versionBadgeText, { color: primaryColor }]}>
                        {secondVersion.toUpperCase()}
                      </BibleText>
                    </TouchableOpacity>

                    {/* Middle: Drag Handle Area */}
                    <View
                      style={{
                        flex: 1,
                        alignSelf: 'stretch',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      {...panResponder.panHandlers}
                    >
                      <View style={styles.dragHandleHorizontal} />
                    </View>

                    {/* Right: Actions */}
                    <View style={styles.actionRow}>
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

                      <View style={{ width: ms(DESIGN.spacing.sm) }} />

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
                    </View>
                  </>
                ) : (
                  // Vertical Divider (Horizontal Split / Side-by-Side)
                  <>
                    {/* Centered vertical line */}
                    <BibleDivider
                      vertical
                      size={ms(DESIGN.spacing.xs)}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        transform: [{ translateX: -1 }],
                      }}
                    />

                    {/* Draggable Top Half Spacer */}
                    <View
                      style={{
                        flex: 1,
                        alignSelf: 'stretch',
                      }}
                      {...panResponder.panHandlers}
                    />

                    {/* Middle Floating Control Group */}
                    <View
                      style={{
                        width: ms(DESIGN.button.height.sm),
                        height: ms(DESIGN.button.height.sm * 2 + DESIGN.spacing.sm),
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: ms(DESIGN.borderRadius.md),
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 3,
                        zIndex: 30,
                      }}
                    >
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
                          name="align-justify"
                          color={primaryColor}
                          size={ms(DESIGN.icon.xs)}
                        />
                      </TouchableOpacity>

                      <View style={{ height: ms(DESIGN.spacing.sm) }} />

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
                    </View>

                    {/* Draggable Bottom Half Spacer */}
                    <View
                      style={{
                        flex: 1,
                        alignSelf: 'stretch',
                      }}
                      {...panResponder.panHandlers}
                    />
                  </>
                )}
              </View>
              {splitOrientation === 'vertical' && <BibleDivider />}

              {/* Bottom/Right Half */}
              <View
                ref={secondHalfRef}
                style={{
                  flex: 1 - splitRatio,
                  position: 'relative',
                  flexDirection: 'column',
                  width: splitOrientation === 'vertical' ? '100%' : `${(1 - splitRatio) * 100}%`,
                  height: splitOrientation === 'vertical' ? `${(1 - splitRatio) * 100}%` : '100%',
                  minWidth: splitOrientation === 'vertical' ? undefined : '25%',
                  maxWidth: splitOrientation === 'vertical' ? undefined : '75%',
                  minHeight: splitOrientation === 'vertical' ? '25%' : undefined,
                  maxHeight: splitOrientation === 'vertical' ? '75%' : undefined,
                }}
              >
                {splitOrientation === 'horizontal' && (
                  <>
                    <View
                      style={{
                        height: ms(DESIGN.spacing.xxxl),
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: ms(DESIGN.spacing.md),
                        backgroundColor: colors.background,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.versionBadge}
                        onPress={() => {
                          openModal({
                            initialStep: 'version',
                            target: 'study',
                            onSelect: (s) => {
                              if (s.version) {
                                setSecondVersion(s.version);
                              }
                            }
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <BibleText style={[styles.versionBadgeText, { color: primaryColor }]}>
                          {secondVersion.toUpperCase()}
                        </BibleText>
                      </TouchableOpacity>
                    </View>
                    <BibleDivider />
                  </>
                )}
                <View style={{ flex: 1 }}>
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
            </View>
          ) : (
            <View style={{ flex: 1, position: 'relative' }}>
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
            </View>
          )}

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
