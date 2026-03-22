import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleHeader } from './BibleHeader';
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
    onOpenSettings: () => void;
};

export const BibleTopBar = React.memo((props: BibleTopBarProps) => {
    const { version, bookName, currentChapter, onOpenVersion, onOpenBook, onOpenChapter, onPrevChapter, onNextChapter, onOpenMenu, onOpenSettings } = props;
    const { ms } = useResponsive();
    const { colors } = useTheme();

    return (
        <BibleHeader
            onMenuPress={onOpenMenu}
            leftContent={
                <View style={styles.leftButtons}>
                    <TouchableOpacity style={styles.topBarButton} onPress={onOpenVersion}>
                        <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: colors.onPrimary }]}>{version}</BibleText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.topBarButton} onPress={onOpenBook}>
                        <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: colors.onPrimary }]}>{bookName}</BibleText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.topBarButton} onPress={onOpenChapter}>
                        <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: colors.onPrimary }]}>{currentChapter}</BibleText>
                    </TouchableOpacity>
                </View>
            }
            rightContent={
                <TouchableOpacity style={styles.menuButton} onPress={onOpenSettings}>
                    <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: colors.onPrimary }}>Aa</BibleText>
                </TouchableOpacity>
            }
        />
    );
});

const styles = StyleSheet.create({
    leftButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topBarButton: {
        height: 38,
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginHorizontal: 3,
    },
    topBarButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    menuButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginLeft: 4,
    },
});
