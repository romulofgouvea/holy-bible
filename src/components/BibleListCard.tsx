import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

type BibleListCardProps = {
  title: string;
  pillText?: string | number;
  isSelected?: boolean;
  onPress: () => void;
};

export function BibleListCard({ title, pillText, isSelected, onPress }: BibleListCardProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={[
        styles.card, 
        { 
          backgroundColor: isSelected ? colors.primary + '10' : colors.surface, 
          borderColor: isSelected ? colors.primary : colors.border 
        }
      ]} 
      onPress={onPress}
    >
      <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: isSelected ? colors.primary : colors.onSurface }]}>{title}</BibleText>
      {pillText !== undefined && (
        <View style={[styles.pill, { backgroundColor: isSelected ? colors.primary : colors.surfaceHighlight, borderColor: isSelected ? colors.primary : colors.border }]}>
          <BibleText style={[styles.pillText, { fontSize: ms(13), color: isSelected ? colors.onPrimary : colors.primary }]}>{pillText}</BibleText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
    marginRight: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontWeight: '800',
  },
});
