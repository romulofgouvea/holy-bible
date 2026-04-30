import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../hooks/use-theme';
import { useResponsive } from '../hooks/use-responsive';

interface ThemedIconProps {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ThemedIcon({ 
  name, 
  size = 20, 
  color, 
  backgroundColor, 
  borderRadius = 10,
  style 
}: ThemedIconProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  const finalSize = ms(size);
  const wrapSize = finalSize + ms(18);

  return (
    <View style={[
      styles.iconWrap, 
      { 
        backgroundColor: backgroundColor || colors.primary, 
        width: wrapSize, 
        height: wrapSize, 
        borderRadius: ms(borderRadius) 
      }, 
      style
    ]}>
      <Feather name={name} size={finalSize} color={color || colors.onPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
