import React from 'react';
import { DimensionValue, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BibleDividerProps {
  vertical?: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle;
  margin?: number;
  height?: DimensionValue;
  width?: DimensionValue;
}

export function BibleDivider({
  vertical = false,
  size = 1,
  color,
  style,
  margin = 0,
  height = '100%',
  width = '100%',
}: BibleDividerProps) {
  const { colors } = useTheme();

  const dividerStyle: ViewStyle = {
    backgroundColor: color || colors.border,
    ...(vertical ? {
      width: size,
      height,
      marginHorizontal: margin,
    } : {
      height: size,
      width,
      marginVertical: margin,
    }),
  };

  return <View style={[dividerStyle, style]} />;
}
