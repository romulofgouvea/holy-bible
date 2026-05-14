import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTES, ROUTE_LABELS } from '../constants/routes';
import { useReaderSettings } from '../hooks/use-reader-settings';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleActionsDrawer } from './BibleActionsDrawer';
import { BibleHeader } from './BibleHeader';
import { BibleIcon } from './BibleIcon';
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
    onOpenSearch: () => void;
    onOpenHistory: () => void;
};

export const BibleTopBar = React.memo((props: BibleTopBarProps) => {
    const { version, bookName, currentChapter, onOpenVersion, onOpenBook, onOpenChapter, onPrevChapter, onNextChapter, onOpenMenu, onOpenSettings, onOpenSearch, onOpenHistory } = props;
    const { ms } = useResponsive();
    const { colors } = useTheme();
    const { readerColors, readerTheme } = useReaderSettings();
    const [dotsMenuVisible, setDotsMenuVisible] = useState(false);

    const isSepia = readerTheme === 'sepia';
    const headerBg = isSepia ? readerColors.primary : colors.primary;
    const headerContent = isSepia ? readerColors.onPrimary : colors.onPrimary;
    const btnBg = colors.onPrimary + '4D';
    const btnText = colors.onPrimary;

    return (
        <>
            <BibleHeader
                backgroundColor={headerBg}
                contentColor={headerContent}
                menuBtnBackgroundColor="transparent"
                onMenuPress={onOpenMenu}
                leftContent={
                    <View style={styles.leftButtons}>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), flexShrink: 0 }]} onPress={onOpenVersion}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: btnText }]}>{version}</BibleText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), flexShrink: 1, minWidth: 0 }]} onPress={onOpenBook}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: btnText }]} numberOfLines={1}>{bookName}</BibleText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.topBarButton, { backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), flexShrink: 0 }]} onPress={onOpenChapter}>
                            <BibleText style={[styles.topBarButtonText, { fontSize: ms(15), color: btnText }]}>{currentChapter}</BibleText>
                        </TouchableOpacity>
                    </View>
                }
                rightContent={
                    <TouchableOpacity
                        style={[styles.menuButton, { backgroundColor: 'transparent', width: ms(38), height: ms(38), borderRadius: ms(10), marginLeft: ms(4), alignItems: 'center', justifyContent: 'center' }]}
                        onPress={() => setDotsMenuVisible(true)}
                    >
                        <BibleIcon name="more-vertical" size={ms(20)} color={headerContent} />
                    </TouchableOpacity>
                }
            />

            <BibleActionsDrawer
                visible={dotsMenuVisible}
                onClose={() => setDotsMenuVisible(false)}
                title="Ações"
                items={[
                    {
                        icon: 'search',
                        label: ROUTE_LABELS[ROUTES.SEARCH],
                        onPress: onOpenSearch,
                    },
                    {
                        icon: 'clock',
                        label: ROUTE_LABELS.HISTORY,
                        onPress: onOpenHistory,
                    },
                    {
                        icon: 'type',
                        label: ROUTE_LABELS.APPEARANCE,
                        onPress: onOpenSettings,
                    },
                ]}
            />
        </>
    );
});

const styles = StyleSheet.create({
    leftButtons: {
        flex: 1,
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
