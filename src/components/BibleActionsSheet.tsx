import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleDivider } from './BibleDivider';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';

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
  const { ms } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(20, insets.bottom) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <BibleIcon name="menu" color={colors.primary} backgroundColor={colors.primary + '25'} size={ms(16)}
              style={{ marginRight: 8 }}
            />

            <BibleText style={[styles.title, { fontSize: ms(16), color: colors.primary, fontWeight: '800' }]}>{title || 'Ações'}</BibleText>
            <BibleIcon
              name="x"
              color={colors.error}
              backgroundColor={colors.error + '20'}
              onPress={onClose}
              size={ms(18)}
            />
          </View>

          <BibleDivider margin={8} />

          <View style={styles.itemsContainer}>
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
                  style={{ marginRight: 8 }} />
                <BibleText style={[styles.label, { color: item.color || colors.onSurface }]}>{item.label}</BibleText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
  },
  itemsContainer: {
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
