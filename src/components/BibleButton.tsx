import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { BibleText } from './BibleText';

interface BibleButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function BibleButton({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  disabled,
  ...rest
}: BibleButtonProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  const getStyles = () => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: ms(12),
      paddingHorizontal: ms(size === 'sm' ? 12 : size === 'lg' ? 24 : 16),
      height: ms(size === 'sm' ? 36 : size === 'lg' ? 52 : 44),
    };

    const text: TextStyle = {
      fontWeight: '700',
      fontSize: ms(size === 'sm' ? 13 : size === 'lg' ? 16 : 14),
    };

    switch (variant) {
      case 'outline':
        return { 
          container: { ...base, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' }, 
          text: { ...text, color: colors.primary } 
        };
      case 'ghost':
        return { 
          container: { ...base, backgroundColor: 'transparent' }, 
          text: { ...text, color: colors.primary } 
        };
      case 'danger':
        return { 
          container: { ...base, backgroundColor: colors.error }, 
          text: { ...text, color: colors.onError } 
        };
      default:
        return { 
          container: { ...base, backgroundColor: colors.primary }, 
          text: { ...text, color: colors.onPrimary } 
        };
    }
  };

  const s = getStyles();

  return (
    <TouchableOpacity
      {...rest}
      disabled={disabled}
      style={[s.container, disabled && { opacity: 0.5 }, style]}
      activeOpacity={0.75}
    >
      {icon && iconPosition === 'left' && icon}
      <BibleText style={[
        s.text, 
        icon && iconPosition === 'left' ? { marginLeft: ms(8) } : {}, 
        icon && iconPosition === 'right' ? { marginRight: ms(8) } : {}, 
        textStyle
      ]}>
        {label}
      </BibleText>
      {icon && iconPosition === 'right' && icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
