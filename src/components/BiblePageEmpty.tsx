import { Feather } from '@expo/vector-icons';
import React from 'react';
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
  const { ms } = useResponsive();

  return (
    <View style={styles.container}>
      <BibleIcon name={icon} size={ms(72)} containerSize={72} color={colors.textMuted} />
      <BibleText style={[styles.title, { fontSize: ms(22), color: colors.textMuted, marginTop: 24 }]}>
        {title}
      </BibleText>
      {description && (
        <BibleText style={[styles.description, { fontSize: ms(16), color: colors.textMuted, marginTop: 8 }]}>
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
