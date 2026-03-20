import React from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    highlights: Record<string, boolean>;
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

    return (
        <SectionList
            ref={listRef}
            style={[styles.verseList, { backgroundColor: colors.background }]}
            sections={sections}
            extraData={{ blinkingVerse, highlights, selectedKeys, version, colors }}
            keyExtractor={(item, idx) => `${item.chapter}-${item.verse}-${idx}`}
            onScrollToIndexFailed={onScrollToIndexFailed}
            renderSectionHeader={({ section: { title } }) => (
                <View style={[styles.chapterHeader, { backgroundColor: colors.background }]}>
                    <Text style={[styles.chapterHeaderText, { fontSize: ms(28), color: colors.text }]}>{title}</Text>
                </View>
            )}
            renderItem={({ item }) => {
                const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
                const isHighlighted = highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                const isSelected = selectedKeys[`${bookAbbrev}-${item.chapter}-${item.verse}`];

                return (
                    <TouchableOpacity
                        onPress={() => onVersePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.verseRow,
                            isHighlighted && [styles.highlightedRow, { backgroundColor: colors.surfaceVariant }],
                            isBlinking && [styles.blinkingRow, { backgroundColor: colors.primaryContainer }],
                            isSelected && [styles.selectedRow, { backgroundColor: colors.surface, borderLeftColor: colors.primary }],
                        ]}>
                            <Text style={[styles.verseText, {
                                fontSize: ms(22),
                                lineHeight: ms(26),
                                color: colors.text
                            }]}>
                                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: ms(16), marginLeft: 16, marginRight: 8 }}>
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
