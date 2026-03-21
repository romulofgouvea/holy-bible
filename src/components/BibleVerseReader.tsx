import React from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useReaderSettings } from '../hooks/use-reader-settings';

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
    const { fontSizeMultiplier, textAlign, readerColors, readerTheme } = useReaderSettings();

    const getHighlightColorValue = (colorId: string) => {
        const hexes: Record<string, string> = {
            yellow: readerTheme === 'dark' ? 'rgba(255, 215, 0, 0.25)' : readerTheme === 'sepia' ? 'rgba(255, 193, 7, 0.4)' : 'rgba(253, 224, 71, 0.6)',
            blue: readerTheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : readerTheme === 'sepia' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(147, 197, 253, 0.6)',
            green: readerTheme === 'dark' ? 'rgba(34, 197, 94, 0.25)' : readerTheme === 'sepia' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(134, 239, 172, 0.6)',
            pink: readerTheme === 'dark' ? 'rgba(236, 72, 153, 0.3)' : readerTheme === 'sepia' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(249, 168, 212, 0.6)',
        };
        return hexes[colorId] || hexes.yellow;
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

                return (
                    <TouchableOpacity
                        onPress={() => onVersePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.verseRow,
                            highlightColorId && [styles.highlightedRow, { backgroundColor: getHighlightColorValue(highlightColorId) }],
                            isBlinking && [styles.blinkingRow, { backgroundColor: readerColors.primaryContainer }],
                            isSelected && [styles.selectedRow, { backgroundColor: readerColors.surfaceVariant, borderLeftColor: readerColors.primary }],
                        ]}>
                            <Text style={[styles.verseText, {
                                fontSize: ms(22 * fontSizeMultiplier),
                                lineHeight: ms(26 * fontSizeMultiplier),
                                color: readerColors.text,
                                textAlign: textAlign as any
                            }]}>
                                <Text style={{ color: readerColors.primary, fontWeight: '700', fontSize: ms(16 * fontSizeMultiplier), marginLeft: 16, marginRight: 8 }}>
                                    {`${item.verse} `}
                                </Text>
                                {item.text}
                            </Text>
                        </View>
                    </TouchableOpacity>
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
        backgroundColor: '#ffffff',
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    chapterHeaderText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#008080',
        letterSpacing: 0.5,
    },
    verseRow: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 0,
        marginHorizontal: 0,
    },
    highlightedRow: {
        backgroundColor: '#fffacd',
    },
    blinkingRow: {
        backgroundColor: '#e6f2ff',
    },
    selectedRow: {
        backgroundColor: '#e0f2f1',
        borderLeftWidth: 3,
        borderLeftColor: '#008080',
    },
    verseNumber: {
        fontWeight: '700',
        color: '#008080',
        marginBottom: 4,
    },
    verseText: {
        fontSize: 22,
        lineHeight: 26,
        color: '#333',
        flexWrap: 'wrap',
        textAlignVertical: 'top',
    },
    readerContent: {
        paddingBottom: 150,
    },
});
