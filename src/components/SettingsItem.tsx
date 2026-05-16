import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

interface SettingsItemProps {
  label: string;
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showDivider?: boolean;
  isDanger?: boolean;
}

export function SettingsItem({
  label,
  description,
  icon,
  onPress,
  rightElement,
  showDivider = false,
  isDanger = false,
}: SettingsItemProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: ms(DESIGN.spacing.lg),
      gap: ms(DESIGN.spacing.md),
    },
    textContainer: {
      flex: 1,
      gap: ms(DESIGN.spacing.xs),
    },
    label: {
      fontWeight: '700',
    },
    description: {
      lineHeight: ms(DESIGN.fontSize.xl),
    },
    right: {
      marginLeft: 'auto',
    },
  }), [ms, colors, DESIGN]);

  const dangerColor = (colors as any).error || '#EF4444';
  const labelColor = isDanger ? dangerColor : colors.onBackground;
  const iconColor = isDanger ? dangerColor : undefined;

  const Content = (
    <View style={[styles.container, showDivider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <BibleIcon
        name={icon}
        color={iconColor || colors.primary}
        backgroundColor={(iconColor || colors.primary) + '15'}
        containerSize={ms(DESIGN.icon.xl)}
        borderRadius={ms(DESIGN.borderRadius.md)}
      />
      <View style={styles.textContainer}>
        <BibleText style={[styles.label, { fontSize: ms(DESIGN.fontSize.lg), color: labelColor }]} numberOfLines={2}>
          {label}
        </BibleText>
        {description && (
          <BibleText style={[styles.description, { fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted }]} numberOfLines={2}>
            {description}
          </BibleText>
        )}
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}
