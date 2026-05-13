import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

export type BibleHeaderProps = {
  title?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onMenuPress?: () => void;
  showMenu?: boolean;
  onBack?: () => void;
  showBack?: boolean;
  backIcon?: keyof typeof Feather.glyphMap;
  backgroundColor?: string;
  contentColor?: string;
  menuBtnBackgroundColor?: string;
};

export function BibleHeader({
  title,
  leftContent,
  rightContent,
  onMenuPress,
  showMenu = true,
  onBack,
  showBack = false,
  backIcon = 'arrow-left',
  backgroundColor,
  contentColor,
  menuBtnBackgroundColor
}: BibleHeaderProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  const hasLeftButton = showMenu || showBack;

  return (
    <View testID="bible-header" style={[styles.header, { backgroundColor: backgroundColor || colors.primary, minHeight: ms(56), paddingHorizontal: ms(16), paddingVertical: ms(12), shadowColor: colors.shadow }]}>
      {hasLeftButton && (
        <View style={styles.leftButtonContainer}>
          {showMenu && (
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: menuBtnBackgroundColor || 'transparent', width: ms(40), height: ms(40), borderRadius: ms(10) }]} onPress={onMenuPress} activeOpacity={0.7}>
              <Feather name="menu" size={ms(20)} color={contentColor || colors.onPrimary} />
            </TouchableOpacity>
          )}
          {showBack && (
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: menuBtnBackgroundColor || 'transparent', width: ms(40), height: ms(40), borderRadius: ms(10) }]} onPress={onBack} activeOpacity={0.7}>
              <Feather name={backIcon} size={ms(22)} color={contentColor || colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.centerContainer}>
        {leftContent}
        {title && (
          <BibleText style={[styles.title, { fontSize: ms(16), color: contentColor || colors.onPrimary }]} numberOfLines={1}>
            {title}
          </BibleText>
        )}
      </View>

      {rightContent && (
        <View style={styles.rightContainer}>
          {rightContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftButtonContainer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  centerContainer: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rightContainer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '700',
    includeFontPadding: false,
    flexShrink: 1,
  },
  menuBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
