import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TopBarProps = {
    version: string;
    bookName: string;
    currentChapter: number;
    onOpenVersion: () => void;
    onOpenBook: () => void;
    onOpenChapter: () => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
};

export const TopBar = React.memo((props: TopBarProps) => {
    const { version, bookName, currentChapter, onOpenVersion, onOpenBook, onOpenChapter, onPrevChapter, onNextChapter } = props;

    return (
        <View style={styles.topBarRow}>
            <TouchableOpacity style={styles.topBarButton} onPress={onOpenVersion}>
                <Text style={styles.topBarButtonText}>{version}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarButton} onPress={onOpenBook}>
                <Text style={styles.topBarButtonText}>{bookName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarButton} onPress={onOpenChapter}>
                <Text style={styles.topBarButtonText}>{currentChapter}</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    topBarRow: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#008080',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    topBarButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 4,
    },
    smallTopBarButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    topBarButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
