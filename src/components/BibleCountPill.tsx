import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { BibleText } from './BibleText';

type BibleCountPillProps = {
  count: number;
  label: string;
  labelPlural?: string;
  style?: ViewStyle;
};

export function BibleCountPill({ count, label, labelPlural, style }: BibleCountPillProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(() => StyleSheet.create({
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ms(DESIGN.borderRadius.lg),
  },
  countNumber: {
    fontWeight: '800',
    fontSize: ms(13),
  },
  countText: {
    fontWeight: '600',
    fontSize: ms(13),
  },
}), [ms, colors, DESIGN]);

  
  const finalLabel = count === 1 ? label : (labelPlural || `${label}s`);

  return (
    <View style={[
      styles.countPill, 
      { 
        backgroundColor: colors.surfaceHighlight, 
        borderColor: colors.primary + '30',
        borderWidth: 1 
      }, 
      style
    ]}>
      <BibleText style={[styles.countNumber, { color: colors.primary }]}>{count}</BibleText>
      <BibleText style={[styles.countText, { color: colors.primary }]}> {finalLabel}</BibleText>
    </View>
  );
}


