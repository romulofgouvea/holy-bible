import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleHeader } from './BibleHeader';
import { BibleText } from './BibleText';
import { BibleTopMenu } from './BibleTopMenu';

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
    onOpenSearch: () => void;
};

export const BibleTopBar = React.memo((props: BibleTopBarProps) => {
    const { version, bookName, currentChapter, onOpenVersion, onOpenBook, onOpenChapter, onPrevChapter, onNextChapter, onOpenMenu, onOpenSettings, onOpenSearch } = props;
    const { ms } = useResponsive();
    const { colors } = useTheme();
    const { readerColors, readerTheme } = useReaderSettings();
    const [dotsMenuVisible, setDotsMenuVisible] = useState(false);

    const isSepia = readerTheme === 'sepia';
    const headerBg = isSepia ? readerColors.primary : colors.primary;
    const headerContent = isSepia ? readerColors.onPrimary : colors.onPrimary;
    const btnBg = isSepia ? readerColors.primary : colors.surfaceHighlight;

    return (
        <>
            <BibleHeader
                backgroundColor={headerBg}
                contentColor={headerContent}
                menuBtnBackgroundColor={btnBg}
                onMenuPress={onOpenMenu}
                leftContent={
                    <View style={styles.leftButtons}>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10) }]} onPress={onOpenVersion}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: headerContent }]}>{version}</BibleText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10) }]} onPress={onOpenBook}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: headerContent }]}>{bookName}</BibleText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10) }]} onPress={onOpenChapter}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: headerContent }]}>{currentChapter}</BibleText>
                        </TouchableOpacity>
                    </View>
                }
                rightContent={
                    <TouchableOpacity
                        style={[styles.menuButton, { backgroundColor: btnBg, width: ms(38), height: ms(38), borderRadius: ms(10), marginLeft: ms(4) }]}
                        onPress={() => setDotsMenuVisible(true)}
                    >
                        <Feather name="more-vertical" size={ms(20)} color={headerContent} />
                    </TouchableOpacity>
                }
            />

            <BibleTopMenu
                visible={dotsMenuVisible}
                onClose={() => setDotsMenuVisible(false)}
                items={[
                    {
                        icon: 'search',
                        label: 'Pesquisar',
                        onPress: onOpenSearch,
                    },
                    {
                        icon: 'type',
                        label: 'Aparência (Aa)',
                        onPress: onOpenSettings,
                    },
                ]}
            />
        </>
    );
});

const styles = StyleSheet.create({
    leftButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topBarButton: {
        justifyContent: 'center',
    },
    topBarButtonText: {
        fontWeight: '700',
    },
    menuButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
