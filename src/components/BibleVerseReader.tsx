import { VERSE_HIGHLIGHTS } from '@/constants/colors';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ALIASES } from '../data';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { impactLight } from '../utils/haptics';
import { BibleText } from './BibleText';

type VerseItem = {
    chapter: number;
    verse: number;
    text: string;
};

type SectionType = {
    title: string;
    data: VerseItem[];
};

type VerseReaderProps = {
    sections: SectionType[];
    blinkingVerse: string | null;
    highlights: Record<string, string>;
    selectedKeys: Record<string, boolean>;
    bookAbbrev: string;
    version: string;
    onVersePress: (item: VerseItem) => void;
    onViewableItemsChanged?: ({ viewableItems }: { viewableItems: any[] }) => void;
    viewabilityConfig?: any;
    listRef?: React.RefObject<any>;
};

const VerseRow = React.memo(({
    item, isSelected, isHighlighted, isBlinking, highlightColorHex, primaryColor, readerColors,
    fontSizeMultiplier, textAlign, ms, onVersePress
}: any) => {
    const blinkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isBlinking) {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
                Animated.timing(blinkAnim, { toValue: 0, duration: 450, delay: 500, useNativeDriver: false })
            ]).start();
        }
    }, [isBlinking, blinkAnim]);

    const primaryLow = `${primaryColor}20`; // 12.5% opacity

    const animatedBackgroundColor = blinkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isHighlighted ? highlightColorHex : (isSelected ? primaryLow : 'transparent'),
            primaryLow
        ]
    });

    return (
        <TouchableOpacity onPress={() => { impactLight(); onVersePress(item); }} activeOpacity={0.7}>
            <Animated.View style={[
                styles.verseRow,
                { backgroundColor: animatedBackgroundColor },
                isSelected && [styles.selectedRow, { borderLeftColor: primaryColor }],
            ]}>
                <BibleText
                    variant="reading"
                    style={[styles.verseText, {
                        fontSize: ms(20 * fontSizeMultiplier),
                        lineHeight: ms(28 * fontSizeMultiplier),
                        color: readerColors.onBackground,
                        textAlign: textAlign as any,
                    }]}
                >
                    <BibleText style={{ color: primaryColor, fontWeight: '700', fontSize: ms(16 * fontSizeMultiplier) }}>
                        {item.verse}
                    </BibleText>
                    {'\u00A0\u00A0'}{item.text}
                </BibleText>
            </Animated.View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item === nextProps.item &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isHighlighted === nextProps.isHighlighted &&
        prevProps.isBlinking === nextProps.isBlinking &&
        prevProps.fontSizeMultiplier === nextProps.fontSizeMultiplier &&
        prevProps.textAlign === nextProps.textAlign &&
        prevProps.readerColors.background === nextProps.readerColors.background &&
        prevProps.primaryColor === nextProps.primaryColor
    );
});

export const BibleVerseReader = React.memo((props: VerseReaderProps) => {
    const {
        sections, blinkingVerse, highlights, selectedKeys, bookAbbrev, version,
        onVersePress, onViewableItemsChanged, viewabilityConfig, listRef
    } = props;
    const { ms } = useResponsive();
    const { colors } = useTheme();
    const { fontSizeMultiplier, textAlign, readerColors, readerTheme } = useReaderSettings();

    const getHighlightColorValue = (colorId: string) => {
        const h = VERSE_HIGHLIGHTS.find(v => v.id === colorId);
        return h ? `${h.hex}4D` : colors.surfaceHighlight;
    };

    const flatData = useMemo(() => {
        const data: any[] = [];
        sections.forEach(sec => {
            data.push({ type: 'header', title: sec.title });
            sec.data.forEach(v => {
                data.push({ type: 'verse', ...v });
            });
            const versionInfo = ALIASES.find(v => v.sigla === version);
            const copyright = (versionInfo as any)?.copyright;
            if (copyright) {
                data.push({ type: 'footer', versionInfo, copyright });
            }
        });
        return data;
    }, [sections, version]);

    const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;

    return (
        <View style={[styles.verseList, { backgroundColor: readerColors.background }]} testID="bible-verse-reader">
            <FlashList
                ref={listRef}
                data={flatData}
                getItemType={(item) => item.type}
                // @ts-ignore - necessary for FlashList performance despite missing in updated types
                estimatedItemSize={70 * fontSizeMultiplier}
                keyExtractor={(item, idx) => {
                    if (item.type === 'header') return `header-${item.title}`;
                    if (item.type === 'footer') return `footer-${item.versionInfo?.sigla}-${idx}`;
                    return `verse-${item.chapter}-${item.verse}`;
                }}
                renderItem={({ item }) => {
                    if (item.type === 'header') {
                        return (
                            <View style={[styles.chapterHeader, { backgroundColor: readerColors.background }]}>
                                <BibleText style={[styles.chapterHeaderText, { fontSize: ms(28 * fontSizeMultiplier), color: readerColors.onBackground }]}>{item.title}</BibleText>
                            </View>
                        );
                    }
                    if (item.type === 'footer') {
                        const primaryLow = primaryColor + '1A';
                        return (
                            <View style={[styles.copyrightCard, { backgroundColor: primaryLow, borderLeftColor: primaryColor }]}>
                                <BibleText style={[styles.copyrightTitle, { color: primaryColor }]}>
                                    {item.versionInfo?.name} ({item.versionInfo?.sigla})
                                </BibleText>
                                <BibleText style={[styles.copyrightText, { color: readerColors.onBackground, opacity: 0.6 }]}>
                                    {item.copyright}
                                </BibleText>
                            </View>
                        );
                    }

                    const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
                    const highlightColorId = highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                    const isSelected = selectedKeys[`${bookAbbrev}-${item.chapter}-${item.verse}`];
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
                            onVersePress={onVersePress}
                        />
                    );
                }}
                contentContainerStyle={styles.readerContent}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    verseList: {
        flex: 1,
    },
    chapterHeader: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    chapterHeaderText: {
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    verseRow: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 0,
        marginHorizontal: 0,
    },
    selectedRow: {
        borderLeftWidth: 3,
    },
    verseText: {
        flexWrap: 'wrap',
        textAlignVertical: 'top',
    },
    readerContent: {
        paddingBottom: 100,
    },
    copyrightCard: {
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    copyrightTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    copyrightText: {
        fontSize: 11,
        lineHeight: 17,
        opacity: 0.75,
    },
});
