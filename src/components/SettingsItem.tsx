import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
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
  const { ms } = useResponsive();
  const dangerColor = (colors as any).error || '#EF4444';
  const labelColor = isDanger ? dangerColor : colors.onBackground;
  const iconColor = isDanger ? dangerColor : undefined;

  const Content = (
    <View style={[styles.container, showDivider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <BibleIcon name={icon} color={iconColor} />
      <View style={styles.textContainer}>
        <BibleText style={[styles.label, { fontSize: ms(16), color: labelColor }]} numberOfLines={2}>
          {label}
        </BibleText>
        {description && (
          <BibleText style={[styles.description, { fontSize: ms(13), color: colors.textMuted }]} numberOfLines={2}>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontWeight: '700',
  },
  description: {
    lineHeight: 18,
  },
  right: {
    marginLeft: 'auto',
  },
});
