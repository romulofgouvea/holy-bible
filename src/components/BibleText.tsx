import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

import { useReaderSettings } from '../hooks/use-reader-settings';

interface BibleTextProps extends TextProps {
  variant?: 'ui' | 'reading';
}

export function BibleText(props: BibleTextProps) {
  const { style, variant = 'ui', ...rest } = props;
  const { readerFontFamily } = useReaderSettings();
  const flatStyle = StyleSheet.flatten(style) || {};
  
  let fontFamily = variant === 'reading' ? readerFontFamily : 'Poppins_400Regular';

  if (variant === 'ui' && flatStyle.fontWeight) {
    const weight = String(flatStyle.fontWeight);
    if (weight === '500') fontFamily = 'Poppins_500Medium';
    else if (weight === '600') fontFamily = 'Poppins_600SemiBold';
    else if (weight === '700' || weight === 'bold') fontFamily = 'Poppins_700Bold';
    else if (weight === '800' || weight === '900') fontFamily = 'Poppins_800ExtraBold';
  }

  return (
    <RNText 
      {...rest} 
      style={[{ fontFamily, includeFontPadding: false }, style]} 
    />
  );
}
