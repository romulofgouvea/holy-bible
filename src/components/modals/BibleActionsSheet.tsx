import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';

export type BibleActionItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  iconColor?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: BibleActionItem[];
  title?: string;
};

export function BibleActionsSheet({ visible, onClose, items, title }: Props) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      flex: 1,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: ms(DESIGN.spacing.sm),
    },
    label: {
      fontSize: ms(DESIGN.fontSize.lg),
      fontWeight: '700',
    },
  }), [ms, colors, DESIGN]);

  return (
    <BibleBottomSheet
      visible={visible}
      onClose={onClose}
      resizable={false}
      header={
        <View style={styles.header}>
          <BibleIcon 
            name="menu" 
            color={colors.primary} 
            backgroundColor={colors.primary + '25'} 
            size={ms(DESIGN.spacing.lg)}
            style={{ marginRight: ms(DESIGN.spacing.sm) }}
          />

          <BibleText style={[styles.title, { fontSize: ms(DESIGN.fontSize.lg), color: colors.primary, fontWeight: '800' }]}>{title || 'Ações'}</BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
          />
        </View>
      }
    >
      <View>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.item, { borderBottomWidth: index < items.length - 1 ? 1 : 0, borderBottomColor: colors.border }]}
            onPress={() => {
              onClose();
              item.onPress();
            }}
          >
            <BibleIcon name={item.icon}
              color={item.iconColor || colors.primary}
              backgroundColor={(item.iconColor || colors.primary) + '15'}
              style={{ marginRight: ms(DESIGN.spacing.sm) }} />
            <BibleText style={[styles.label, { color: item.color || colors.onSurface }]}>{item.label}</BibleText>
          </TouchableOpacity>
        ))}
      </View>
    </BibleBottomSheet>
  );
}
