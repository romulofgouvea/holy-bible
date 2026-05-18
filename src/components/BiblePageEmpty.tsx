import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { BibleButton } from './BibleButton';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

interface BiblePageEmptyProps {
  title: string;
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function BiblePageEmpty({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: BiblePageEmptyProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ms(DESIGN.spacing.xxl),
    },
    title: {
      fontWeight: '800',
      textAlign: 'center',
    },
    description: {
      textAlign: 'center',
      lineHeight: ms(DESIGN.fontSize.lg * 1.3),
    },
  }), [ms, colors, DESIGN]);


  return (
    <View style={styles.container}>
      <BibleIcon
        name={icon}
        size={ms(DESIGN.icon.xl * 1.8)}
        containerSize={ms(DESIGN.icon.xl * 2)}
        color={colors.textMuted}
      />
      <BibleText style={[styles.title, { fontSize: ms(DESIGN.fontSize.xxl), color: colors.textMuted, marginTop: ms(DESIGN.spacing.xl) }]}>
        {title}
      </BibleText>
      {description && (
        <BibleText style={[styles.description, { fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted, marginTop: ms(DESIGN.spacing.sm) }]}>
          {description}
        </BibleText>
      )}
      {actionLabel && onAction && (
        <BibleButton
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: ms(DESIGN.spacing.xl) }}
          variant="outline"
        />
      )}
    </View>
  );
}


