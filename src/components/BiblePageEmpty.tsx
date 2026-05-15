import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
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
  const { ms } = useResponsive();

  return (
    <View style={styles.container}>
      <BibleIcon name={icon} size={ms(48)} containerSize={80} color={colors.textMuted} />
      <BibleText style={[styles.title, { fontSize: ms(18), color: colors.textMuted, marginTop: 16 }]}>
        {title}
      </BibleText>
      {description && (
        <BibleText style={[styles.description, { fontSize: ms(14), color: colors.textMuted, marginTop: 8 }]}>
          {description}
        </BibleText>
      )}
      {actionLabel && onAction && (
        <BibleButton
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: 24 }}
          variant="outline"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    textAlign: 'center',
  },
  title: {
    fontWeight: '800',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
