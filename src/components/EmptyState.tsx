import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleButton } from './BibleButton';
import { BibleText } from './BibleText';
import { ThemedIcon } from './ThemedIcon';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  return (
    <View style={styles.container}>
      <ThemedIcon name={icon} size={40} />
      <BibleText style={[styles.title, { fontSize: ms(18), color: colors.onBackground, marginTop: 16 }]}>
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
