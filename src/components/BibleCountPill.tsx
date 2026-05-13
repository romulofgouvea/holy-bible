import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

type BibleCountPillProps = {
  count: number;
  label: string;
  labelPlural?: string;
  style?: ViewStyle;
};

export function BibleCountPill({ count, label, labelPlural, style }: BibleCountPillProps) {
  const { colors } = useTheme();
  
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

const styles = StyleSheet.create({
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countNumber: {
    fontWeight: '800',
    fontSize: 13,
  },
  countText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
