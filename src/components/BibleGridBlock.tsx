import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

type BibleGridBlockProps = {
  title: string | number;
  widthPercentage?: number;
  exactWidth?: number;
  isSelected?: boolean;
  onPress: () => void;
  testID?: string;
};

export function BibleGridBlock({ title, widthPercentage, exactWidth, isSelected, onPress, testID }: BibleGridBlockProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      style={[
        styles.gridItem,
        exactWidth ? { width: exactWidth } : widthPercentage ? { width: `${widthPercentage}%` } : {},
        { backgroundColor: isSelected ? colors.primary : colors.surfaceHighlight, borderColor: isSelected ? colors.primary : colors.border }
      ]}
      onPress={onPress}
    >
      <BibleText style={[styles.gridText, { fontSize: ms(17), color: isSelected ? colors.onPrimary : colors.primary }]} numberOfLines={1}>
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
