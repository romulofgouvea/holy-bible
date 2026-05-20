import { BibleVerseActionSheet } from '@/components/modals/BibleVerseActionSheet';
import { ReaderSettingsModal } from '@/components/modals/ReaderSettingsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { Book, SelectedVerse } from '@/models';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
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

  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [isControlGroupExpanded, setIsControlGroupExpanded] = useState(false);
  const controlGroupAnim = useRef(new Animated.Value(0)).current;
  const hasRestored = useRef(false);

  useEffect(() => {
    if (!isReady) return;
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

  const handleFirstScroll = useCallback((event: any) => {
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
    setIsControlGroupExpanded(false);
    controlGroupAnim.setValue(0);
  }, [controlGroupAnim]);

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
    floatingControlGroup: {
      position: 'absolute',
      left: '50%',
      top: '50%',
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
      overflow: 'hidden',
    },
  }), [ms, colors, DESIGN]);

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
        <View style={styles.content}>
          {isSplitScreen ? (
            <View style={{ flex: 1, flexDirection: splitOrientation === 'vertical' ? 'column' : 'row', position: 'relative' }}>
              <View style={{ flex: 1, position: 'relative' }}>
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

              {splitOrientation === 'vertical' && <BibleDivider />}
              {splitOrientation === 'vertical' ? (
                <View
                  style={[
                    styles.miniHeaderHorizontal,
                    { backgroundColor: colors.background }
                  ]}
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

                  <View style={{ flex: 1 }} />

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
                </View>
              ) : (
                <>
                  <BibleDivider
                    vertical
                    size={ms(DESIGN.spacing.xs)}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      zIndex: 25,
                      transform: [{ translateX: -1 }],
                    }}
                  />

                  <Animated.View style={[
                    styles.floatingControlGroup,
                    {
                      width: controlGroupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [ms(DESIGN.spacing.xxl), ms(DESIGN.button.height.sm)],
                      }),
                      height: controlGroupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [ms(DESIGN.spacing.xxl), ms(DESIGN.button.height.sm * 3 + DESIGN.spacing.sm * 2)],
                      }),
                      transform: [
                        { translateX: controlGroupAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-ms(DESIGN.spacing.xxl) / 2, -ms(DESIGN.button.height.sm) / 2],
                          })
                        },
                        { translateY: controlGroupAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-ms(DESIGN.spacing.xxl) / 2, -ms(DESIGN.button.height.sm * 3 + DESIGN.spacing.sm * 2) / 2],
                          })
                        },
                      ],
                    }
                  ]}>
                    {isControlGroupExpanded ? (
                      <>
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

                        <View style={{ height: ms(DESIGN.spacing.sm) }} />

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
                          <BibleIcon name="chevron-up" color={colors.textSecondary} size={ms(DESIGN.icon.xs)} />
                        </TouchableOpacity>
                      </>
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
                          name="more-vertical"
                          color={colors.onPrimary}
                          size={ms(DESIGN.icon.xs)}
                        />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                </>
              )}
              {splitOrientation === 'vertical' && <BibleDivider />}

              <View style={{ flex: 1, position: 'relative', flexDirection: 'column' }}>
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
