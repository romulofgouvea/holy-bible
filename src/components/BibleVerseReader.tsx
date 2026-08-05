import { VERSE_HIGHLIGHTS } from "@/constants/colors";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { ALIASES } from "../data/bible-version";
import { useReaderSettings } from "../hooks/useReaderSettings";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { impactLight } from "../utils/haptics";
import { BibleText } from "./BibleText";

import { VerseTitle } from "../models";

type VerseItem = {
  chapter: number;
  verse: number;
  text: string;
  titles?: VerseTitle[];
};

type SectionType = {
  title: string;
  data: VerseItem[];
};

type VerseReaderProps = {
  sections: SectionType[];
  blinkingVerse: string | null;
  highlights: Record<string, any>;
  selectedKeys: Record<string, boolean>;
  bookAbbrev: string;
  version: string;
  onVersePress: (item: VerseItem) => void;
  onViewableItemsChanged?: ({
    viewableItems,
  }: {
    viewableItems: any[];
  }) => void;
  viewabilityConfig?: any;
  listRef?: React.RefObject<any>;
  onScroll?: (event: any) => void;
  onScrollBeginDrag?: (event: any) => void;
  onScrollEndDrag?: (event: any) => void;
  onMomentumScrollEnd?: (event: any) => void;
  scrollEventThrottle?: number;
};

const VerseRow = React.memo(
  ({
    item,
    isSelected,
    isHighlighted,
    isBlinking,
    highlightColorHex,
    primaryColor,
    readerColors,
    fontSizeMultiplier,
    textAlign,
    ms,
    DESIGN,
    styles,
    onVersePress,
  }: any) => {
    const blinkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isBlinking) {
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 450,
            delay: 500,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, [isBlinking, blinkAnim]);

    const primaryLow = `${primaryColor}20`;

    const animatedBackgroundColor = blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isHighlighted
          ? highlightColorHex
          : isSelected
            ? primaryLow
            : "transparent",
        primaryLow,
      ],
    });

    const zeroIndexTitles =
      item.titles?.filter((t: any) => t.positionIndex === 0) || [];
    const midVerseTitles =
      item.titles?.filter((t: any) => t.positionIndex > 0) || [];

    const renderMidVerseTitlesAndText = () => {
      if (midVerseTitles.length === 0) {
        return (
          <React.Fragment>
            {"\u00A0\u00A0"}
            {item.text}
          </React.Fragment>
        );
      }

      const elements = [];
      let currentTextIndex = 0;

      const sortedTitles = [...midVerseTitles].sort(
        (a, b) => a.positionIndex - b.positionIndex,
      );

      sortedTitles.forEach((t, index) => {
        const textBefore = item.text.substring(
          currentTextIndex,
          t.positionIndex,
        );
        elements.push(
          <React.Fragment key={`text-${index}`}>
            {index === 0 ? "\u00A0\u00A0" : ""}
            {textBefore}
          </React.Fragment>,
        );
        currentTextIndex = t.positionIndex;

        elements.push(
          <BibleText
            key={`title-${index}`}
            style={{
              color: primaryColor,
              fontWeight: t.type === "section" ? "700" : "500",
              fontStyle: t.type === "speech" ? "italic" : "normal",
            }}
          >
            {"\n\n"}
            {t.title}
            {"\n"}
          </BibleText>,
        );
      });

      if (currentTextIndex < item.text.length) {
        elements.push(
          <React.Fragment key="text-end">
            {item.text.substring(currentTextIndex)}
          </React.Fragment>,
        );
      }

      return elements;
    };

    return (
      <TouchableOpacity
        onPress={() => {
          impactLight();
          onVersePress(item);
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.verseRow,
            { backgroundColor: animatedBackgroundColor },
            isSelected && { borderLeftColor: primaryColor },
          ]}
        >
          {zeroIndexTitles.map((t: any, i: number) => (
            <BibleText
              key={`zero-title-${i}`}
              style={[
                styles.sectionTitle,
                {
                  color: primaryColor,
                  fontSize: ms(DESIGN.fontSize.xl * fontSizeMultiplier),
                  fontStyle: t.type === "speech" ? "italic" : "normal",
                },
              ]}
            >
              {t.title}
            </BibleText>
          ))}

          <BibleText
            variant="reading"
            style={[
              styles.verseText,
              {
                fontSize: ms(DESIGN.fontSize.xxl * fontSizeMultiplier),
                lineHeight: ms(28 * fontSizeMultiplier),
                color: readerColors.onBackground,
                textAlign: textAlign as any,
              },
            ]}
          >
            <BibleText
              style={{
                color: primaryColor,
                fontWeight: "700",
                fontSize: ms(DESIGN.fontSize.lg * fontSizeMultiplier),
              }}
            >
              {item.verse}
            </BibleText>
            {renderMidVerseTitlesAndText()}
          </BibleText>
        </Animated.View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item === nextProps.item &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHighlighted === nextProps.isHighlighted &&
      prevProps.isBlinking === nextProps.isBlinking &&
      prevProps.fontSizeMultiplier === nextProps.fontSizeMultiplier &&
      prevProps.textAlign === nextProps.textAlign &&
      prevProps.readerColors.background === nextProps.readerColors.background &&
      prevProps.primaryColor === nextProps.primaryColor &&
      prevProps.styles === nextProps.styles
    );
  },
);

export const BibleVerseReader = React.memo((props: VerseReaderProps) => {
  const {
    sections,
    blinkingVerse,
    highlights,
    selectedKeys,
    bookAbbrev,
    version,
    onVersePress,
    onViewableItemsChanged,
    viewabilityConfig,
    listRef,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    scrollEventThrottle,
  } = props;
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  const { fontSizeMultiplier, textAlign, readerColors, readerTheme } =
    useReaderSettings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        verseList: {
          flex: 1,
        },
        chapterHeader: {
          paddingVertical: ms(DESIGN.spacing.xl),
          paddingHorizontal: ms(DESIGN.spacing.lg),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: ms(DESIGN.spacing.sm),
        },
        chapterHeaderText: {
          fontWeight: "800",
          letterSpacing: 0.5,
        },
        sectionTitle: {
          fontWeight: "700",
          marginBottom: ms(DESIGN.spacing.md),
          letterSpacing: 0.3,
        },
        verseRow: {
          paddingVertical: ms(DESIGN.spacing.md),
          paddingHorizontal: ms(DESIGN.spacing.lg),
          borderRadius: 0,
          marginHorizontal: 0,
          borderLeftWidth: ms(DESIGN.spacing.xs),
          borderLeftColor: "transparent",
        },
        verseText: {
          flexWrap: "wrap",
          textAlignVertical: "top",
        },
        readerContent: {
          paddingBottom: ms(DESIGN.layout.listPaddingBottom),
        },
        copyrightCard: {
          marginHorizontal: ms(DESIGN.spacing.lg),
          marginTop: ms(DESIGN.spacing.xl),
          marginBottom: ms(DESIGN.spacing.lg),
          padding: ms(DESIGN.spacing.lg),
          borderRadius: ms(DESIGN.borderRadius.md),
          borderLeftWidth: ms(DESIGN.spacing.xs),
        },
        copyrightTitle: {
          fontSize: ms(DESIGN.fontSize.md),
          fontWeight: "700",
          marginBottom: ms(DESIGN.spacing.xs),
          letterSpacing: 0.3,
        },
        copyrightText: {
          fontSize: ms(DESIGN.fontSize.xs),
          lineHeight: ms(DESIGN.fontSize.lg),
          opacity: 0.75,
        },
      }),
    [ms, colors, DESIGN],
  );

  const getHighlightColorValue = (colorId: string) => {
    const h = VERSE_HIGHLIGHTS.find((v) => v.id === colorId);
    return h ? `${h.hex}4D` : colors.surfaceHighlight;
  };

  const flatData = useMemo(() => {
    const data: any[] = [];
    sections.forEach((sec) => {
      data.push({ type: "header", title: sec.title });
      sec.data.forEach((v) => {
        data.push({ type: "verse", ...v });
      });
      const versionInfo = ALIASES.find((v) => v.sigla === version);
      const copyright = (versionInfo as any)?.copyright;
      if (copyright) {
        data.push({ type: "footer", versionInfo, copyright });
      }
    });
    return data;
  }, [sections, version]);

  const primaryColor =
    readerTheme === "sepia" ? readerColors.primary : colors.primary;

  return (
    <View
      style={[styles.verseList, { backgroundColor: readerColors.background }]}
      testID="bible-verse-reader"
    >
      <FlashList
        ref={listRef}
        data={flatData}
        getItemType={(item) => item.type}
        // @ts-ignore - necessary for FlashList performance despite missing in updated types
        estimatedItemSize={ms(
          DESIGN.layout.settingsIconOffset * fontSizeMultiplier,
        )}
        keyExtractor={(item, idx) => {
          if (item.type === "header") return `header-${item.title}`;
          if (item.type === "footer")
            return `footer-${item.versionInfo?.sigla}-${idx}`;
          return `verse-${item.chapter}-${item.verse}`;
        }}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View
                style={[
                  styles.chapterHeader,
                  { backgroundColor: readerColors.background },
                ]}
              >
                <BibleText
                  style={[
                    styles.chapterHeaderText,
                    {
                      fontSize: ms(
                        DESIGN.fontSize.display * 0.875 * fontSizeMultiplier,
                      ),
                      color: readerColors.onBackground,
                    },
                  ]}
                >
                  {item.title}
                </BibleText>
              </View>
            );
          }
          if (item.type === "footer") {
            const primaryLow = primaryColor + "1A";
            return (
              <View>
                <View
                  style={[
                    styles.copyrightCard,
                    {
                      backgroundColor: primaryLow,
                      borderLeftColor: primaryColor,
                    },
                  ]}
                >
                  <BibleText
                    style={[styles.copyrightTitle, { color: primaryColor }]}
                  >
                    {item.versionInfo?.name} ({item.versionInfo?.sigla})
                  </BibleText>
                  <BibleText
                    style={[
                      styles.copyrightText,
                      { color: readerColors.onBackground, opacity: 0.6 },
                    ]}
                  >
                    {item.copyright}
                  </BibleText>
                </View>
              </View>
            );
          }

          const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
          const highlight =
            highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
          const highlightColorId = highlight
            ? typeof highlight === "string"
              ? highlight
              : highlight.color
            : undefined;
          const isSelected =
            selectedKeys[`${bookAbbrev}-${item.chapter}-${item.verse}`];
          const highlightColorHex = getHighlightColorValue(highlightColorId);

          return (
            <VerseRow
              item={item}
              isSelected={isSelected}
              isHighlighted={!!highlightColorId}
              isBlinking={isBlinking}
              highlightColorHex={highlightColorHex}
              primaryColor={primaryColor}
              readerColors={readerColors}
              fontSizeMultiplier={fontSizeMultiplier}
              textAlign={textAlign}
              ms={ms}
              DESIGN={DESIGN}
              styles={styles}
              onVersePress={onVersePress}
            />
          );
        }}
        contentContainerStyle={styles.readerContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
      />
    </View>
  );
});
