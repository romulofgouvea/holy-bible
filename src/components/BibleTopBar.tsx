import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { BibleText } from './BibleText';

export type BibleTopBarProps = {
    version: string;
    bookName: string;
    currentChapter: number;
    onOpenVersion: () => void;
    onOpenBook: () => void;
    onOpenChapter: () => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    onOpenMenu: () => void;
};

export const BibleTopBar = React.memo((props: BibleTopBarProps) => {
    const { version, bookName, currentChapter, onOpenVersion, onOpenBook, onOpenChapter, onPrevChapter, onNextChapter, onOpenMenu } = props;
    const { ms } = useResponsive();

    return (
        <View style={styles.topBarRow}>
            <View style={styles.leftButtons}>
                <TouchableOpacity style={styles.topBarButton} onPress={onOpenVersion}>
                    <BibleText style={[styles.topBarButtonText, { fontSize: ms(15) }]}>{version}</BibleText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topBarButton} onPress={onOpenBook}>
                    <BibleText style={[styles.topBarButtonText, { fontSize: ms(15) }]}>{bookName}</BibleText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topBarButton} onPress={onOpenChapter}>
                    <BibleText style={[styles.topBarButtonText, { fontSize: ms(15) }]}>{currentChapter}</BibleText>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={onOpenMenu}>
                <Feather name="menu" size={ms(22)} color="#fff" />
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    topBarRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#008080',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topBarButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 3,
    },
    topBarButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    menuButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginLeft: 4,
    },
});
