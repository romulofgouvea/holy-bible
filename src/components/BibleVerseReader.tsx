import { VERSE_HIGHLIGHTS } from '@/constants/colors';
import React from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    listRef?: React.RefObject<SectionList<VerseItem>>;
    onScrollToIndexFailed?: (info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
    }) => void;
};

export const BibleVerseReader = React.memo((props: VerseReaderProps) => {
    const {
        sections, blinkingVerse, highlights, selectedKeys, bookAbbrev, version,
        onVersePress, onViewableItemsChanged, viewabilityConfig, listRef, onScrollToIndexFailed
    } = props;
    const { ms } = useResponsive();
    const { colors } = useTheme();
    const { fontSizeMultiplier, textAlign, readerColors, readerTheme, readerFontFamily } = useReaderSettings();

    const getHighlightColorValue = (colorId: string) => {
        const h = VERSE_HIGHLIGHTS.find(v => v.id === colorId);
        // Append '4D' (30% opacity) to make the highlight subtle and readable in both light and dark modes
        return h ? `${h.hex}4D` : colors.surfaceHighlight;
    };

    return (
        <SectionList
            ref={listRef}
            style={[styles.verseList, { backgroundColor: readerColors.background }]}
            sections={sections}
            extraData={{ blinkingVerse, highlights, selectedKeys, version, readerColors, fontSizeMultiplier, textAlign }}
            keyExtractor={(item, idx) => `${item.chapter}-${item.verse}-${idx}`}
            onScrollToIndexFailed={onScrollToIndexFailed}
            renderSectionHeader={({ section: { title } }) => (
                <View style={[styles.chapterHeader, { backgroundColor: readerColors.background }]}>
                    <BibleText style={[styles.chapterHeaderText, { fontSize: ms(28 * fontSizeMultiplier), color: readerColors.onBackground }]}>{title}</BibleText>
                </View>
            )}
            renderItem={({ item }) => {
                const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
                const highlightColorId = highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                const isSelected = selectedKeys[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
                const primaryLow = `${primaryColor}20`; // 12.5% opacity

                return (
                    <TouchableOpacity
                        onPress={() => { impactLight(); onVersePress(item); }}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.verseRow,
                            highlightColorId && [styles.highlightedRow, { backgroundColor: getHighlightColorValue(highlightColorId) }],
                            isBlinking && [styles.blinkingRow, { backgroundColor: primaryLow }],
                            isSelected && [styles.selectedRow, { backgroundColor: primaryLow, borderLeftColor: primaryColor }],
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
                        </View>
                    </TouchableOpacity>
                );
            }}
            renderSectionFooter={() => {
                const versionInfo = ALIASES.find(v => v.sigla === version);
                const copyright = (versionInfo as any)?.copyright;
                if (!copyright) return null;
                const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
                const primaryLow = primaryColor + '1A'; // 10% opacity
                return (
                    <View style={[
                        styles.copyrightCard,
                        { backgroundColor: primaryLow, borderLeftColor: primaryColor }
                    ]}>
                        <BibleText style={[styles.copyrightTitle, { color: primaryColor }]}>
                            {versionInfo?.name} ({versionInfo?.sigla})
                        </BibleText>
                        <BibleText style={[styles.copyrightText, { color: readerColors.onBackground, opacity: 0.6 }]}>
                            {copyright}
                        </BibleText>
                    </View>
                );
            }}
            contentContainerStyle={styles.readerContent}
            initialNumToRender={180}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
        />
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
    highlightedRow: {},
    blinkingRow: {},
    selectedRow: {
        borderLeftWidth: 3,
    },
    verseNumber: {
        fontWeight: '700',
        marginBottom: 4,
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
