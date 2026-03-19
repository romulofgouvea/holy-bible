import React from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    bookAbbrev: string;
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

export const VerseReader = React.memo((props: VerseReaderProps) => {
    const { 
        sections, blinkingVerse, highlights, bookAbbrev, 
        onVersePress, onViewableItemsChanged, viewabilityConfig, listRef, onScrollToIndexFailed 
    } = props;

    return (
        <SectionList
            ref={listRef}
            style={styles.verseList}
            sections={sections}
            extraData={{ blinkingVerse, highlights }}
            keyExtractor={(item, idx) => `${item.chapter}-${item.verse}-${idx}`}
            onScrollToIndexFailed={onScrollToIndexFailed}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.chapterHeader}>
                    <Text style={styles.chapterHeaderText}>{title}</Text>
                </View>
            )}
            renderItem={({ item }) => {
                const isBlinking = blinkingVerse === `${item.chapter}-${item.verse}`;
                const isHighlighted = highlights[`${bookAbbrev}-${item.chapter}-${item.verse}`];
                
                return (
                    <TouchableOpacity 
                        onPress={() => onVersePress(item)} 
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.verseRow,
                            isHighlighted && styles.highlightedRow,
                            isBlinking && styles.blinkingRow
                        ]}>
                            <Text style={styles.verseText}>{`   ${item.verse} ${item.text}`}</Text>
                        </View>
                    </TouchableOpacity>
                );
            }}
            contentContainerStyle={styles.readerContent}
            initialNumToRender={20}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            stickySectionHeadersEnabled={false}
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    highlightedRow: {
        backgroundColor: '#fffacd',
    },
    blinkingRow: {
        backgroundColor: '#e6f2ff',
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
        paddingBottom: 24,
    },
});
