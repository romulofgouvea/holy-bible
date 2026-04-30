import React from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ALIASES } from '../data';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';

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
    onViewableItemsChanged: ({ viewableItems }: { viewableItems: any[] }) => void;
    viewabilityConfig: any;
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
    const { fontSizeMultiplier, textAlign, readerColors, readerTheme } = useReaderSettings();

    const getHighlightColorValue = (colorId: string) => {
        const themeColors = readerTheme === 'sepia' ? readerColors : colors;
        switch (colorId) {
            case 'yellow': return colors.highlightYellow;
            case 'blue': return colors.highlightBlue;
            case 'green': return colors.highlightGreen;
            case 'pink': return colors.highlightPink;
            default: return colors.highlightYellow;
        }
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
                    <Text style={[styles.chapterHeaderText, { fontSize: ms(28 * fontSizeMultiplier), color: readerColors.text }]}>{title}</Text>
                </View>
            )}
            renderItem={({ item }) => {
                const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
                const highlightColorId = highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                const isSelected = selectedKeys[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
                const primaryLow = readerTheme === 'sepia' ? (readerColors as any).primaryLow || colors.primaryLow : colors.primaryLow;

                return (
                    <TouchableOpacity
                        onPress={() => onVersePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.verseRow,
                            highlightColorId && [styles.highlightedRow, { backgroundColor: getHighlightColorValue(highlightColorId) }],
                            isBlinking && [styles.blinkingRow, { backgroundColor: readerColors.primaryContainer }],
                            isSelected && [styles.selectedRow, { backgroundColor: primaryLow, borderLeftColor: primaryColor }],
                        ]}>
                            <Text style={[styles.verseText, {
                                fontSize: ms(22 * fontSizeMultiplier),
                                lineHeight: ms(26 * fontSizeMultiplier),
                                color: readerColors.text,
                                textAlign: textAlign as any
                            }]}>
                                <Text style={{ color: primaryColor, fontWeight: '700', fontSize: ms(16 * fontSizeMultiplier), marginLeft: 16, marginRight: 8 }}>
                                    {`${item.verse} `}
                                </Text>
                                {item.text}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            }}
            renderSectionFooter={() => {
                const versionInfo = ALIASES.find(v => v.sigla === version);
                const copyright = (versionInfo as any)?.copyright;
                if (!copyright) return null;
                const primaryColor = readerTheme === 'sepia' ? readerColors.primary : colors.primary;
                const primaryLow = readerTheme === 'sepia' ? (readerColors as any).primaryLow || colors.primaryLow : colors.primaryLow;
                return (
                    <View style={[
                        styles.copyrightCard,
                        { backgroundColor: primaryLow, borderLeftColor: primaryColor }
                    ]}>
                        <Text style={[styles.copyrightTitle, { color: primaryColor }]}>
                            {versionInfo?.name} ({versionInfo?.sigla})
                        </Text>
                        <Text style={[styles.copyrightText, { color: readerColors.textMuted }]}>
                            {copyright}
                        </Text>
                    </View>
                );
            }}
            contentContainerStyle={styles.readerContent}
            initialNumToRender={20}
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
        paddingBottom: 150,
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
