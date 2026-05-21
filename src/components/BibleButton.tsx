import React, { useMemo } from 'react';
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
  const { ms, DESIGN } = useResponsive();
  
  const getStyles = () => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: ms(DESIGN.borderRadius.md),
      paddingHorizontal: ms(
        size === 'sm' ? DESIGN.spacing.sm : 
        size === 'lg' ? DESIGN.spacing.lg : 
        DESIGN.spacing.md
      ),
      height: ms(
        size === 'sm' ? DESIGN.height.sm : 
        size === 'lg' ? DESIGN.height.lg : 
        DESIGN.height.md
      ),
    };

    const text: TextStyle = {
      fontWeight: '700',
      fontSize: ms(
        size === 'sm' ? DESIGN.fontSize.sm : 
        size === 'lg' ? DESIGN.fontSize.lg : 
        DESIGN.fontSize.md
      ),
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
        icon && iconPosition === 'left' ? { marginLeft: ms(DESIGN.spacing.sm) } : {}, 
        icon && iconPosition === 'right' ? { marginRight: ms(DESIGN.spacing.sm) } : {}, 
        textStyle
      ]}>
        {label}
      </BibleText>
      {icon && iconPosition === 'right' && icon}
    </TouchableOpacity>
  );
}
