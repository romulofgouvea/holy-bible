import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

type BibleGridBlockProps = {
  title: string | number;
  widthPercentage?: number;
  exactWidth?: number;
  onPress: () => void;
};

export function BibleGridBlock({ title, widthPercentage, exactWidth, onPress }: BibleGridBlockProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.gridItem,
        exactWidth ? { width: exactWidth } : widthPercentage ? { width: `${widthPercentage}%` } : {},
        { backgroundColor: colors.surfaceVariant, borderColor: colors.border }
      ]}
      onPress={onPress}
    >
      <BibleText style={[styles.gridText, { fontSize: ms(16), color: colors.primary }]} numberOfLines={1}>
        {title}
      </BibleText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridText: {
    fontWeight: '800',
  }
});
