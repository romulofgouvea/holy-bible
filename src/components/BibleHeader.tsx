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
};

export function BibleHeader({ title, leftContent, rightContent, onMenuPress, showMenu = true }: BibleHeaderProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  return (
    <View style={[styles.header, { backgroundColor: colors.primary, minHeight: ms(56) }]}>
      <View style={styles.leftContainer}>
        {showMenu && (
          <TouchableOpacity style={[styles.menuBtn, { width: ms(40), height: ms(40), borderRadius: ms(10), marginRight: ms(8) }]} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={ms(20)} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
        {leftContent ? leftContent : (
          title ? <BibleText style={[styles.title, { fontSize: ms(16), color: colors.onPrimary }]}>{title}</BibleText> : null
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '700',
    includeFontPadding: false,
  },
  menuBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
