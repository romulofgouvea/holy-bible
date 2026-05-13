import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';

export type BibleIconProps = {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  containerSize?: number;
  onPress?: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
  testID?: string;
};

export function BibleIcon({
  name,
  size,
  color,
  backgroundColor,
  borderRadius = 10,
  containerSize = 32,
  onPress,
  style,
  activeOpacity = 0.7,
  testID
}: BibleIconProps) {
  const { ms } = useResponsive();
  const { colors } = useTheme();

  const Container = onPress ? TouchableOpacity : View;
  
  const finalContainerSize = ms(containerSize);
  const finalIconSize = size || ms(containerSize * 0.5); // Default icon size is 50% of container

  return (
    <Container
      testID={testID}
      onPress={onPress}
      activeOpacity={activeOpacity}
      style={[
        styles.container,
        {
          width: finalContainerSize,
          height: finalContainerSize,
          borderRadius: ms(borderRadius),
          backgroundColor: backgroundColor || 'transparent',
        },
        style
      ]}
    >
      <Feather 
        name={name} 
        size={finalIconSize} 
        color={color || colors.onSurface} 
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
