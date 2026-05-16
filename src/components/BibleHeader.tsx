import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { BibleIcon } from './BibleIcon';
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
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(() => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: ms(3) },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftButtonContainer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ms(4),
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
    marginLeft: ms(4),
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
}), [ms, colors, DESIGN]);


  const hasLeftButton = showMenu || showBack;

  return (
    <View testID="bible-header" style={[styles.header, { backgroundColor: backgroundColor || colors.primary, minHeight: ms(56), paddingHorizontal: ms(DESIGN.spacing.lg), paddingVertical: ms(DESIGN.spacing.md), shadowColor: colors.shadow }]}>
      {hasLeftButton && (
        <View style={styles.leftButtonContainer}>
          {showMenu && (
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: menuBtnBackgroundColor || 'transparent', width: ms(44), height: ms(44), borderRadius: ms(DESIGN.borderRadius.md) }]} onPress={onMenuPress} activeOpacity={0.7}>
              <BibleIcon name="menu" size={ms(DESIGN.spacing.xl)} containerSize={44} color={contentColor || colors.onPrimary} />
            </TouchableOpacity>
          )}
          {showBack && (
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: menuBtnBackgroundColor || 'transparent', width: ms(44), height: ms(44), borderRadius: ms(DESIGN.borderRadius.md) }]} onPress={onBack} activeOpacity={0.7}>
              <BibleIcon name={backIcon} size={ms(26)} containerSize={44} color={contentColor || colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.centerContainer}>
        {leftContent}
        {title && (
          <BibleText style={[styles.title, { fontSize: ms(DESIGN.spacing.lg), color: contentColor || colors.onPrimary }]} numberOfLines={1}>
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


